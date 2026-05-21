'use client';

import { roleLabel } from '@/lib/access';
import type { SetupCounts } from '@/lib/data';
import { useAccessProfile } from './ui/AuthGate';

type MetricItem = {
  label: string;
  value: number | string;
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
    { label: 'Sekolah', value: counts.schools },
    { label: 'Pengguna', value: counts.users },
    { label: 'Subjek', value: counts.subjects },
    { label: 'Markah', value: counts.marks },
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

  return (
    <>
      <div className="metric-grid dashboard-metrics">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{profile ? roleLabel(profile.role) : 'Status Sistem'}</h2>
          <span>{introText(profile?.role, profile?.zon)}</span>
        </div>
      </section>
    </>
  );
}
