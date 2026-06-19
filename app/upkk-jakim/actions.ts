'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import {
  upkkComponentsByType,
  type UpkkJakimAssessmentType,
} from '@/lib/upkkJakim';

export type UpkkJakimActionState = {
  ok: boolean;
  message: string;
};

function cleanNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function isUpkkAssessmentType(value: string): value is UpkkJakimAssessmentType {
  return value === 'PCHI' || value === 'AMALI_SOLAT';
}

const UPKK_STUDENT_YEAR = 5;

export async function saveUpkkJakimMarks(
  _previousState: UpkkJakimActionState,
  formData: FormData,
): Promise<UpkkJakimActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const assessmentType = String(formData.get('assessment_type') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim() || null;
  const studentIds = formData
    .getAll('student_id')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!kodSekolah || !classId || !Number.isFinite(tahunAkademik) || !isUpkkAssessmentType(assessmentType)) {
    return { ok: false, message: 'Pilih sekolah, tahun akademik, kelas dan jenis borang terlebih dahulu.' };
  }

  if (studentIds.length === 0) {
    return { ok: false, message: 'Tiada murid untuk disimpan.' };
  }

  const { data: selectedClass, error: classError } = await supabase
    .from('classes')
    .select('id,tahun,kod_sekolah,tahun_akademik,status')
    .eq('id', classId)
    .eq('kod_sekolah', kodSekolah)
    .eq('tahun_akademik', tahunAkademik)
    .maybeSingle();

  if (classError) {
    return { ok: false, message: `Gagal semak kelas UPKK. Ralat: ${classError.message}` };
  }

  if (!selectedClass || selectedClass.status !== 'AKTIF' || selectedClass.tahun !== UPKK_STUDENT_YEAR) {
    return {
      ok: false,
      message: 'UPKK JAKIM hanya boleh disimpan untuk kelas Tahun 5 yang aktif.',
    };
  }

  const components = upkkComponentsByType(assessmentType);
  const rows = studentIds.flatMap((studentId) =>
    components.map((component) => {
      const markah = cleanNumber(formData.get(`markah_${studentId}_${component.key}`));
      const catatan = String(formData.get(`catatan_${studentId}_${component.key}`) ?? '').trim();

      return {
        tahun_akademik: tahunAkademik,
        kod_sekolah: kodSekolah,
        class_id: classId,
        student_id: studentId,
        assessment_type: assessmentType,
        component_key: component.key,
        component_title: `${component.section}: ${component.title}`,
        max_mark: component.maxMark,
        markah,
        teacher_id: teacherId,
        catatan: catatan || null,
      };
    }),
  );

  const invalid = rows.find((row) => row.markah !== null && (row.markah < 0 || row.markah > row.max_mark));
  if (invalid) {
    return {
      ok: false,
      message: `${invalid.component_title} tidak boleh kurang 0 atau lebih ${invalid.max_mark}.`,
    };
  }

  const { error } = await supabase.from('upkk_jakim_marks').upsert(rows, {
    onConflict: 'tahun_akademik,class_id,student_id,assessment_type,component_key',
  });

  if (error) {
    return {
      ok: false,
      message: `Gagal simpan markah UPKK JAKIM. Jalankan SQL 035_upkk_jakim_module.sql dahulu. Ralat: ${error.message}`,
    };
  }

  revalidatePath('/upkk-jakim');
  return { ok: true, message: `${studentIds.length} rekod ${assessmentType === 'PCHI' ? 'PCHI' : 'Amali Solat'} berjaya disimpan.` };
}
