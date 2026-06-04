'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { navItems } from '@/lib/access';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];
const allowedNavKeys = navItems.filter((item) => !item.hidden && item.key !== 'dashboard').map((item) => item.key);

export type UserStatusActionState = {
  ok: boolean;
  message: string;
};

function cleanStatus(value: FormDataEntryValue | null) {
  return String(value ?? '').trim().toUpperCase();
}

export async function updateUserStatusOnly(formData: FormData) {
  if (!supabase) return;

  const id = String(formData.get('id') ?? '').trim();
  const status = cleanStatus(formData.get('status'));

  if (!id || !allowedStatuses.includes(status)) return;

  const { data: user } = await supabase.from('app_users').select('role,status').eq('id', id).maybeSingle();

  if (!user || user.role === 'OWNER') return;

  const updates: { status: string; must_change_password?: boolean } = { status };
  if (status === 'AKTIF' && user.status !== 'AKTIF') {
    updates.must_change_password = true;
  }

  await supabase.from('app_users').update(updates).eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
}

export async function bulkUpdateUserStatusOnly(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const status = cleanStatus(formData.get('status'));
  const ids = formData
    .getAll('user_ids')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!allowedStatuses.includes(status)) {
    return { ok: false, message: 'Sila pilih status yang sah.' };
  }

  if (ids.length === 0) {
    return { ok: false, message: 'Tiada pengguna dipilih untuk dikemaskini.' };
  }

  const { data: users } = await supabase
    .from('app_users')
    .select('id,role,status')
    .in('id', ids)
    .neq('role', 'OWNER');

  const safeIds = (users ?? []).map((user) => user.id);
  if (safeIds.length === 0) {
    return { ok: false, message: 'Tiada pengguna yang boleh dikemaskini.' };
  }

  const { error } = await supabase.from('app_users').update({ status }).in('id', safeIds);

  if (error) {
    return { ok: false, message: `Gagal kemaskini status: ${error.message}` };
  }

  if (status === 'AKTIF') {
    const newlyActiveIds = (users ?? [])
      .filter((user) => user.status !== 'AKTIF')
      .map((user) => user.id);

    if (newlyActiveIds.length > 0) {
      await supabase.from('app_users').update({ must_change_password: true }).in('id', newlyActiveIds);
    }
  }

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
  return { ok: true, message: `${safeIds.length} status pengguna berjaya dikemaskini kepada ${status}.` };
}

export async function updateUserStatus(
  _previousState: UserStatusActionState,
  formData: FormData,
): Promise<UserStatusActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  const role = String(formData.get('role') ?? '').trim().toUpperCase();
  const zon = String(formData.get('zon') ?? '').trim().toUpperCase();
  const allowedNav = formData
    .getAll('allowed_nav')
    .map((value) => String(value))
    .filter((value) => allowedNavKeys.includes(value));

  if (!id || !allowedStatuses.includes(status) || !allowedRoles.includes(role)) {
    return { ok: false, message: 'Role atau status tidak sah.' };
  }

  if (role === 'ADMIN_ZON' && !allowedZones.includes(zon)) {
    return { ok: false, message: 'Sila pilih zon untuk Admin Zon.' };
  }

  const { data: user } = await supabase.from('app_users').select('role,status').eq('id', id).maybeSingle();

  if (user?.role === 'OWNER') {
    return { ok: false, message: 'Akaun Pentadbir Utama tidak boleh diubah.' };
  }

  const updates: {
    role: string;
    status: string;
    zon?: string | null;
    kod_sekolah?: string | null;
    allowed_nav?: string[] | null;
    must_change_password?: boolean;
  } = { role, status };

  if (role === 'ADMIN_DAERAH') {
    updates.kod_sekolah = null;
    updates.zon = null;
  }

  if (role === 'ADMIN_ZON') {
    updates.kod_sekolah = null;
    updates.zon = zon;
  }

  updates.allowed_nav = allowedNav.length > 0 ? allowedNav : null;

  if (status === 'AKTIF' && user?.status !== 'AKTIF') {
    updates.must_change_password = true;
  }

  const { error } = await supabase.from('app_users').update(updates).eq('id', id);

  if (error) {
    return { ok: false, message: `Gagal simpan pengguna: ${error.message}` };
  }

  revalidatePath('/pengguna');
  revalidatePath(`/pengguna/${id}`);
  revalidatePath('/guru');
  revalidatePath('/');
  return { ok: true, message: 'Profil pengguna berjaya dikemaskini.' };
}

export async function deleteUserProfile(formData: FormData) {
  if (!supabase) {
    return;
  }

  const id = String(formData.get('id') ?? '').trim();

  if (!id) {
    return;
  }

  const { data: user } = await supabase.from('app_users').select('role').eq('id', id).maybeSingle();

  if (user?.role === 'OWNER') {
    return;
  }

  await supabase.from('app_users').delete().eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
  redirect('/pengguna');
}
