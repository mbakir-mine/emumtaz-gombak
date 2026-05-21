'use client';

import { roleLabel } from '@/lib/access';
import type { SetupCounts } from '@/lib/data';
import { useAccessProfile } from './ui/AuthGate';

type MetricItem = {
  label: string;
  value: number | string;
  note: string;
};

function zoneLabel(zon: string | null | undefined) {
  if (!zon) return 'Zon belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function metricsForRole(counts: SetupCounts, role?: string): MetricItem[] {
  if (role === 'GURU_SUBJEK') {
    return [
      { label: 'Markah', value: counts.marks, note: 'Rekod markah semasa' },
      { label: 'Subjek', value: counts.subjects, note: 'Subjek aktif sistem' },
      { label: 'Laporan', value: 'Aktif', note: 'Analisis dan laporan boleh dicapai' },
    ];
  }

  if (role === 'GURU_KELAS') {
    return [
      { label: 'Murid', value: counts.students, note: 'Rujukan murid aktif' },
      { label: 'Markah', value: counts.marks, note: 'Rekod markah semasa' },
      { label: 'Laporan', value: 'Aktif', note: 'Laporan kelas dan individu' },
    ];
  }

  if (role === 'ADMIN_SEKOLAH') {
    return [
      { label: 'Murid', value: counts.students, note: 'Data murid sekolah' },
      { label: 'Kelas', value: counts.classes, note: 'Kelas tahun semasa' },
      { label: 'Guru', value: counts.users, note: 'Pengguna sekolah' },
      { label: 'Markah', value: counts.marks, note: 'Rekod markah sekolah' },
    ];
  }

  if (role === 'ADMIN_ZON') {
    return [
      { label: 'Sekolah', value: counts.schools, note: 'Sekolah dalam pemantauan zon' },
      { label: 'Murid', value: counts.students, note: 'Jumlah murid dipantau' },
      { label: 'Markah', value: counts.marks, note: 'Rekod markah semasa' },
      { label: 'Laporan', value: 'Aktif', note: 'Analisis zon dan perbandingan' },
    ];
  }

  return [
    { label: 'Sekolah', value: counts.schools, note: 'Data sekolah daerah' },
    { label: 'Pengguna', value: counts.users, note: 'Pentadbir dan guru' },
    { label: 'Subjek', value: counts.subjects, note: 'Subjek aktif sistem' },
    { label: 'Markah', value: counts.marks, note: 'Rekod markah semasa' },
  ];
}

function introText(role?: string, zon?: string | null) {
  if (role === 'ADMIN_ZON') {
    return `Paparan ini diminimumkan untuk pemantauan ${zoneLabel(zon)}. Modul input dan tetapan operasi sekolah disembunyikan.`;
  }

  if (role === 'ADMIN_SEKOLAH') {
    return 'Paparan ini memberi fokus kepada data sekolah, kelas, guru, murid, markah dan laporan.';
  }

  if (role === 'GURU_KELAS') {
    return 'Paparan guru kelas memberi fokus kepada murid, pengisian markah dan laporan kelas.';
  }

  if (role === 'GURU_SUBJEK') {
    return 'Paparan guru subjek memberi fokus kepada pengisian markah subjek dan semakan laporan.';
  }

  return 'Paparan penuh Pentadbir Daerah untuk memantau konfigurasi, pengguna, sekolah, markah dan laporan.';
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
            <small>{metric.note}</small>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-head">
          <h2>{profile ? roleLabel(profile.role) : 'Status Sistem'}</h2>
          <span>e-Mumtaz Gombak</span>
        </div>
        <p className="table-note">{introText(profile?.role, profile?.zon)}</p>
      </section>
    </>
  );
}
