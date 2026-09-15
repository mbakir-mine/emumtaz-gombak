import { auditRowsToCsv, matchesAuditFilters, parseAuditFilters } from '@/lib/audit';
import { getAuthActivityLogs, getAuthLoginFailureLogs, getSecurityAuditLogs } from '@/lib/data';
import { isVerifiedOwner } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (!(await isVerifiedOwner())) {
    return Response.json({ message: 'Akses tidak dibenarkan.' }, { status: 403 });
  }

  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const filters = parseAuditFilters(params);
  const [authLogs, failureLogs, editLogs] = await Promise.all([
    getAuthActivityLogs(500), getAuthLoginFailureLogs(500), getSecurityAuditLogs(500),
  ]);

  const rows: Record<string, unknown>[] = [
    ...authLogs
      .filter((row) => matchesAuditFilters(row as unknown as Record<string, unknown>, filters, 'AUTH'))
      .map((row) => ({
        jenis: 'SESI', masa: row.created_at, tindakan: row.event_type, email_pelaku: row.actor_email,
        nama_pelaku: row.actor_name, peranan: row.actor_role, kod_sekolah: row.kod_sekolah, id_sesi: row.session_id,
      })),
    ...failureLogs
      .filter((row) => matchesAuditFilters({ ...row, event_type: 'LOGIN_FAILED' }, filters, 'AUTH'))
      .map((row) => ({
        jenis: 'SESI', masa: row.created_at, tindakan: 'LOGIN_FAILED',
        email_pelaku: `HASH:${row.identifier_hash.slice(0, 12)}`, peranan: row.device_family,
      })),
    ...editLogs
      .filter((row) => matchesAuditFilters(row as unknown as Record<string, unknown>, filters, 'EDIT'))
      .map((row) => ({
        jenis: 'DATA', masa: row.created_at, tindakan: row.action, email_pelaku: row.actor_email,
        kod_sekolah: row.kod_sekolah, jadual: row.table_name, id_rekod: row.record_id,
        medan_berubah: row.changed_fields.join('|'), nilai_lama: row.old_values, nilai_baharu: row.new_values,
      })),
  ].sort((a, b) => String(b.masa).localeCompare(String(a.masa)));

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(auditRowsToCsv(rows), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="audit-emumtaz-${stamp}.csv"`,
      'Cache-Control': 'private, no-store, max-age=0',
    },
  });
}
