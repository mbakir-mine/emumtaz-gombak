import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const origin = request.headers.get('origin'); const host = request.headers.get('host');
  if (!origin || !host) return NextResponse.json({ accepted: false }, { status: 403 });
  try { if (new URL(origin).host !== host) return NextResponse.json({ accepted: false }, { status: 403 }); } catch { return NextResponse.json({ accepted: false }, { status: 403 }); }
  return NextResponse.json({ accepted: true }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
}
