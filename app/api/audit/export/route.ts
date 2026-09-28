import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return Response.json({ message: 'Backend Laravel belum dikonfigurasi.' }, { status: 503 });
  const response = await fetch(`${baseUrl}/api/audit/export?${new URL(request.url).searchParams.toString()}`, { headers: { Cookie: (await cookies()).toString() }, cache: 'no-store' });
  return new Response(await response.text(), { status: response.status, headers: { 'Content-Type': response.headers.get('content-type') ?? 'text/csv; charset=utf-8', 'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment', 'Cache-Control': 'private, no-store, max-age=0' } });
}
