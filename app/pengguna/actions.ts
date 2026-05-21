'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const allowedZones = ['BARAT', 'TIMUR', 'TENGAH'];

export async function updateUserStatus(formData: FormData) {
  if (!supabase) {
    return;
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  const role = String(formData.get('role') ?? '').trim().toUpperCase();
  const zon = String(formData.get('zon') ?? '').trim().toUpperCase();

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
  } = { role, status };

  if (role === 'ADMIN_DAERAH') {
    updates.kod_sekolah = null;
    updates.zon = null;
  }

  if (role === 'ADMIN_ZON') {
    updates.kod_sekolah = null;
    updates.zon = zon;
  }

  await supabase.from('app_users').update(updates).eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
}
