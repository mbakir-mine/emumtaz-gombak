import AppFrame from '../ui/AppFrame';
import { getAuthActivityLogs, getSecurityAuditLogs, type SecurityAuditLog } from '@/lib/data';
import { matchesAuditFilters, parseAuditFilters } from '@/lib/audit';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const actionLabels = {
  INSERT: 'Cipta',
  UPDATE: 'Kemas kini',
  DELETE: 'Padam',
} as const;

const tableLabels: Record<string, string> = {
  app_users: 'Pengguna',
  schools: 'Sekolah',
  classes: 'Kelas',
  students: 'Murid',
  marks: 'Markah',
  mark_components: 'Komponen markah',
  daily_attendance: 'Kehadiran',
  exams: 'Peperiksaan',
  school_module_access: 'Akses modul sekolah',
  takwim_events: 'Takwim',
  teacher_class_assignments: 'Guru kelas',
  teacher_subject_assignments: 'Guru subjek',
  teacher_subject_component_assignments: 'Komponen guru subjek',
  pbd_assessments: 'Pentaksiran PBD',
  pbd_marks: 'Markah PBD',
  psra_trial_marks: 'Percubaan PSRA',
  psra_trial_paper_marks: 'Kertas Percubaan PSRA',
  upkk_trial_paper_marks: 'Kertas Percubaan UPKK',
  upkk_amali_solat_marks: 'Amali Solat UPKK',
  upkk_pchi_marks: 'PCHI UPKK',
  sahsiah_ihab_assessments: 'Sahsiah IHAB',
  khalifah_muda_records: 'Rekod Sahsiah',
  amal_khair_records: 'Amal Khair',
  timetable_entries: 'Jadual waktu',
  rph_records: 'RPH',
};

