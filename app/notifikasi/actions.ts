'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await getAuthenticatedSupabaseServerClient();
  if (!supabase) return;
  await supabase.rpc('mark_notification_read', { p_notification_id: id });
  revalidatePath('/notifikasi');
}
