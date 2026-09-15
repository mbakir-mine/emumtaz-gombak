import Link from 'next/link';
import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function VerifyReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = uuid.test(token) ? await getAuthenticatedSupabaseServerClient() : null;
  const { data } = supabase
    ? await supabase.from('report_verifications').select('reference_number,report_type,scope_label,snapshot_hash,issued_at,revoked_at').eq('token', token).maybeSingle()
    : { data: null };

  return (
    <section className="panel verification-page">
      <div className="panel-head"><div><h2>Semakan Laporan eMumtaz</h2><p className="table-note">Semakan ini memerlukan akaun yang mempunyai akses kepada skop laporan.</p></div></div>
      {!data ? (
        <div className="notice warning"><strong>Laporan tidak ditemui atau akses tidak dibenarkan.</strong><p>Pastikan anda telah log masuk menggunakan akaun yang betul.</p></div>
      ) : (
        <dl className="verification-details">
          <div><dt>Status</dt><dd className={data.revoked_at ? 'status-bad' : 'status-good'}>{data.revoked_at ? 'DIBATALKAN' : 'SAH'}</dd></div>
          <div><dt>No. rujukan</dt><dd>{data.reference_number}</dd></div>
          <div><dt>Jenis laporan</dt><dd>{data.report_type}</dd></div>
          <div><dt>Skop</dt><dd>{data.scope_label}</dd></div>
          <div><dt>Dikeluarkan</dt><dd>{new Intl.DateTimeFormat('ms-MY', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Kuala_Lumpur' }).format(new Date(data.issued_at))}</dd></div>
          <div><dt>Cap SHA-256</dt><dd className="verification-hash">{data.snapshot_hash}</dd></div>
        </dl>
      )}
      <Link className="button secondary" href="/laporan">Kembali ke Laporan</Link>
    </section>
  );
}
