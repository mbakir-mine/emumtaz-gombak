'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export async function markNotificationRead(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return;
  await fetch(`${selfHostedUrl}/api/notifications/${id}/read`, { method: 'POST', headers: { Accept: 'application/json', Cookie: (await cookies()).toString() }, cache: 'no-store' }).catch(() => undefined);
  revalidatePath('/notifikasi');
}
