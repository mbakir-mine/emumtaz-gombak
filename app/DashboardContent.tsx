'use client';

import { useState } from 'react';
import { roleLabel } from '@/lib/access';
import type {
  DashboardClassRank,
  DashboardInsights,
  DashboardSchoolRank,
  MarkCompletionClass,
  MarkCompletionSchool,
  SetupCounts,
} from '@/lib/data';
import { useAccessProfile } from './ui/AuthGate';

type MetricItem = {
  label: string;
  value: number | string;
  note?: string;
  breakdown?: Array<{ label: string; value: number }>;
};

function zoneLabel(zon: string | null | undefined) {
  if (!zon) return 'Zon belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function metricsForRole(counts: SetupCounts, role?: string): MetricItem[] {
  if (role === 'GURU_SUBJEK') {
    return [
      { label: 'Markah', value: counts.marks },
      { label: 'Subjek', value: counts.subjects },
      { label: 'Laporan', value: 'Aktif' },
    ];
  }

  if (role === 'GURU_KELAS') {
    return [
      { label: 'Murid', value: counts.students },
      { label: 'Markah', value: counts.marks },
      { label: 'Laporan', value: 'Aktif' },
    ];
  }

  if (role === 'ADMIN_SEKOLAH') {
    return [
      { label: 'Murid', value: counts.students },
      { label: 'Kelas', value: counts.classes },
      { label: 'Guru', value: counts.users },
      { label: 'Markah', value: counts.marks },
    ];
  }

  if (role === 'ADMIN_ZON') {
    return [
      { label: 'Sekolah', value: counts.schools },
      { label: 'Murid', value: counts.students },
      { label: 'Markah', value: counts.marks },
      { label: 'Laporan', value: 'Aktif' },
    ];
  }

  return [
    {
      label: 'Sekolah',
      value: counts.schools,
      breakdown: [
        { label: 'SRAI', value: counts.schoolCategories.SRAI ?? 0 },
        { label: 'SRA', value: counts.schoolCategories.SRA ?? 0 },
        { label: 'KAFAI', value: counts.schoolCategories.KAFAI ?? 0 },
      ],
    },
    { label: 'Kelas', value: counts.classes },
    {
      label: 'Murid Aktif',
      value: counts.students,
      breakdown: [
        { label: 'Lelaki', value: counts.studentGender.lelaki },
        { label: 'Perempuan', value: counts.studentGender.perempuan },
      ],
    },
    { label: 'Peperiksaan', value: counts.exams, note: 'UPSA & UASA' },
  ];
}

function introText(role?: string, zon?: string | null) {
  if (role === 'ADMIN_ZON') {
    return zoneLabel(zon);
  }

  if (role === 'ADMIN_SEKOLAH') {
    return 'Fokus sekolah';
  }

  if (role === 'GURU_KELAS') {
    return 'Fokus kelas';
  }

  if (role === 'GURU_SUBJEK') {
    return 'Fokus subjek';
  }

  return 'Paparan daerah';
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return value.toFixed(2);
}

function groupedTopSchools(rows: DashboardSchoolRank[]) {
  const groups = new Map<string, DashboardSchoolRank[]>();

  rows.forEach((row) => {
    const key = row.kategori || 'Lain-lain';
    groups.set(key, [...(groups.get(key) ?? []), row]);
  });

  return [...groups.entries()].map(([kategori, items]) => ({
    kategori,
    items: items.slice(0, 5),
  }));
}

function topClassByYear(rows: DashboardClassRank[]) {
  return [1, 2, 3, 4, 5, 6].map((tahun) => ({
    tahun,
    item: rows.filter((row) => row.tahun === tahun).slice(0, 1)[0] ?? null,
  }));
}

function InsightEmpty({ text }: { text: string }) {
  return <p className="empty insight-empty">{text}</p>;
}

function RankItem({
  rank,
  title,
  meta,
  purata,
  gps,
}: {
  rank: number;
  title: string;
  meta: string;
  purata: number | null;
  gps: number | null;
}) {
  return (
    <div className="rank-item">
      <span className="rank-number">{rank}</span>
      <div>
        <strong>{title}</strong>
        <small>{meta}</small>
      </div>
      <div className="rank-score">
        <span>GPS {formatNumber(gps)}</span>
        <small>Purata {formatNumber(purata)}</small>
      </div>
    </div>
  );
}

