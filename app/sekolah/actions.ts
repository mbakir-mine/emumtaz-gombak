'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

const allowedZones = ['BARAT', 'TIMUR', 'TENGAH', ''];

export async function updateSchoolZone(formData: FormData) {
  if (!supabase) return;

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const zon = String(formData.get('zon') ?? '').trim().toUpperCase();

  if (!kodSekolah || !allowedZones.includes(zon)) {
    return;
  }

  await supabase
    .from('schools')
    .update({ zon: zon || null })
    .eq('kod_sekolah', kodSekolah);

  revalidatePath('/sekolah');
  revalidatePath('/');
  revalidatePath('/pengguna');
}
