import { NextResponse } from 'next/server';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return NextResponse.json({ status: 'degraded', database: 'backend_not_configured', checkedAt }, { status: 503 });
  const response = await fetch(`${selfHostedUrl}/health`, { cache: 'no-store' });
  const payload = await response.json().catch(() => ({ status: 'degraded' }));
  return NextResponse.json({ ...payload, checkedAt, responseTimeMs: Date.now() - startedAt }, { status: response.ok ? 200 : 503, headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
