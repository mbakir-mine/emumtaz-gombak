'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type StudentActionState = {
  ok: boolean;
  message: string;
};

export async function createStudent(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const mykid = String(formData.get('mykid') ?? '').trim();
  const namaMurid = String(formData.get('nama_murid') ?? '').trim().toUpperCase();
  const jantina = String(formData.get('jantina') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();

  if (!mykid || !namaMurid || !jantina || !kodSekolah || !classId) {
    return { ok: false, message: 'Lengkapkan semua medan murid.' };
  }

  const { error } = await supabase.from('students').upsert(
    {
      mykid,
      nama_murid: namaMurid,
      jantina,
      kod_sekolah: kodSekolah,
      class_id: classId,
      status: 'AKTIF',
    },
    {
      onConflict: 'mykid',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal simpan murid: ${error.message}` };
  }

  revalidatePath('/murid');
  revalidatePath('/');
  return { ok: true, message: `${namaMurid} berjaya disimpan.` };
}

