'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type AmalKhairActionState = {
  ok: boolean;
  message: string;
};

export async function createAmalKhairRecord(
  _previousState: AmalKhairActionState,
  formData: FormData,
): Promise<AmalKhairActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const studentId = String(formData.get('student_id') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '').trim();
  const mata = Number(formData.get('mata') ?? 0);
  const catatan = String(formData.get('catatan') ?? '').trim();

  if (!studentId || !categoryId || !mata) {
    return { ok: false, message: 'Pilih murid, kategori dan mata Amal Khair.' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id,kod_sekolah,class_id,nama_murid')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student) {
    return { ok: false, message: 'Murid tidak ditemui.' };
  }

  const { error } = await supabase.from('amal_khair_records').insert({
    student_id: student.id,
    kod_sekolah: student.kod_sekolah,
    class_id: student.class_id,
    category_id: categoryId,
    mata,
    catatan: catatan || null,
  });

  if (error) {
    if (error.message.includes('amal_khair_records')) {
      return {
        ok: false,
        message: 'Jadual Amal Khair belum wujud. Jalankan SQL 024_optional_school_modules_core.sql di Supabase.',
      };
    }

    return { ok: false, message: `Gagal simpan Amal Khair: ${error.message}` };
  }

  revalidatePath('/amal-khair');
  return { ok: true, message: `Rekod Amal Khair ${student.nama_murid} berjaya disimpan.` };
}
