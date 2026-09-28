'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type ClassActionState = {
  ok: boolean;
  message: string;
};

export async function createClass(
  _previousState: ClassActionState,
  formData: FormData,
): Promise<ClassActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const tahun = Number(formData.get('tahun'));
  const namaKelas = String(formData.get('nama_kelas') ?? '').trim().toUpperCase();
  const sesi = String(formData.get('sesi') ?? 'PAGI') === 'PETANG' ? 'PETANG' : 'PAGI';

  if (!kodSekolah || !tahunAkademik || !tahun || !namaKelas) {
    return { ok: false, message: 'Lengkapkan semua medan kelas.' };
  }

  const response = await fetch(`${selfHostedUrl}/api/classes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ kod_sekolah: kodSekolah, tahun_akademik: tahunAkademik, tahun, nama_kelas: namaKelas, sesi }), cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { ok: false, message: 'Gagal simpan kelas pada backend Laravel.' };

  revalidatePath('/kelas');
  revalidatePath('/');
  return { ok: true, message: `Kelas ${namaKelas} berjaya disimpan.` };
}
