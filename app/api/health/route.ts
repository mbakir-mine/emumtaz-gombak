import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const database = await checkDatabaseHealth();
  const status = database.ok ? 200 : 503;

  return NextResponse.json(
    {
      status: database.ok ? 'ok' : 'degraded',
      database: database.ok ? 'connected' : 'unavailable',
      responseTimeMs: Date.now() - startedAt,
      checkedAt,
    },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
