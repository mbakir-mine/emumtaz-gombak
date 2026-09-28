'use server';

import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];

export type RegisterUserState = {
  ok: boolean;
  message: string;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function validEmail(value: string) {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function strongPassword(value: string) {
  return value.length >= 8 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}

export async function registerPendingUser(
  _previousState: RegisterUserState,
  formData: FormData,
): Promise<RegisterUserState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

  const nama = readText(formData, 'nama').toUpperCase();
  const email = readText(formData, 'email').toLowerCase();
  const role = readText(formData, 'role').toUpperCase();
  const kodSekolah = readText(formData, 'kod_sekolah');
  const zon = readText(formData, 'zon').toUpperCase();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');
  const website = readText(formData, 'website');

  if (website) return { ok: false, message: 'Permohonan tidak dapat diproses.' };

  if (!nama || nama.length > 120 || !validEmail(email) || !role) {
    return { ok: false, message: 'Sila lengkapkan nama, email dan role.' };
  }
  if (!allowedRoles.includes(role)) {
    return { ok: false, message: 'Role tidak sah.' };
  }

  if (!strongPassword(password)) {
    return { ok: false, message: 'Password mesti sekurang-kurangnya 8 aksara serta mengandungi huruf besar, huruf kecil, nombor dan simbol.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, message: 'Sahkan password tidak sama.' };
  }

  const needsSchool = !['ADMIN_DAERAH', 'ADMIN_ZON'].includes(role);
  const needsZone = role === 'ADMIN_ZON';
  if (needsSchool && !kodSekolah) return { ok: false, message: 'Sila pilih sekolah.' };
  if (needsZone && !allowedZones.includes(zon)) return { ok: false, message: 'Sila pilih zon yang sah.' };

  const response = await fetch(`${selfHostedUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nama, email, role, kod_sekolah: kodSekolah || null, zon: zon || null, password }),
    cache: 'no-store',
  });
  if (!response.ok) return { ok: false, message: 'Pendaftaran tidak dapat diproses. Email mungkin telah digunakan.' };
  return { ok: true, message: 'Pendaftaran berjaya dihantar. Akaun hanya boleh digunakan selepas Admin mengaktifkan status pengguna.' };
}
