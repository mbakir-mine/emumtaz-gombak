import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  const database = await checkDatabaseHealth();
  const status = database.ok ? 200 : 503;

  return NextResponse.json(
    { status: database.ok ? 'ok' : 'degraded', database: database.ok ? 'connected' : 'unavailable', checkedAt },
    { status, headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}