const roleLabels: Record<string, string> = {
  OWNER: 'Pemilik Sistem',
  ADMIN_DAERAH: 'Admin Daerah',
  ADMIN_ZON: 'Admin Zon',
  ADMIN_SEKOLAH: 'Admin Sekolah',
  GURU_KELAS: 'Guru Kelas',
  GURU_SUBJEK: 'Guru Subjek',
};

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Ya' : 'Tidak';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function ChangeDetails({ log }: { log: SecurityAuditLog }) {
  if (log.action !== 'UPDATE' || log.changed_fields.length === 0) return null;

  return (
    <details className="audit-change-details">
      <summary>Lihat nilai sebelum dan selepas</summary>
      <div className="audit-change-list">
        {log.changed_fields.map((field) => (
          <div key={field}>
            <strong>{field}</strong>
            <span>{formatValue(log.old_values?.[field])}</span>
            <span aria-hidden="true">→</span>
            <span>{formatValue(log.new_values?.[field])}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('ms-MY', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Kuala_Lumpur',
  }).format(new Date(value));
}

type AuditPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SecurityAuditPage({ searchParams }: AuditPageProps) {
  const rawParams = await searchParams;
  const filters = parseAuditFilters(rawParams);
  const [allAuthLogs, allEditLogs] = await Promise.all([getAuthActivityLogs(500), getSecurityAuditLogs(500)]);
  const authLogs = allAuthLogs.filter((row) => matchesAuditFilters(row as unknown as Record<string, unknown>, filters, 'AUTH'));
  const editLogs = allEditLogs.filter((row) => matchesAuditFilters(row as unknown as Record<string, unknown>, filters, 'EDIT'));
  const exportParams = new URLSearchParams();
  Object.entries(rawParams).forEach(([key, value]) => {
    const firstValue = Array.isArray(value) ? value[0] : value;
    if (firstValue) exportParams.set(key, firstValue);
  });

  return (
    <AppFrame
      title="Log Aktiviti & Audit Edit"
      subtitle="Jejak log masuk, log keluar dan perubahan data. Akses Pemilik Sistem sahaja."
      active="securityAudit"
    >
      <section className="panel audit-filter-panel">
        <div className="panel-head">
          <div>
            <h2>Carian dan eksport</h2>
            <p>Tapis sehingga 500 rekod terkini dan eksport hasil yang sama ke CSV.</p>
          </div>
          <a className="button secondary" href={`/api/audit/export?${exportParams.toString()}`}>Eksport CSV</a>
        </div>
        <form className="audit-filter-grid" method="get">
          <label>
            Carian
            <input name="q" defaultValue={filters.query} placeholder="Email, rekod, jadual atau nilai" />
          </label>
          <label>
            Jenis rekod
            <select name="category" defaultValue={filters.category}>
              <option value="ALL">Semua</option>
              <option value="AUTH">Log masuk/keluar</option>
              <option value="EDIT">Perubahan data</option>
            </select>
          </label>
          <label>
            Tindakan
            <select name="action" defaultValue={filters.action}>
              <option value="">Semua tindakan</option>
              <option value="LOGIN">Log masuk</option>
              <option value="LOGOUT">Log keluar</option>
              <option value="INSERT">Cipta</option>
              <option value="UPDATE">Kemas kini</option>
              <option value="DELETE">Padam</option>
            </select>
          </label>
          <label>
            Kod sekolah
            <input name="school" defaultValue={filters.school} placeholder="Contoh: BYP7001" />
          </label>
          <label>
            Dari tarikh
            <input type="date" name="from" defaultValue={filters.from} />
          </label>
          <label>
            Hingga tarikh
            <input type="date" name="to" defaultValue={filters.to} />
          </label>
          <div className="audit-filter-actions">
            <button className="button" type="submit">Tapis rekod</button>
            <a className="button secondary" href="/audit-keselamatan">Tetapkan semula</a>
          </div>
        </form>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Log masuk dan keluar</h2>
            <p>{authLogs.length} aktiviti sesi sepadan, disusun daripada yang paling baharu.</p>
          </div>
        </div>

        {authLogs.length === 0 ? (
          <p className="empty">Belum ada aktiviti sesi direkodkan.</p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Masa</th>
                  <th>Aktiviti</th>
                  <th>Pengguna</th>
                  <th>Peranan</th>
                  <th>Sekolah</th>
                </tr>
              </thead>
              <tbody>
                {authLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimestamp(log.created_at)}</td>
                    <td>
                      <span className={`audit-event audit-event-${log.event_type.toLowerCase()}`}>
                        {log.event_type === 'LOGIN' ? 'Log masuk' : 'Log keluar'}
                      </span>
                    </td>
                    <td>
                      <strong>{log.actor_name ?? 'Pengguna'}</strong>
                      <small className="audit-record-id">{log.actor_email ?? 'Email tidak tersedia'}</small>
                    </td>
                    <td>{log.actor_role ? roleLabels[log.actor_role] ?? log.actor_role : '—'}</td>
                    <td>{log.kod_sekolah ?? 'Global'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Rekod perubahan data</h2>
            <p>{editLogs.length} perubahan sepadan termasuk cipta, edit dan padam.</p>
          </div>
        </div>

        {editLogs.length === 0 ? (
          <p className="empty">Belum ada perubahan data direkodkan.</p>
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
                {editLogs.map((log) => (
                  <tr key={log.id}>
                    <td>{formatTimestamp(log.created_at)}</td>
                    <td>
                      <span className={`audit-event audit-event-${log.action.toLowerCase()}`}>
                        {actionLabels[log.action]}
                      </span>
                    </td>
                    <td>{log.actor_email ?? 'Proses sistem'}</td>
                    <td>
                      <strong>{tableLabels[log.table_name] ?? log.table_name}</strong>
                      {log.record_id ? <small className="audit-record-id">ID: {log.record_id}</small> : null}
                    </td>
                    <td>{log.kod_sekolah ?? 'Global'}</td>
                    <td>
                      {log.changed_fields.length > 0 ? log.changed_fields.join(', ') : '—'}
                      <ChangeDetails log={log} />
                    </td>
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
