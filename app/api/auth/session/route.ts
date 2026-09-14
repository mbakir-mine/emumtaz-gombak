import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'emumtaz_access_token';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

type VerifiedUser = { id: string; email?: string | null };

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

function authenticatedClient(accessToken: string) {
  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function recordAuthActivity(accessToken: string, user: VerifiedUser, eventType: 'LOGIN' | 'LOGOUT') {
  if (!supabaseUrl || !supabaseServiceRoleKey) return false;

  const auditClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const profileColumns = 'id,nama,role,kod_sekolah,status';
  let { data: profiles } = await auditClient
    .from('app_users')
    .select(profileColumns)
    .eq('auth_user_id', user.id)
    .limit(10);

  if ((!profiles || profiles.length === 0) && user.email) {
    const fallback = await auditClient
      .from('app_users')
      .select(profileColumns)
      .ilike('email', user.email)
      .limit(10);
    profiles = fallback.data;
  }

  const roleRank: Record<string, number> = {
    OWNER: 1, ADMIN_DAERAH: 2, ADMIN_ZON: 3,
    ADMIN_SEKOLAH: 4, GURU_KELAS: 5, GURU_SUBJEK: 6,
  };
  const profile = [...(profiles ?? [])].sort((left, right) => {
    const statusDifference = Number(right.status === 'AKTIF') - Number(left.status === 'AKTIF');
    return statusDifference || (roleRank[left.role] ?? 99) - (roleRank[right.role] ?? 99);
  })[0];

  let payload: { session_id?: unknown; iat?: unknown } = {};
  try {
    payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64url').toString('utf8'));
  } catch {
    // The token was already verified; this fallback only supplies a stable audit key.
  }
  const sessionId = typeof payload.session_id === 'string' && payload.session_id
    ? payload.session_id
    : `${user.id}:${String(payload.iat ?? 'unknown')}`;

  const { error } = await auditClient.from('auth_activity_logs').upsert({
    actor_auth_user_id: user.id,
    actor_email: user.email ?? null,
    actor_profile_id: profile?.id ?? null,
    actor_name: profile?.nama ?? null,
    actor_role: profile?.role ?? null,
    kod_sekolah: profile?.kod_sekolah ?? null,
    event_type: eventType,
    session_id: sessionId,
  }, { onConflict: 'session_id,event_type', ignoreDuplicates: true });

  return !error;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return noStoreJson({ error: 'Permintaan ditolak.' }, { status: 403 });
  if (!supabaseUrl || !supabaseAnonKey) return noStoreJson({ error: 'Konfigurasi tidak lengkap.' }, { status: 503 });
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) {
    return noStoreJson({ error: 'Format tidak sah.' }, { status: 415 });
  }

  const body = await request.json().catch(() => null) as { accessToken?: unknown; activity?: unknown } | null;
  const accessToken = typeof body?.accessToken === 'string' ? body.accessToken : '';
  if (!accessToken || accessToken.length > 8192) return noStoreJson({ error: 'Sesi tidak sah.' }, { status: 401 });

  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await verifier.auth.getUser(accessToken);
  if (error || !data.user) return noStoreJson({ error: 'Sesi tidak sah.' }, { status: 401 });
  const maxAge = accessTokenMaxAge(accessToken);
  if (maxAge < 30) return noStoreJson({ error: 'Sesi telah tamat.' }, { status: 401 });

  const auditRecorded = body?.activity === 'LOGIN'
    ? await recordAuthActivity(accessToken, data.user, 'LOGIN')
    : undefined;
  const changed = request.cookies.get(COOKIE_NAME)?.value !== accessToken;
  const response = noStoreJson({ ok: true, changed, auditRecorded });
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

export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return noStoreJson({ error: 'Permintaan ditolak.' }, { status: 403 });
  const accessToken = request.cookies.get(COOKIE_NAME)?.value;
  let auditRecorded: boolean | undefined;
  if (accessToken && supabaseUrl && supabaseAnonKey) {
    const verifier = authenticatedClient(accessToken);
    const { data } = await verifier.auth.getUser(accessToken);
    auditRecorded = data.user
      ? await recordAuthActivity(accessToken, data.user, 'LOGOUT')
      : false;
  }
  const response = noStoreJson({ ok: true, auditRecorded });
  response.cookies.set(COOKIE_NAME, '', { httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return response;
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token || !supabaseUrl || !supabaseAnonKey) return noStoreJson({ hasSessionCookie: Boolean(token), studentCount: 0 });
  const client = authenticatedClient(token);
  const { data: userData } = await client.auth.getUser(token);
  const { count } = await client.from('students').select('id', { count: 'exact', head: true });
  return noStoreJson({ hasSessionCookie: true, studentCount: count ?? 0, userId: userData.user?.id ?? null, email: userData.user?.email ?? null });
}
