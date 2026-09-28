import { NextRequest, NextResponse } from 'next/server';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export const dynamic = 'force-dynamic';

async function proxy(request: NextRequest) {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return NextResponse.json({ authenticated: false, error: 'Backend Laravel belum dikonfigurasi.' }, { status: 503 });
  const response = await fetch(`${baseUrl}/api/auth/session`, { headers: { Cookie: request.headers.get('cookie') ?? '' }, cache: 'no-store' }).catch(() => null);
  if (!response) return NextResponse.json({ authenticated: false }, { status: 503 });
  const payload = await response.json().catch(() => ({ authenticated: false }));
  return NextResponse.json(payload, { status: response.status, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}

export async function GET(request: NextRequest) { return proxy(request); }
export async function POST(request: NextRequest) { return proxy(request); }
export async function DELETE(request: NextRequest) {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return NextResponse.json({ ok: true });
  const response = await fetch(`${baseUrl}/api/auth/logout`, { method: 'POST', headers: { Cookie: request.headers.get('cookie') ?? '' }, cache: 'no-store' }).catch(() => null);
  return NextResponse.json({ ok: response?.ok ?? false }, { status: response?.ok ? 200 : 503 });
}
