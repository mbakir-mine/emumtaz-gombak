'use client';

import { roleLabel } from '@/lib/access';
import type { SetupCounts } from '@/lib/data';
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

export default function DashboardContent({ counts }: { counts: SetupCounts }) {
  const profile = useAccessProfile();
  const metrics = metricsForRole(counts, profile?.role);
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
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            {metric.note && <small>{metric.note}</small>}
          </div>
        ))}
      </div>

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
