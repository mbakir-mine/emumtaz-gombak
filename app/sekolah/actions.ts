'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

const allowedZones = ['BARAT', 'TIMUR', 'TENGAH', ''];

export async function updateSchoolZone(formData: FormData) {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return;

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const zon = String(formData.get('zon') ?? '').trim().toUpperCase();

  if (!kodSekolah || !allowedZones.includes(zon)) {
    return;
  }

  await fetch(`${selfHostedUrl}/api/schools/${encodeURIComponent(kodSekolah)}/zone`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ zon: zon || null }), cache: 'no-store' });

  revalidatePath('/sekolah');
  revalidatePath('/');
  revalidatePath('/pengguna');
}
