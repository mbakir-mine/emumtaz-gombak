import { createHmac } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  const requestHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')
    || new URL(request.url).host;
  try {
    return new URL(origin).host === requestHost;
  } catch {
    return false;
  }
}

function fingerprint(value: string) {
  return createHmac('sha256', serviceRoleKey as string).update(value).digest('hex');
}

function deviceFamily(userAgent: string) {
  if (/ipad|tablet/i.test(userAgent)) return 'TABLET';
  if (/mobile|android|iphone/i.test(userAgent)) return 'MOBILE';
  if (/windows|macintosh|linux|cros/i.test(userAgent)) return 'DESKTOP';
  return 'UNKNOWN';
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return Response.json({ accepted: false }, { status: 403 });
  if (!supabaseUrl || !serviceRoleKey) return Response.json({ accepted: false }, { status: 503 });
  if (!(request.headers.get('content-type') ?? '').startsWith('application/json')) {
    return Response.json({ accepted: false }, { status: 415 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase().slice(0, 320) : '';
  if (!email || !email.includes('@')) return Response.json({ accepted: false }, { status: 400 });

  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const networkHash = forwardedFor ? fingerprint(`network:${forwardedFor}`) : null;
  const client = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  if (networkHash) {
    const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
    const { count } = await client
      .from('auth_login_failure_logs')
      .select('id', { count: 'exact', head: true })
      .eq('network_hash', networkHash)
      .gte('created_at', oneMinuteAgo);
    if ((count ?? 0) >= 10) return Response.json({ accepted: true }, { status: 202 });
  }

  const { error } = await client.from('auth_login_failure_logs').insert({
    identifier_hash: fingerprint(`identifier:${email}`),
    network_hash: networkHash,
    device_family: deviceFamily(request.headers.get('user-agent') ?? ''),
  });
  if (error) console.error('Failed to record protected login-failure telemetry:', error.code);
  return Response.json({ accepted: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
