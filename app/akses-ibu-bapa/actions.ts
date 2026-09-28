'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type ParentCodeState = { ok: boolean; message: string; code?: string; expiresAt?: string };
export async function issueParentAccessCode(_previous: ParentCodeState, formData: FormData): Promise<ParentCodeState> {
  const studentId = String(formData.get('student_id') ?? '').trim();
  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const days = Math.min(Math.max(Number(formData.get('valid_days') ?? 7), 1), 31);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !schoolCode || !Number.isInteger(days)) {
    return { ok: false, message: 'Maklumat murid atau tempoh tidak sah.' };
  }
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };
  const response = await fetch(`${selfHostedUrl}/api/parent/access-codes`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ student_id: studentId, valid_days: days }), cache: 'no-store' }).catch(() => null);
  const payload = await response?.json().catch(() => null) as { code?: string; expires_at?: string; message?: string } | null;
  if (!response?.ok || !payload?.code) return { ok: false, message: payload?.message ?? 'Gagal menjana kod.' };
  revalidatePath('/akses-ibu-bapa');
  return { ok: true, message: 'Kod dijana. Salin sekarang kerana kod penuh tidak disimpan.', code: payload.code, expiresAt: payload.expires_at };
}
