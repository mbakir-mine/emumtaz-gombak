import AppFrame from '../ui/AppFrame';
import { getSecurityAuditLogs } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const actionLabels = {
  INSERT: 'Cipta',
  UPDATE: 'Kemas kini',
  DELETE: 'Padam',
} as const;

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('ms-MY', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(value));
}

export default async function SecurityAuditPage() {
  const logs = await getSecurityAuditLogs();

  return (
    <AppFrame
      title="Audit Keselamatan"
      subtitle="Rekod kekal perubahan pentadbiran dan konfigurasi kritikal. Akses Pentadbir Utama sahaja."
      active="securityAudit"
    >
      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Aktiviti terkini</h2>
            <p>{logs.length} rekod terakhir, disusun daripada yang paling baharu.</p>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="empty">Belum ada perubahan pentadbiran direkodkan.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Masa</th>
                  <th>Tindakan</th>
                  <th>Pelaku</th>
                  <th>Rekod</th>
                  <th>Sekolah</th>
                  <th>Medan berubah</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimestamp(log.created_at)}</td>
                    <td>{actionLabels[log.action]}</td>
                    <td>{log.actor_email ?? 'Proses sistem'}</td>
                    <td>
                      <strong>{log.table_name}</strong>
                      {log.record_id ? <small className="audit-record-id">ID: {log.record_id}</small> : null}
                    </td>
                    <td>{log.kod_sekolah ?? 'Global'}</td>
                    <td>{log.changed_fields.length > 0 ? log.changed_fields.join(', ') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AppFrame>
  );
}
