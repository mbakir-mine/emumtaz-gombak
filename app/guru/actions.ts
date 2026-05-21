'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TeacherActionState = {
  ok: boolean;
  message: string;
};

export async function createTeacher(
  _previousState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const nama = String(formData.get('nama') ?? '').trim().toUpperCase();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();

  if (!nama || !email || !role || !kodSekolah) {
    return { ok: false, message: 'Lengkapkan semua medan guru.' };
  }

  if (!['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(role)) {
    return { ok: false, message: 'Role guru tidak sah.' };
  }

  const { error } = await supabase.from('app_users').upsert(
    {
      nama,
      email,
      role,
      kod_sekolah: kodSekolah,
      status: 'AKTIF',
    },
    {
      onConflict: 'email,role,kod_sekolah',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal simpan guru: ${error.message}` };
  }

  revalidatePath('/guru');
  revalidatePath('/');
  return { ok: true, message: `${nama} berjaya disimpan.` };
}

