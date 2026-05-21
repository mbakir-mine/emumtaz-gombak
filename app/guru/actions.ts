'use server';

import { revalidatePath } from 'next/cache';
import { parseCsv, pickValue } from '@/lib/csv';
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

const allowedImportRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];

function normalizeRole(value: string) {
  const clean = value.trim().toUpperCase().replace(/\s+/g, '_');
  const mapped: Record<string, string> = {
    ADMIN_DAERAH: 'ADMIN_DAERAH',
    ADMIN_ZON: 'ADMIN_ZON',
    ADMIN_SEKOLAH: 'ADMIN_SEKOLAH',
    GURU_KELAS: 'GURU_KELAS',
    GURU_SUBJEK: 'GURU_SUBJEK',
  };

  return mapped[clean] ?? 'GURU_SUBJEK';
}

export async function importTeachers(
  _previousState: TeacherActionState,
  formData: FormData,
): Promise<TeacherActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const file = formData.get('csv_file');
  const defaultStatus = String(formData.get('default_status') ?? 'MENUNGGU').trim().toUpperCase();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Sila pilih fail CSV pengguna.' };
  }

  const parsed = parseCsv(await file.text());
  const rows = parsed.rows
    .map((row) => {
      const role = normalizeRole(pickValue(row, ['role', 'peranan']));
      return {
        nama: pickValue(row, ['nama', 'nama_guru', 'nama_pengguna', 'nama_penuh']).toUpperCase(),
        email: pickValue(row, ['email', 'emel']).toLowerCase(),
        role,
        kod_sekolah: ['ADMIN_DAERAH', 'ADMIN_ZON'].includes(role)
          ? null
          : pickValue(row, ['kod_sekolah', 'kod sekolah', 'sekolah']).toUpperCase(),
        zon: role === 'ADMIN_ZON' ? pickValue(row, ['zon']).toUpperCase() : null,
        status: pickValue(row, ['status']).toUpperCase() || defaultStatus,
      };
    })
    .filter((row) => row.nama && row.email && allowedImportRoles.includes(row.role));

  if (rows.length === 0) {
    return {
      ok: false,
      message: 'Tiada rekod sah ditemui. Pastikan header CSV ada nama, email, role dan kod_sekolah/zon.',
    };
  }

  const invalid = rows.find((row) => {
    if (row.role === 'ADMIN_ZON') return !['BARAT', 'TIMUR', 'TENGAH'].includes(row.zon ?? '');
    if (['ADMIN_DAERAH'].includes(row.role)) return false;
    return !row.kod_sekolah;
  });

  if (invalid) {
    return { ok: false, message: `Rekod ${invalid.email} tidak lengkap. Semak kod_sekolah atau zon.` };
  }

  const { error } = await supabase.from('app_users').upsert(rows, {
    onConflict: 'email,role,kod_sekolah',
  });

  if (error) {
    return { ok: false, message: `Import pengguna gagal: ${error.message}` };
  }

  revalidatePath('/guru');
  revalidatePath('/pengguna');
  revalidatePath('/');
  return {
    ok: true,
    message: `${rows.length} profil pengguna berjaya diimport. Akaun Auth/login boleh dibuat selepas ini jika belum wujud.`,
  };
}
