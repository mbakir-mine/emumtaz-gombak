'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type MarkActionState = {
  ok: boolean;
  message: string;
};

export async function saveMarks(
  _previousState: MarkActionState,
  formData: FormData,
): Promise<MarkActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const examId = String(formData.get('exam_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const studentIds = formData.getAll('student_id').map((value) => String(value));

  if (!examId || !classId || !kodSekolah || !kodSubjek || studentIds.length === 0) {
    return { ok: false, message: 'Pilihan peperiksaan, kelas, subjek atau murid tidak lengkap.' };
  }

  const rows = studentIds.map((studentId) => {
    const raw = String(formData.get(`markah_${studentId}`) ?? '').trim();
    const markah = raw === '' ? null : Number(raw);
    return {
      exam_id: examId,
      student_id: studentId,
      kod_sekolah: kodSekolah,
      class_id: classId,
      kod_subjek: kodSubjek,
      markah,
    };
  });

  const invalid = rows.find(
    (row) => row.markah !== null && (!Number.isFinite(row.markah) || row.markah < 0 || row.markah > 100),
  );
  if (invalid) {
    return { ok: false, message: 'Markah mesti antara 0 hingga 100.' };
  }

  const { error } = await supabase.from('marks').upsert(rows, {
    onConflict: 'exam_id,student_id,kod_subjek',
  });

  if (error) {
    return { ok: false, message: `Gagal simpan markah: ${error.message}` };
  }

  revalidatePath('/markah');
  revalidatePath('/analisis');
  revalidatePath('/laporan');
  return { ok: true, message: 'Markah berjaya disimpan.' };
}

