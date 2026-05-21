'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { navItems } from '@/lib/access';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];
const allowedNavKeys = navItems.filter((item) => !item.hidden && item.key !== 'dashboard').map((item) => item.key);

export async function updateUserStatus(formData: FormData) {
  if (!supabase) {
    return;
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
    return;
  }

  if (role === 'ADMIN_ZON' && !allowedZones.includes(zon)) {
    return;
  }

  const { data: user } = await supabase.from('app_users').select('role').eq('id', id).maybeSingle();

  if (user?.role === 'OWNER') {
    return;
  }

  const updates: {
    role: string;
    status: string;
    zon?: string | null;
    kod_sekolah?: string | null;
    allowed_nav?: string[] | null;
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

  await supabase.from('app_users').update(updates).eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath(`/pengguna/${id}`);
  revalidatePath('/guru');
  revalidatePath('/');
}
