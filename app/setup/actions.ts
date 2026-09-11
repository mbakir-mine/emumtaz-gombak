'use server';

import { revalidatePath } from 'next/cache';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export async function updateExamAccess(formData: FormData) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return;

  const id = String(formData.get('id') ?? '').trim();
  const bukaMarkah = String(formData.get('buka_markah') ?? '').trim();
  const tutupMarkah = String(formData.get('tutup_markah') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();

  if (!id || !['DIBUKA', 'DITUTUP'].includes(status)) {
    return;
  }

  await supabase
    .from('exams')
    .update({
      buka_markah: bukaMarkah || null,
      tutup_markah: tutupMarkah || null,
      status,
    })
    .eq('id', id);

  revalidatePath('/setup');
  revalidatePath('/markah');
}
