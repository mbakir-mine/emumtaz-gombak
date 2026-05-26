'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type ClassActionState = {
  ok: boolean;
  message: string;
};

function classStem(name: string) {
  return name.replace(/^\s*\d+\s*/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function nextClassName(tahun: number, namaKelas: string) {
  return `${tahun + 1} ${classStem(namaKelas)}`;
}

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

  const rows = [
    {
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik,
      tahun,
      nama_kelas: namaKelas,
      status: 'AKTIF',
    },
  ];

  if (tahun < 6) {
    rows.push({
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik + 1,
      tahun: tahun + 1,
      nama_kelas: nextClassName(tahun, namaKelas),
      status: 'AKTIF',
    });
  }

  const { error } = await supabase.from('classes').upsert(rows, {
    onConflict: 'kod_sekolah,tahun_akademik,tahun,nama_kelas',
  });

  if (error) {
    return { ok: false, message: `Gagal simpan kelas: ${error.message}` };
  }

  revalidatePath('/kelas');
  revalidatePath('/');
  return {
    ok: true,
    message:
      tahun < 6
        ? `Kelas ${namaKelas} berjaya disimpan bersama kelas cadangan ${nextClassName(tahun, namaKelas)} untuk ${tahunAkademik + 1}.`
        : `Kelas ${namaKelas} berjaya disimpan.`,
  };
}
