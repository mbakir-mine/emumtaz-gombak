'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export async function updateExamAccess(formData: FormData) {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return;
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  if (!id || !['DIBUKA', 'DITUTUP'].includes(status)) return;
  await fetch(`${baseUrl}/api/exams/${encodeURIComponent(id)}/access`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ buka_markah: String(formData.get('buka_markah') ?? '').trim() || null, tutup_markah: String(formData.get('tutup_markah') ?? '').trim() || null, status }), cache: 'no-store' });
  revalidatePath('/setup');
  revalidatePath('/markah');
}
