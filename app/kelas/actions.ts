'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type ClassActionState = {
  ok: boolean;
  message: string;
};

export async function createClass(
  _previousState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const tahun = Number(formData.get('tahun'));
  const namaKelas = String(formData.get('nama_kelas') ?? '').trim().toUpperCase();

  if (!kodSekolah || !tahunAkademik || !tahun || !namaKelas) {
    return { ok: false, message: 'Lengkapkan semua medan kelas.' };
  }

  const { error } = await supabase.from('classes').upsert(
    {
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik,
      tahun,
      nama_kelas: namaKelas,
      status: 'AKTIF',
    },
    {
      onConflict: 'kod_sekolah,tahun_akademik,tahun,nama_kelas',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal simpan kelas: ${error.message}` };
  }

  revalidatePath('/kelas');
  revalidatePath('/');
  return { ok: true, message: `Kelas ${namaKelas} berjaya disimpan.` };
}
