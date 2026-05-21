'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];
const allowedRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];

export async function updateUserStatus(formData: FormData) {
  if (!supabase) {
    return;
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  const role = String(formData.get('role') ?? '').trim().toUpperCase();

  if (!id || !allowedStatuses.includes(status) || !allowedRoles.includes(role)) {
    return;
  }

  const { data: user } = await supabase.from('app_users').select('role').eq('id', id).maybeSingle();

  if (user?.role === 'OWNER') {
    return;
  }

  await supabase.from('app_users').update({ role, status }).eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
}
