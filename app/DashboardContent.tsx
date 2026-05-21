'use client';

import { roleLabel } from '@/lib/access';
import type { DashboardClassRank, DashboardInsights, DashboardSchoolRank, SetupCounts } from '@/lib/data';
import { useAccessProfile } from './ui/AuthGate';

type MetricItem = {
  label: string;
  value: number | string;
  note?: string;
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
    { label: 'Sekolah', value: counts.schools, note: 'SRA & KAFAI' },
    { label: 'Kelas', value: counts.classes },
    { label: 'Murid Aktif', value: counts.students },
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
                    meta={`${item.kod_sekolah} · ${item.jumlah_murid} murid`}
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
                <small>GPS {formatNumber(item.gps)} · Purata {formatNumber(item.purata)}</small>
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
            <span className="metric-accent" />
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
