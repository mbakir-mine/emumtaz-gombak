'use server';

import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

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

  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const response = await fetch(`${selfHostedUrl}/api/report-verifications`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ report_type: reportType, scope_label: scopeLabel, snapshot_hash: snapshotHash }), cache: 'no-store' });
  const payload = await response.json().catch(() => null) as { data?: { token?: string; reference_number?: string; issued_at?: string }; message?: string } | null;
  if (!response.ok || !payload?.data) return { ok: false, message: payload?.message ?? `Laporan gagal disahkan (${response.status}).` };
  return {
    ok: true,
    message: 'Salinan rasmi berjaya didaftarkan.',
    token: payload.data.token,
    referenceNumber: payload.data.reference_number,
    issuedAt: payload.data.issued_at,
  };
}
