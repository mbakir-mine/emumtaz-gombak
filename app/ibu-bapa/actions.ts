'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parentSessionCookie } from '@/lib/parentAccess';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type ParentLoginState = { ok: boolean; message: string };
const genericFailure = 'Maklumat akses tidak sepadan atau kod telah tamat tempoh.';

export async function loginParent(_previous: ParentLoginState, formData: FormData): Promise<ParentLoginState> {
  const mykid = String(formData.get('mykid') ?? '').replace(/\D/g, '');
  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const code = String(formData.get('access_code') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (mykid.length < 6 || !schoolCode || code.length !== 8) return { ok: false, message: genericFailure };

  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend self-hosted belum disambungkan.' };
  const response = await fetch(`${selfHostedUrl}/api/parent/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mykid, kod_sekolah: schoolCode, code }), cache: 'no-store' });
  if (!response.ok) return { ok: false, message: genericFailure };
  const setCookie = response.headers.get('set-cookie') ?? '';
  const token = setCookie.match(/emumtaz_parent_session=([^;]+)/)?.[1];
  if (!token) return { ok: false, message: 'Sesi semakan gagal diwujudkan.' };
  (await cookies()).set(parentSessionCookie, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/ibu-bapa', maxAge: 30 * 60 });
  redirect('/ibu-bapa/laporan');
}

export async function logoutParent() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(parentSessionCookie)?.value ?? '';
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (selfHostedUrl && rawToken) {
    await fetch(`${selfHostedUrl}/api/parent/logout`, { method: 'POST', headers: { Cookie: `emumtaz_parent_session=${rawToken}` }, cache: 'no-store' });
    cookieStore.delete(parentSessionCookie);
    return;
  }
  cookieStore.delete(parentSessionCookie);
}
