'use server';

import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

export type IssuedReport = {
  ok: boolean;
  message: string;
  token?: string;
  referenceNumber?: string;
  issuedAt?: string;
};

export async function issueReportVerification(input: {
  reportType: string;
  scopeLabel: string;
  snapshotHash: string;
}): Promise<IssuedReport> {
  const reportType = input.reportType.trim().slice(0, 80);
  const scopeLabel = input.scopeLabel.trim().slice(0, 240);
  const snapshotHash = input.snapshotHash.trim().toLowerCase();
  if (reportType.length < 2 || scopeLabel.length < 2 || !/^[a-f0-9]{64}$/.test(snapshotHash)) {
    return { ok: false, message: 'Maklumat laporan tidak sah.' };
  }

  const supabase = await getAuthenticatedSupabaseServerClient();
  if (!supabase) return { ok: false, message: 'Sila log masuk semula.' };
  const { data, error } = await supabase.rpc('issue_report_verification', {
    p_report_type: reportType,
    p_scope_label: scopeLabel,
    p_snapshot_hash: snapshotHash,
  });
  const row = Array.isArray(data) ? data[0] : null;
  if (error || !row) return { ok: false, message: `Laporan gagal disahkan: ${error?.message ?? 'Tiada rekod'}` };
  return {
    ok: true,
    message: 'Salinan rasmi berjaya didaftarkan.',
    token: row.token,
    referenceNumber: row.reference_number,
    issuedAt: row.issued_at,
  };
}
