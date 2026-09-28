'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { parseCsv, pickValue } from '@/lib/csv';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type TeacherActionState = { ok: boolean; message: string };
const allowedStatuses = ['MENUNGGU', 'AKTIF', 'DIGANTUNG'];

async function api(path: string, init: RequestInit = {}) {
  const base = getTrustedSelfHostedUrl();
  if (!base) throw new Error('Backend self-hosted belum disambungkan.');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Cookie', (await cookies()).toString());
  return fetch(`${base}${path}`, { ...init, headers, cache: 'no-store' });
}

function status(formData: FormData) { return String(formData.get('status') ?? '').trim().toUpperCase(); }

export async function updateTeacherStatus(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim(); const value = status(formData);
  if (!id || !allowedStatuses.includes(value)) return;
  await api(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: value }) });
  revalidatePath('/guru'); revalidatePath('/pengguna'); revalidatePath('/');
}

export async function bulkUpdateTeacherStatus(_state: TeacherActionState, formData: FormData): Promise<TeacherActionState> {
  const value = status(formData); const ids = formData.getAll('user_ids').map(String).filter(Boolean);
  if (!allowedStatuses.includes(value)) return { ok: false, message: 'Sila pilih status yang sah.' };
  if (!ids.length) return { ok: false, message: 'Tiada guru dipilih untuk dikemaskini.' };
  for (const id of ids) {
    const response = await api(`/api/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: value }) });
    if (!response.ok) return { ok: false, message: `Gagal kemaskini status guru (${response.status}).` };
  }
  revalidatePath('/guru'); revalidatePath('/pengguna'); revalidatePath('/');
  return { ok: true, message: `${ids.length} status guru berjaya dikemaskini kepada ${value}.` };
}

export async function createTeacher(_state: TeacherActionState, formData: FormData): Promise<TeacherActionState> {
  const name = String(formData.get('nama') ?? '').trim().toUpperCase(); const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const role = String(formData.get('role') ?? '').trim(); const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  if (!name || !email || !role || !kodSekolah) return { ok: false, message: 'Lengkapkan semua medan guru.' };
  if (!['GURU_KELAS', 'GURU_SUBJEK', 'ADMIN_SEKOLAH'].includes(role)) return { ok: false, message: 'Role guru tidak sah.' };
  const response = await api('/api/admin/users', { method: 'POST', body: JSON.stringify({ name, email, role, kod_sekolah: kodSekolah }) });
  if (!response.ok) return { ok: false, message: `Gagal simpan guru (${response.status}).` };
  revalidatePath('/guru'); revalidatePath('/');
  return { ok: true, message: `${name} berjaya didaftarkan. Aktifkan di Pengesahan untuk menjana kata laluan sementara.` };
}

const roleMap: Record<string, string> = { ADMIN_DAERAH: 'ADMIN_DAERAH', ADMIN_ZON: 'ADMIN_ZON', ADMIN_SEKOLAH: 'ADMIN_SEKOLAH', GURU_KELAS: 'GURU_KELAS', GURU_SUBJEK: 'GURU_SUBJEK' };

export async function importTeachers(_state: TeacherActionState, formData: FormData): Promise<TeacherActionState> {
  const file = formData.get('csv_file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Sila pilih fail CSV pengguna.' };
  const defaultStatus = String(formData.get('default_status') ?? 'MENUNGGU').trim().toUpperCase(); const parsed = parseCsv(await file.text());
  let count = 0;
  for (const row of parsed.rows) {
    const roleKey = pickValue(row, ['role', 'peranan']).trim().toUpperCase().replace(/\s+/g, '_');
    const payload = { name: pickValue(row, ['nama', 'nama_guru', 'nama_pengguna', 'nama_penuh']).toUpperCase(), email: pickValue(row, ['email', 'emel']).toLowerCase(), role: roleMap[roleKey] ?? 'GURU_SUBJEK', kod_sekolah: pickValue(row, ['kod_sekolah', 'sekolah']), zon: pickValue(row, ['zon']) || null };
    if (!payload.name || !payload.email || !payload.kod_sekolah) continue;
    if ((await api('/api/admin/users', { method: 'POST', body: JSON.stringify(payload) })).ok) count += 1;
  }
  revalidatePath('/guru'); revalidatePath('/pengguna');
  return { ok: count > 0, message: `${count} pengguna berjaya diimport dengan status ${defaultStatus}.` };
}
