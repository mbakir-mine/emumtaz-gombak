'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

const allowedStatuses = ['AKTIF', 'MENUNGGU', 'DIGANTUNG'];

export async function updateUserStatus(formData: FormData) {
  if (!supabase) {
    return;
  }

  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();

  if (!id || !allowedStatuses.includes(status)) {
    return;
  }

  await supabase.from('app_users').update({ status }).eq('id', id);

  revalidatePath('/pengguna');
  revalidatePath('/guru');
  revalidatePath('/');
}
