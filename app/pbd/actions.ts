'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type PbdActionState = {
  ok: boolean;
  message: string;
};

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export async function savePbdMarks(_previousState: PbdActionState, formData: FormData): Promise<PbdActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim() || null;
  const tarikh = String(formData.get('tarikh') ?? '').trim();
  const tajuk = String(formData.get('tajuk') ?? '').trim() || 'Penilaian PBD';
  const instrumen = String(formData.get('instrumen') ?? '').trim() || 'Pemerhatian';
  const markahPenuh = Number(formData.get('markah_penuh') ?? 100);
  const studentIds = formData
    .getAll('student_id')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!kodSekolah || !classId || !tahunAkademik || !kodSubjek || !tarikh || studentIds.length === 0) {
    return { ok: false, message: 'Pilih sekolah, kelas, subjek, tarikh dan murid terlebih dahulu.' };
  }

  if (!Number.isFinite(markahPenuh) || markahPenuh <= 0) {
    return { ok: false, message: 'Markah penuh PBD mesti lebih daripada 0.' };
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('pbd_assessments')
    .upsert(
      {
        kod_sekolah: kodSekolah,
        class_id: classId,
        tahun_akademik: tahunAkademik,
        kod_subjek: kodSubjek,
        teacher_id: teacherId,
        tarikh,
        tajuk,
        instrumen,
        markah_penuh: markahPenuh,
        status: 'AKTIF',
      },
      { onConflict: 'class_id,kod_subjek,tarikh,tajuk,instrumen' },
    )
    .select('id')
    .single();

  if (assessmentError || !assessment) {
    return {
      ok: false,
      message: `Gagal simpan tetapan PBD. Jalankan SQL 034_pbd_continuous_assessment.sql dahulu. Ralat: ${
        assessmentError?.message ?? 'tiada rekod penilaian'
      }`,
    };
  }

  const rows = studentIds.map((studentId) => {
    const markah = numberOrNull(formData.get(`markah_${studentId}`));
    const tahapPenguasaan = numberOrNull(formData.get(`tp_${studentId}`));
    const catatan = String(formData.get(`catatan_${studentId}`) ?? '').trim();

    return {
      assessment_id: assessment.id,
      student_id: studentId,
      markah,
      tahap_penguasaan: tahapPenguasaan,
      catatan: catatan || null,
    };
  });

  const invalidMark = rows.find((row) => row.markah !== null && (row.markah < 0 || row.markah > markahPenuh));
  if (invalidMark) {
    return { ok: false, message: `Markah murid tidak boleh kurang 0 atau lebih ${markahPenuh}.` };
  }

  const invalidTp = rows.find(
    (row) => row.tahap_penguasaan !== null && (row.tahap_penguasaan < 1 || row.tahap_penguasaan > 6),
  );
  if (invalidTp) {
    return { ok: false, message: 'Tahap penguasaan mesti antara 1 hingga 6.' };
  }

  const { error } = await supabase.from('pbd_marks').upsert(rows, {
    onConflict: 'assessment_id,student_id',
  });

  if (error) {
    return { ok: false, message: `Gagal simpan markah PBD: ${error.message}` };
  }

  revalidatePath('/pbd');
  revalidatePath('/laporan/pbd');
  return { ok: true, message: `${rows.length} rekod PBD berjaya disimpan.` };
}
