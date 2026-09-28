'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { navItems } from '@/lib/access';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type UserStatusActionState = { ok: boolean; message: string };
const statuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const roles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const navKeys = navItems.filter((item) => !item.hidden && item.key !== 'dashboard').map((item) => item.key);

async function call(path: string, method: string, body?: unknown) {
  const base = getTrustedSelfHostedUrl();
  if (!base) throw new Error('Backend self-hosted belum disambungkan.');
  const headers = new Headers({ Cookie: (await cookies()).toString() });
  if (body !== undefined) headers.set('Content-Type', 'application/json');
  return fetch(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), cache: 'no-store' });
}

function clean(value: FormDataEntryValue | null) { return String(value ?? '').trim().toUpperCase(); }
function ids(formData: FormData) { return formData.getAll('user_ids').map(String).filter(Boolean); }
function refreshUsers(id?: string) { revalidatePath('/pengguna'); revalidatePath('/guru'); revalidatePath('/'); if (id) revalidatePath(`/pengguna/${id}`); }

export async function updateUserStatusOnly(_state: UserStatusActionState, formData: FormData): Promise<UserStatusActionState> {
  const id = String(formData.get('id') ?? '').trim(); const status = clean(formData.get('status'));
  if (!id || !statuses.includes(status)) return { ok: false, message: 'Status tidak sah.' };
  const response = await call(`/api/admin/users/${id}/${status === 'AKTIF' ? 'activate' : 'status'}`, status === 'AKTIF' ? 'POST' : 'PATCH', status === 'AKTIF' ? undefined : { status });
  const payload = await response.json().catch(() => null) as { temporary_password?: string; message?: string } | null;
  if (!response.ok) return { ok: false, message: payload?.message ?? `Gagal kemaskini status (${response.status}).` };
  refreshUsers(id); return { ok: true, message: payload?.temporary_password ? `Pengguna diaktifkan. Kata laluan sementara: ${payload.temporary_password}.` : `Status pengguna dikemaskini kepada ${status}.` };
}

export async function bulkUpdateUserStatusOnly(_state: UserStatusActionState, formData: FormData): Promise<UserStatusActionState> {
  const status = clean(formData.get('status')); const selected = ids(formData);
  if (!statuses.includes(status) || !selected.length) return { ok: false, message: 'Status atau pengguna tidak sah.' };
  for (const id of selected) {
    const response = await call(`/api/admin/users/${id}/${status === 'AKTIF' ? 'activate' : 'status'}`, status === 'AKTIF' ? 'POST' : 'PATCH', status === 'AKTIF' ? undefined : { status });
    if (!response.ok) return { ok: false, message: `Gagal kemaskini pengguna (${response.status}).` };
  }
  refreshUsers(); return { ok: true, message: `${selected.length} status pengguna berjaya dikemaskini kepada ${status}.` };
}

export async function updateUserStatus(_state: UserStatusActionState, formData: FormData): Promise<UserStatusActionState> {
  const id = String(formData.get('id') ?? '').trim(); const status = clean(formData.get('status')); const role = clean(formData.get('role')); const zon = clean(formData.get('zon'));
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim() || null;
  const allowedNav = formData.getAll('allowed_nav').map(String).filter((value) => navKeys.includes(value));
  if (!id || !statuses.includes(status) || !roles.includes(role)) return { ok: false, message: 'Role atau status tidak sah.' };
  const response = await call(`/api/admin/users/${id}`, 'PATCH', { status, role, zon: zon || null, kod_sekolah: kodSekolah, allowed_nav: allowedNav });
  const payload = await response.json().catch(() => null) as { message?: string } | null;
  if (!response.ok) return { ok: false, message: payload?.message ?? `Gagal simpan pengguna (${response.status}).` };
  refreshUsers(id); return { ok: true, message: 'Profil pengguna berjaya dikemaskini.' };
}

export async function resetUserPassword(_state: UserStatusActionState, formData: FormData): Promise<UserStatusActionState> {
  const id = String(formData.get('id') ?? '').trim(); if (!id) return { ok: false, message: 'Pengguna tidak sah.' };
  const response = await call(`/api/admin/users/${id}/reset-password`, 'POST');
  const payload = await response.json().catch(() => null) as { temporary_password?: string; message?: string } | null;
  if (!response.ok || !payload?.temporary_password) return { ok: false, message: payload?.message ?? `Gagal reset password (${response.status}).` };
  refreshUsers(id); return { ok: true, message: `Kata laluan sementara: ${payload.temporary_password}. Salin dan berikan kepada pengguna secara peribadi.` };
}

export async function deleteUserProfile(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim(); if (!id) return;
  await call(`/api/admin/users/${id}`, 'DELETE'); refreshUsers(); redirect('/pengguna');
}
