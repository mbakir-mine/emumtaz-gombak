import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'emumtaz_access_token';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  const hosts = [
    request.headers.get('host'),
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim(),
    new URL(request.url).host,
  ].filter((value): value is string => Boolean(value));
  if (!origin) {
    const requestHost = hosts[0]?.toLowerCase();
    return (requestHost === 'emumtaz.ismp.my' || requestHost === 'www.emumtaz.ismp.my') &&
      request.headers.get('x-emumtaz-csrf') === '1';
  }
  if (hosts.length === 0) return false;

  try {
    const originHost = new URL(origin).host;
    const configuredHost = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host : '';
    return hosts.includes(originHost) || originHost === 'emumtaz.ismp.my' || (configuredHost !== '' && configuredHost === originHost);
  } catch {
    return false;
  }
}

function noStoreJson(body: object, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

function accessTokenMaxAge(accessToken: string) {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8')) as { exp?: unknown };
    const remaining = Number(payload.exp) - Math.floor(Date.now() / 1000);
    return Number.isFinite(remaining) ? Math.max(0, Math.min(remaining, 60 * 60)) : 0;
  } catch {
    return 0;
  }
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return noStoreJson({ error: 'Permintaan ditolak.' }, { status: 403 });
  if (!supabaseUrl || !supabaseAnonKey) return noStoreJson({ error: 'Konfigurasi tidak lengkap.' }, { status: 503 });
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) {
    return noStoreJson({ error: 'Format tidak sah.' }, { status: 415 });
  }

  const body = await request.json().catch(() => null) as { accessToken?: unknown } | null;
  const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
  if (!accessToken || accessToken.length > 8192) return noStoreJson({ error: 'Sesi tidak sah.' }, { status: 401 });

  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await verifier.auth.getUser(accessToken);
  if (error || !data.user) return noStoreJson({ error: 'Sesi tidak sah.' }, { status: 401 });
  const maxAge = accessTokenMaxAge(accessToken);
  if (maxAge < 30) return noStoreJson({ error: 'Sesi telah tamat.' }, { status: 401 });

  const changed = request.cookies.get(COOKIE_NAME)?.value !== accessToken;
  const response = noStoreJson({ ok: true, changed });
  response.cookies.set(COOKIE_NAME, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge,
    priority: 'high',
  });
  return response;
}

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return noStoreJson({ error: 'Permintaan ditolak.' }, { status: 403 });
  const response = noStoreJson({ ok: true });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}