function SchoolLeaderboard({
  rows,
  title,
  subtitle,
}: {
  rows: DashboardSchoolRank[];
  title: string;
  subtitle: string;
}) {
  const groups = groupedTopSchools(rows);

  return (
    <section className="panel dashboard-insight-panel">
      <div className="panel-head">
        <div>
          <h2>{title}</h2>
          <p className="table-note">{subtitle}</p>
        </div>
      </div>
      {groups.length === 0 ? (
        <InsightEmpty text="Ranking akan dipaparkan selepas markah UPSA/UASA dimasukkan." />
      ) : (
        <div className="leaderboard-grid">
          {groups.map((group) => (
            <div className="leaderboard-card" key={group.kategori}>
              <h3>{group.kategori}</h3>
              <div className="rank-list">
                {group.items.map((item, index) => (
                  <RankItem
                    key={item.kod_sekolah}
                    rank={index + 1}
                    title={item.nama_sekolah}
                    meta={`${item.kod_sekolah} - ${item.jumlah_murid} murid`}
                    purata={item.purata}
                    gps={item.gps}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function SchoolFocus({ schoolRank, classRanks }: { schoolRank?: DashboardSchoolRank; classRanks: DashboardClassRank[] }) {
  const yearlyRanks = topClassByYear(classRanks);

  return (
    <section className="panel dashboard-insight-panel">
      <div className="panel-head">
        <div>
          <h2>Prestasi Sekolah</h2>
          <p className="table-note">GPS sekolah dan kelas terbaik mengikut Tahun 1 hingga Tahun 6.</p>
        </div>
        <div className="school-gps-card">
          <span>GPS Sekolah</span>
          <strong>{formatNumber(schoolRank?.gps)}</strong>
          <small>Purata {formatNumber(schoolRank?.purata)}</small>
        </div>
      </div>
      <div className="year-rank-grid">
        {yearlyRanks.map(({ tahun, item }) => (
          <div className="year-rank-card" key={tahun}>
            <span>Tahun {tahun}</span>
            {item ? (
              <>
                <strong>{item.nama_kelas}</strong>
                <small>GPS {formatNumber(item.gps)} - Purata {formatNumber(item.purata)}</small>
              </>
            ) : (
              <small>Belum ada markah</small>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function CompletionButton({
  label,
  count,
  tone,
  active,
  onClick,
}: {
  label: string;
  count: number;
  tone: 'done' | 'pending';
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`completion-button ${tone} ${active ? 'active' : ''}`} type="button" onClick={onClick}>
      <span>{label}</span>
      <strong>{count}</strong>
    </button>
  );
}

function CompletionList({
  title,
  rows,
}: {
  title: string;
  rows: Array<MarkCompletionSchool | MarkCompletionClass>;
}) {
  return (
    <div className="completion-list">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p className="empty">Tiada rekod untuk status ini.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Zon/Tahun</th>
                <th>Siap</th>
                <th>Peratus</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isSchool = 'nama_sekolah' in row;
                return (
                  <tr key={isSchool ? row.kod_sekolah : row.class_id}>
                    <td>{isSchool ? `${row.kod_sekolah} - ${row.nama_sekolah}` : row.nama_kelas}</td>
                    <td>{isSchool ? zoneLabel(row.zon) : `Tahun ${row.tahun}`}</td>
                    <td>
                      {row.completed} / {row.expected}
                    </td>
                    <td>
                      <span className={row.complete ? 'status-badge status-aktif' : 'status-badge status-menunggu'}>
                        {row.percent}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ZoneCompletionSummary({ rows }: { rows: MarkCompletionSchool[] }) {
  const zones = ['BARAT', 'TIMUR', 'TENGAH'];

  return (
    <div className="zone-completion-grid">
      {zones.map((zon) => {
        const zoneRows = rows.filter((row) => row.zon === zon);
        const done = zoneRows.filter((row) => row.complete).length;
        const pending = zoneRows.length - done;

        return (
          <div className="zone-completion-card" key={zon}>
            <span>Zon {zon.charAt(0) + zon.slice(1).toLowerCase()}</span>
            <strong>{done} siap</strong>
            <small>{pending} belum selesai</small>
          </div>
        );
      })}
    </div>
  );
}

function MarkCompletionPanel({
  role,
  zon,
  kodSekolah,
  latestExamLabel,
  schools,
  classes,
}: {
  role?: string;
  zon?: string | null;
  kodSekolah?: string | null;
  latestExamLabel: string;
  schools: MarkCompletionSchool[];
  classes: MarkCompletionClass[];
}) {
  const [view, setView] = useState<'done' | 'pending' | null>(null);
  const isSchoolAdmin = role === 'ADMIN_SEKOLAH';
  const isZoneAdmin = role === 'ADMIN_ZON';
  const scopedSchools = schools.filter((row) => {
    if (isZoneAdmin) return row.zon === zon;
    if (isSchoolAdmin) return row.kod_sekolah === kodSekolah;
    return true;
  });
  const scopedClasses = classes.filter((row) => (isSchoolAdmin ? row.kod_sekolah === kodSekolah : false));
  const rows = isSchoolAdmin ? scopedClasses : scopedSchools;
  const doneRows = rows.filter((row) => row.complete);
  const pendingRows = rows.filter((row) => !row.complete);
  const visibleRows = view === 'done' ? doneRows : view === 'pending' ? pendingRows : [];
  const unitLabel = isSchoolAdmin ? 'kelas' : 'sekolah';

  return (
    <section className="panel completion-panel">
      <div className="panel-head">
        <div>
          <h2>Status Pengisian Markah</h2>
          <p className="table-note">Pemantauan lengkap/belum selesai untuk {latestExamLabel}.</p>
        </div>
      </div>
      <div className="completion-summary">
        <CompletionButton
          label={`${unitLabel} lengkap`}
          count={doneRows.length}
          tone="done"
          active={view === 'done'}
          onClick={() => setView(view === 'done' ? null : 'done')}
        />
        <CompletionButton
          label={`${unitLabel} belum selesai`}
          count={pendingRows.length}
          tone="pending"
          active={view === 'pending'}
          onClick={() => setView(view === 'pending' ? null : 'pending')}
        />
      </div>
      {!isSchoolAdmin && <ZoneCompletionSummary rows={scopedSchools} />}
      {view && (
        <CompletionList
          title={view === 'done' ? `Senarai ${unitLabel} lengkap` : `Senarai ${unitLabel} belum selesai`}
          rows={visibleRows}
        />
      )}
    </section>
  );
}

export default function DashboardContent({ counts, insights }: { counts: SetupCounts; insights: DashboardInsights }) {
  const profile = useAccessProfile();
  const metrics = metricsForRole(counts, profile?.role);
  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const isZoneAdmin = profile?.role === 'ADMIN_ZON';
  const scopedSchoolRanks = insights.schoolRanks.filter((row) => {
    if (isZoneAdmin) return row.zon === profile?.zon;
    if (isSchoolAdmin) return row.kod_sekolah === profile?.kod_sekolah;
    return true;
  });
  const schoolOwnRank = scopedSchoolRanks.find((row) => row.kod_sekolah === profile?.kod_sekolah);
  const schoolClassRanks = insights.classRanks.filter((row) => row.kod_sekolah === profile?.kod_sekolah);
  const gradeScale = [
    ['90-100', 'Mumtaz'],
    ['75-89', 'Jayyid Jiddan'],
    ['60-74', 'Jayyid'],
    ['40-59', 'Maqbul'],
    ['0-39', "Musa'adah"],
  ];

  return (
    <>
      {profile?.nama && <h2 className="welcome-title">Selamat datang, {profile.nama}</h2>}
      <div className="metric-grid dashboard-metrics">
        {metrics.map((metric) => (
          <div className="metric dashboard-metric" key={metric.label}>
            <div>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              {metric.note && <small>{metric.note}</small>}
            </div>
            <div className="metric-side">
              {metric.breakdown && (
                <div className="metric-breakdown">
                  {metric.breakdown.map((item) => (
                    <span key={item.label}>
                      <em>{item.label}</em>
                      <i>:</i>
                      <b>{item.value}</b>
                    </span>
                  ))}
                </div>
              )}
              {!metric.breakdown && <span className="metric-accent" />}
            </div>
          </div>
        ))}
      </div>

      {isSchoolAdmin ? (
        <SchoolFocus schoolRank={schoolOwnRank} classRanks={schoolClassRanks} />
      ) : (
        <SchoolLeaderboard
          rows={scopedSchoolRanks}
          title={isZoneAdmin ? `5 Sekolah Terbaik ${zoneLabel(profile?.zon)}` : '5 Sekolah Terbaik Daerah'}
          subtitle={`Mengikut kategori sekolah berdasarkan ${insights.latestExamLabel}.`}
        />
      )}

      <MarkCompletionPanel
        role={profile?.role}
        zon={profile?.zon}
        kodSekolah={profile?.kod_sekolah}
        latestExamLabel={insights.latestExamLabel}
        schools={insights.completionSchools}
        classes={insights.completionClasses}
      />

      <div className="dashboard-split">
        <section className="panel compact-panel">
          <div className="panel-head">
            <h2>Akses Anda</h2>
            <span>{introText(profile?.role, profile?.zon)}</span>
          </div>
          <div className="detail-list">
            <span>Peranan</span>
            <strong>{profile ? roleLabel(profile.role) : '-'}</strong>
            <span>Sekolah</span>
            <strong>{profile?.kod_sekolah ?? 'Semua sekolah'}</strong>
            <span>Emel</span>
            <strong>{profile?.email ?? '-'}</strong>
          </div>
        </section>

        <section className="panel compact-panel">
          <div className="panel-head">
            <h2>Skala Gred</h2>
          </div>
          <div className="grade-scale">
            {gradeScale.map(([range, grade]) => (
              <div className="grade-chip" key={range}>
                <small>{range}</small>
                <strong>{grade}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
