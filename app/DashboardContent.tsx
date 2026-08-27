'use client';

import { useEffect, useMemo, useState } from 'react';
import type {
  DashboardClassRank,
  DashboardInsights,
  DashboardSchoolRank,
  MarkCompletionClass,
  MarkCompletionSchool,
  SetupCounts,
  TeacherDashboardClass,
  TeacherDashboardSubject,
} from '@/lib/data';
import { useAccessProfile } from './ui/AuthGate';
import { schoolCategoryRank } from '@/lib/schoolCategories';
import { PSRA_PAPERS, type PsraPaperMarkRecord } from '@/lib/psra';
import { supabase } from '@/lib/supabase';

type MetricItem = {
  label: string;
  value: number | string;
  note?: string;
  breakdown?: Array<{ label: string; value: number }>;
};

const SELANGOR_DISTRICTS = [
  'GOMBAK',
  'HULU LANGAT',
  'HULU SELANGOR',
  'KLANG',
  'KUALA LANGAT',
  'KUALA SELANGOR',
  'PETALING',
  'SABAK BERNAM',
  'SEPANG',
];

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
      {
        label: 'Kelas',
        value: counts.classes,
        breakdown: [1, 2, 3, 4, 5, 6].map((tahun) => ({
          label: `Tahun ${tahun}`,
          value: counts.classesByYear[tahun] ?? 0,
        })),
      },
      { label: 'Guru', value: counts.users },
      { label: 'Markah', value: counts.marks },
    ];
  }

  if (role === 'ADMIN_ZON') {
    return [
      { label: 'Sekolah', value: counts.schools },
      {
        label: 'Kelas',
        value: counts.classes,
        breakdown: [1, 2, 3, 4, 5, 6].map((tahun) => ({
          label: `Tahun ${tahun}`,
          value: counts.classesByYear[tahun] ?? 0,
        })),
      },
      { label: 'Murid', value: counts.students },
      { label: 'Markah', value: counts.marks },
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
        { label: 'SRI', value: counts.schoolCategories.SRI ?? 0 },
      ],
    },
    {
      label: 'Kelas',
      value: counts.classes,
      breakdown: [1, 2, 3, 4, 5, 6].map((tahun) => ({
        label: `Tahun ${tahun}`,
        value: counts.classesByYear[tahun] ?? 0,
      })),
    },
    {
      label: 'Murid Aktif',
      value: counts.students,
      breakdown: [
        { label: 'Lelaki', value: counts.studentGender.lelaki },
        { label: 'Perempuan', value: counts.studentGender.perempuan },
      ],
    },
  ];
}

function scopedCountsForProfile(
  counts: SetupCounts,
  insights: DashboardInsights,
  profile: ReturnType<typeof useAccessProfile>,
  selectedDistrict: string | null,
) {
  const emptyDistrictCounts: SetupCounts = {
    schools: 0,
    users: 0,
    subjects: counts.subjects,
    exams: counts.exams,
    classes: 0,
    students: 0,
    marks: 0,
    schoolCategories: {},
    studentGender: { lelaki: 0, perempuan: 0 },
    classesByYear: {},
  };
  if (!profile) return counts;
  if (profile.role === 'ADMIN_ZON' && profile.zon) {
    return insights.scopeCounts.zones[profile.zon] ?? counts;
  }
  if (profile.role === 'ADMIN_SEKOLAH' && profile.kod_sekolah) {
    return insights.scopeCounts.schools[profile.kod_sekolah] ?? counts;
  }
  if (profile.role === 'OWNER') {
    return selectedDistrict ? insights.scopeCounts.districts[selectedDistrict] ?? emptyDistrictCounts : insights.scopeCounts.all;
  }
  if (profile.role === 'ADMIN_DAERAH') {
    return insights.scopeCounts.districts[profile.daerah?.toUpperCase() ?? 'GOMBAK'] ?? counts;
  }
  return counts;
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

  return [...groups.entries()]
    .sort(([left], [right]) => schoolCategoryRank(left) - schoolCategoryRank(right))
    .map(([kategori, items]) => ({
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
  const zones = ['BARAT', 'TENGAH', 'TIMUR'];

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

function CompletionChart({
  schools,
  classes,
  isSchoolAdmin,
}: {
  schools: MarkCompletionSchool[];
  classes: MarkCompletionClass[];
  isSchoolAdmin: boolean;
}) {
  const chartRows = isSchoolAdmin
    ? [1, 2, 3, 4, 5, 6].map((tahun) => {
        const rows = classes.filter((row) => row.tahun === tahun);
        const total = rows.length;
        const done = rows.filter((row) => row.complete).length;
        return { label: `T${tahun}`, total, done };
      })
    : [
        {
          label: 'Sekolah lengkap',
          total: schools.length,
          done: schools.filter((row) => row.complete).length,
        },
        {
          label: 'Belum lengkap',
          total: schools.length,
          done: schools.filter((row) => !row.complete).length,
        },
      ];

  return (
    <div className="completion-chart">
      <h3>{isSchoolAdmin ? 'Status Ikut Tahun' : 'Status Ikut Sekolah'}</h3>
      <div className="chart-bars">
        {chartRows.map((row) => {
          const percent = row.total > 0 ? Math.round((row.done / row.total) * 100) : 0;
          return (
            <div className="chart-row" key={row.label}>
              <span>{row.label}</span>
              <div className="chart-track">
                <i style={{ width: `${percent}%` }} />
              </div>
              <b>{percent}%</b>
            </div>
          );
        })}
      </div>
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
      <div className="completion-layout">
        <div>
          <div className="panel-head compact-head">
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
        </div>
        <CompletionChart schools={scopedSchools} classes={scopedClasses} isSchoolAdmin={isSchoolAdmin} />
      </div>
      {view && (
        <CompletionList
          title={view === 'done' ? `Senarai ${unitLabel} lengkap` : `Senarai ${unitLabel} belum selesai`}
          rows={visibleRows}
        />
      )}
    </section>
  );
}

function TeacherDashboard({
  nama,
  role,
  kodSekolah,
  classes,
  subjects,
}: {
  nama: string;
  role?: string;
  kodSekolah?: string | null;
  classes: TeacherDashboardClass[];
  subjects: TeacherDashboardSubject[];
}) {
  const isGuruKelas = role === 'GURU_KELAS';
  const primarySchool = classes[0]?.nama_sekolah ?? subjects[0]?.nama_sekolah ?? kodSekolah ?? '-';
  const relatedClassNames = isGuruKelas
    ? classes.map((item) => `Tahun ${item.tahun} - ${item.nama_kelas}`)
    : [...new Set(subjects.map((item) => `Tahun ${item.tahun} - ${item.nama_kelas}`))];
  const countRows = isGuruKelas && classes.length > 0 ? classes : subjects;
  const uniqueClassTotals = new Map<string, { jumlah: number; lelaki: number; perempuan: number }>();
  countRows.forEach((item) => {
    if (!uniqueClassTotals.has(item.class_id)) {
      uniqueClassTotals.set(item.class_id, {
        jumlah: item.jumlah_murid,
        lelaki: item.lelaki,
        perempuan: item.perempuan,
      });
    }
  });
  const totals = [...uniqueClassTotals.values()].reduce(
    (sum, item) => ({
      jumlah: sum.jumlah + item.jumlah,
      lelaki: sum.lelaki + item.lelaki,
      perempuan: sum.perempuan + item.perempuan,
    }),
    { jumlah: 0, lelaki: 0, perempuan: 0 },
  );
  const subjectLabels = [...new Map(subjects.map((item) => [item.kod_subjek, item.nama_subjek])).values()];
  const roleLabel = isGuruKelas ? 'Guru Kelas' : 'Guru Subjek';

  return (
    <div className="teacher-dashboard-wrap">
      <section className="panel teacher-dashboard-panel">
        <div className="panel-head">
          <div>
            <h2>Ringkasan Tugasan</h2>
            <p className="table-note">Paparan ringkas untuk {roleLabel}.</p>
          </div>
        </div>
        <div className="teacher-profile-card">
          <div>
            <span>Nama Pengguna</span>
            <strong>{nama}</strong>
          </div>
          <div>
            <span>Sekolah Bertugas</span>
            <strong>{primarySchool}</strong>
          </div>
          <div>
            <span>Peranan</span>
            <strong>{roleLabel}</strong>
          </div>
        </div>

        <div className="teacher-info-grid">
          {isGuruKelas && (
            <div className="teacher-info-card wide">
              <span>Kelas</span>
              <strong>{relatedClassNames.join(', ') || 'Belum ditetapkan'}</strong>
            </div>
          )}
          <div className="teacher-info-card total">
            <span>Jumlah Murid</span>
            <strong>{totals.jumlah}</strong>
          </div>
          <div className="teacher-info-card">
            <span>Lelaki</span>
            <strong>{totals.lelaki}</strong>
          </div>
          <div className="teacher-info-card">
            <span>Perempuan</span>
            <strong>{totals.perempuan}</strong>
          </div>
          <div className="teacher-info-card wide">
            <span>Mata Pelajaran Diajar</span>
            {subjectLabels.length > 0 ? (
              <div className="subject-chip-list">
                {subjectLabels.map((subject) => (
                  <b key={subject}>{subject}</b>
                ))}
              </div>
            ) : (
              <strong>Belum ditetapkan</strong>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ExamDashboardTabs({
  active,
  onChange,
}: {
  active: 'ringkasan' | 'status' | 'prestasi' | 'kedudukan';
  onChange: (value: 'ringkasan' | 'status' | 'prestasi' | 'kedudukan') => void;
}) {
  const tabs = [
    ['ringkasan', 'Ringkasan'],
    ['status', 'Status Penghantaran'],
    ['prestasi', 'Prestasi'],
    ['kedudukan', 'Kedudukan'],
  ] as const;

  return (
    <div className="exam-dashboard-tabs" role="tablist" aria-label="Paparan dashboard peperiksaan">
      {tabs.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={active === value}
          className={active === value ? 'active' : ''}
          onClick={() => onChange(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ExamSelector({
  examOptions,
  selectedKey,
  showPsra,
}: {
  examOptions: Array<{ key: string; label: string; group: 'utama' | 'psra' }>;
  selectedKey: string | null;
  showPsra: boolean;
}) {
  const mainOptions = examOptions.filter((exam) => exam.group === 'utama');
  const psraOptions = showPsra ? examOptions.filter((exam) => exam.group === 'psra') : [];

  return (
    <div className="exam-selector-bar">
      <div>
        <span className="eyebrow">ANALISIS PEPERIKSAAN</span>
        <strong>Pilih peperiksaan</strong>
      </div>
      <select
        value={selectedKey ?? ''}
        aria-label="Pilih peperiksaan untuk dianalisis"
        onChange={(event) => {
          const value = event.target.value;
          window.location.href = value ? `/?exam=${encodeURIComponent(value)}` : '/';
        }}
      >
        {examOptions.length === 0 ? <option value="">Belum ada peperiksaan</option> : null}
        {mainOptions.length > 0 ? (
          <optgroup label="Peperiksaan Utama">
            {mainOptions.map((exam) => <option key={exam.key} value={exam.key}>{exam.label}</option>)}
          </optgroup>
        ) : null}
        {psraOptions.length > 0 ? (
          <optgroup label="Percubaan PSRA">
            {psraOptions.map((exam) => <option key={exam.key} value={exam.key}>{exam.label}</option>)}
          </optgroup>
        ) : null}
      </select>
    </div>
  );
}

function ExamActionKpis({
  latestExamLabel,
  schools,
  classes,
  bestSchool,
}: {
  latestExamLabel: string;
  schools: MarkCompletionSchool[];
  classes: MarkCompletionClass[];
  bestSchool?: DashboardSchoolRank;
}) {
  const rows = schools.length > 0 ? schools : classes;
  const completed = rows.filter((row) => row.complete).length;
  const pending = rows.filter((row) => !row.complete).length;
  const completion = rows.length > 0 ? Math.round((completed / rows.length) * 100) : 0;

  return (
    <div className="exam-action-kpis">
      <div className="exam-action-kpi exam-action-kpi--exam">
        <span>Peperiksaan semasa</span>
        <strong>{latestExamLabel}</strong>
        <small>Data yang sedang dianalisis</small>
      </div>
      <div className="exam-action-kpi exam-action-kpi--done">
        <span>Lengkap dihantar</span>
        <strong>{completed}</strong>
        <small>{completion}% daripada keseluruhan</small>
      </div>
      <div className="exam-action-kpi exam-action-kpi--pending">
        <span>Perlu tindakan</span>
        <strong>{pending}</strong>
        <small>Belum selesai atau belum lengkap</small>
      </div>
      <div className="exam-action-kpi exam-action-kpi--best">
        <span>Prestasi tertinggi</span>
        <strong>{bestSchool ? formatNumber(bestSchool.purata) : '-'}</strong>
        <small>{bestSchool?.nama_sekolah ?? 'Belum ada data markah'}</small>
      </div>
    </div>
  );
}

type PsraSchoolDashboardRow = {
  key: string;
  label: string;
  schools: number;
  candidates: number;
  completeCandidates: number;
  completedSchools: number;
  enteredMarks: number;
  expectedMarks: number;
  completion: number;
  average: number | null;
};

function PsraDashboard({
  insights,
  selectedDistrict,
  role,
  profileDistrict,
  profileZone,
  profileSchool,
}: {
  insights: DashboardInsights;
  selectedDistrict: string | null;
  role?: string;
  profileDistrict?: string | null;
  profileZone?: string | null;
  profileSchool?: string | null;
}) {
  const selection = insights.psraSelection;
  const [records, setRecords] = useState<PsraPaperMarkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      if (!supabase || !selection) {
        setLoading(false);
        setErrorMessage('Sambungan data Percubaan PSRA tidak tersedia.');
        return;
      }

      setLoading(true);
      setErrorMessage('');
      const rows: PsraPaperMarkRecord[] = [];
      const pageSize = 1000;

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await supabase
          .from('psra_trial_paper_marks')
          .select('id,kod_sekolah,tahun_akademik,class_id,student_id,sesi,paper_code,markah,entered_by,updated_by,updated_at')
          .eq('tahun_akademik', selection.year)
          .eq('sesi', selection.session)
          .order('id')
          .range(from, from + pageSize - 1);

        if (cancelled) return;
        if (error) {
          setErrorMessage(`Data Percubaan PSRA tidak dapat dimuatkan: ${error.message}`);
          setRecords([]);
          setLoading(false);
          return;
        }

        const batch = (data ?? []) as PsraPaperMarkRecord[];
        rows.push(...batch);
        if (batch.length < pageSize) break;
      }

      if (!cancelled) {
        setRecords(rows);
        setLoading(false);
      }
    }

    void loadRecords();
    return () => {
      cancelled = true;
    };
  }, [selection]);

  const schoolRows = useMemo(() => {
    const marksByStudent = new Map<string, Map<string, number>>();
    records.forEach((record) => {
      const marks = marksByStudent.get(record.student_id) ?? new Map<string, number>();
      marks.set(record.paper_code, Number(record.markah));
      marksByStudent.set(record.student_id, marks);
    });

    return insights.psraSchools
      .filter((school) => {
        if (selectedDistrict && school.daerah.toUpperCase() !== selectedDistrict) return false;
        if (role === 'ADMIN_DAERAH' && school.daerah.toUpperCase() !== profileDistrict?.toUpperCase()) return false;
        if (role === 'ADMIN_ZON' && school.zon !== profileZone) return false;
        if (role === 'ADMIN_SEKOLAH' && school.kod_sekolah !== profileSchool) return false;
        return true;
      })
      .map((school) => {
        let enteredMarks = 0;
        let completeCandidates = 0;
        const completeAverages: number[] = [];

        school.candidateIds.forEach((studentId) => {
          const marks = marksByStudent.get(studentId);
          if (!marks) return;
          enteredMarks += PSRA_PAPERS.filter((paper) => marks.has(paper.subjectCode)).length;
          if (PSRA_PAPERS.every((paper) => marks.has(paper.subjectCode))) {
            const total = PSRA_PAPERS.reduce((sum, paper) => sum + Number(marks.get(paper.subjectCode) ?? 0), 0);
            completeAverages.push(total / PSRA_PAPERS.length);
            completeCandidates += 1;
          }
        });

        const expectedMarks = school.candidateIds.length * PSRA_PAPERS.length;
        const completion = expectedMarks > 0 ? Math.min(Math.round((enteredMarks / expectedMarks) * 100), 100) : 0;
        return {
          ...school,
          candidates: school.candidateIds.length,
          completeCandidates,
          enteredMarks,
          expectedMarks,
          completion,
          average: completeAverages.length
            ? completeAverages.reduce((sum, value) => sum + value, 0) / completeAverages.length
            : null,
        };
      });
  }, [insights.psraSchools, profileDistrict, profileSchool, profileZone, records, role, selectedDistrict]);

  const rows = useMemo<PsraSchoolDashboardRow[]>(() => {
    if (role !== 'OWNER') {
      return schoolRows.map((school) => ({
        key: school.kod_sekolah,
        label: school.nama_sekolah,
        schools: 1,
        candidates: school.candidates,
        completeCandidates: school.completeCandidates,
        completedSchools: school.completion === 100 ? 1 : 0,
        enteredMarks: school.enteredMarks,
        expectedMarks: school.expectedMarks,
        completion: school.completion,
        average: school.average,
      }));
    }

    const districts = selectedDistrict ? [selectedDistrict] : SELANGOR_DISTRICTS;
    return districts.map((district) => {
      const districtSchools = schoolRows.filter((school) => school.daerah.toUpperCase() === district);
      const candidates = districtSchools.reduce((sum, school) => sum + school.candidates, 0);
      const completeCandidates = districtSchools.reduce((sum, school) => sum + school.completeCandidates, 0);
      const enteredMarks = districtSchools.reduce((sum, school) => sum + school.enteredMarks, 0);
      const expectedMarks = districtSchools.reduce((sum, school) => sum + school.expectedMarks, 0);
      const weightedTotal = districtSchools.reduce(
        (sum, school) => sum + (school.average ?? 0) * school.completeCandidates,
        0,
      );
      return {
        key: district,
        label: district,
        schools: districtSchools.length,
        candidates,
        completeCandidates,
        completedSchools: districtSchools.filter((school) => school.completion === 100).length,
        enteredMarks,
        expectedMarks,
        completion: expectedMarks > 0 ? Math.min(Math.round((enteredMarks / expectedMarks) * 100), 100) : 0,
        average: completeCandidates > 0 ? weightedTotal / completeCandidates : null,
      };
    });
  }, [role, schoolRows, selectedDistrict]);

  const totalSchools = rows.reduce((sum, row) => sum + row.schools, 0);
  const totalCandidates = rows.reduce((sum, row) => sum + row.candidates, 0);
  const totalComplete = rows.reduce((sum, row) => sum + row.completeCandidates, 0);
  const totalEntered = rows.reduce((sum, row) => sum + row.enteredMarks, 0);
  const totalExpected = rows.reduce((sum, row) => sum + row.expectedMarks, 0);
  const attentionRows = [...rows].sort((a, b) => a.completion - b.completion || a.label.localeCompare(b.label));
  const performanceRows = rows.filter((row) => row.average !== null).sort((a, b) => (b.average ?? 0) - (a.average ?? 0));
  const rowHeading = role === 'OWNER' ? 'Daerah' : 'Sekolah';

  return (
    <section className="owner-dashboard-wrap">
      <div className="owner-dashboard-banner">
        <div>
          <span className="eyebrow">PERCUBAAN PSRA</span>
          <h2>Dashboard Percubaan PSRA {selection?.session}</h2>
          <p>Pemantauan pengisian lima kertas Percubaan PSRA bagi calon Tahun 6.</p>
        </div>
        <div className="owner-banner-exam">
          <small>Penilaian dipilih</small>
          <strong>{insights.latestExamLabel}</strong>
          <span>{totalSchools} sekolah mempunyai calon</span>
        </div>
      </div>

      <div className="owner-kpi-grid">
        <div className="owner-kpi"><span>Sekolah terlibat</span><strong>{totalSchools}</strong><small>Mempunyai calon Tahun 6</small></div>
        <div className="owner-kpi"><span>Jumlah calon</span><strong>{totalCandidates}</strong><small>Calon aktif Tahun 6</small></div>
        <div className="owner-kpi owner-kpi--good"><span>Calon lengkap</span><strong>{totalComplete}</strong><small>Lengkap semua lima kertas</small></div>
        <div className="owner-kpi owner-kpi--warning"><span>Belum lengkap</span><strong>{Math.max(totalCandidates - totalComplete, 0)}</strong><small>Calon yang perlu tindakan</small></div>
      </div>

      {loading ? <div className="panel"><p className="empty">Memuatkan data Percubaan PSRA...</p></div> : null}
      {errorMessage ? <div className="panel"><p className="empty">{errorMessage}</p></div> : null}

      {!loading && !errorMessage ? (
        <>
          <div className="owner-dashboard-grid">
            <section className="panel owner-district-panel">
              <div className="panel-head"><div><h2>Ringkasan {rowHeading.toLowerCase()}</h2><p className="table-note">Kelengkapan pengisian dan purata calon yang lengkap.</p></div><span>{rows.length} rekod</span></div>
              <div className="owner-district-table">
                <div className="owner-table-row owner-table-head"><span>{rowHeading}</span><span>Sekolah</span><span>Calon</span><span>Pengisian</span><span>Purata</span></div>
                {rows.map((row) => (
                  <div className="owner-table-row" key={row.key}>
                    <strong>{row.label}</strong><span>{row.schools}</span><span>{row.candidates}</span>
                    <span><b>{row.completion}%</b><i className="owner-progress"><em style={{ width: `${row.completion}%` }} /></i></span>
                    <span>{row.average === null ? '-' : row.average.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel owner-alert-panel">
              <div className="panel-head"><div><h2>Perlu perhatian segera</h2><p className="table-note">Pengisian lima kertas paling rendah.</p></div></div>
              <div className="owner-alert-list">
                {attentionRows.slice(0, 5).map((row) => (
                  <div key={row.key}><span><strong>{row.label}</strong><small>{row.completeCandidates} daripada {row.candidates} calon lengkap</small></span><b>{row.completion}%</b></div>
                ))}
              </div>
            </section>
          </div>

          <div className="owner-dashboard-grid">
            <section className="panel owner-chart-panel">
              <div className="panel-head"><div><h2>Purata prestasi PSRA</h2><p className="table-note">Berdasarkan calon yang lengkap semua lima kertas.</p></div></div>
              <div className="owner-bars">
                {performanceRows.length ? performanceRows.map((row) => (
                  <div className="owner-bar-row" key={row.key}><span>{row.label}</span><div><i style={{ width: `${Math.min(Math.max(row.average ?? 0, 0), 100)}%` }} /></div><b>{row.average?.toFixed(2)}</b></div>
                )) : <InsightEmpty text="Belum ada calon dengan lima kertas lengkap." />}
              </div>
            </section>
            <section className="panel owner-chart-panel">
              <div className="panel-head"><div><h2>Ringkasan pengisian</h2><p className="table-note">Status rekod untuk sesi yang dipilih.</p></div></div>
              <div className="owner-fact-list">
                <div><span>Tahun akademik</span><strong>{selection?.year ?? '-'}</strong></div>
                <div><span>Sesi percubaan</span><strong>{selection?.session ?? '-'}</strong></div>
                <div><span>Kertas dinilai</span><strong>{PSRA_PAPERS.length}</strong></div>
                <div><span>Markah diisi</span><strong>{totalEntered}/{totalExpected}</strong></div>
              </div>
            </section>
          </div>
        </>
      ) : null}
    </section>
  );
}

function OwnerStateDashboard({
  insights,
  selectedDistrict,
  view,
}: {
  insights: DashboardInsights;
  selectedDistrict: string | null;
  view: 'ringkasan' | 'status' | 'prestasi' | 'kedudukan';
}) {
  const districts = selectedDistrict ? [selectedDistrict] : SELANGOR_DISTRICTS;
  const rows = districts.map((district) => {
    const counts = insights.scopeCounts.districts[district] ?? {
      schools: 0, users: 0, subjects: 0, exams: 0, classes: 0, students: 0, marks: 0,
      schoolCategories: {}, studentGender: { lelaki: 0, perempuan: 0 }, classesByYear: {},
    };
    const completion = insights.completionSchools.filter((item) => item.daerah.toUpperCase() === district);
    const complete = completion.filter((item) => item.complete).length;
    const performance = insights.schoolRanks.filter((item) => item.daerah.toUpperCase() === district);
    const average = performance.length ? performance.reduce((sum, item) => sum + (item.purata ?? 0), 0) / performance.length : null;
    return { district, counts, complete, pending: Math.max(completion.length - complete, 0), completion: completion.length ? Math.round((complete / completion.length) * 100) : 0, average, performanceCount: performance.length };
  });
  const allCounts = insights.scopeCounts.all;
  const totalComplete = rows.reduce((sum, row) => sum + row.complete, 0);
  const totalPending = rows.reduce((sum, row) => sum + row.pending, 0);
  const performanceRows = rows.filter((row) => row.average !== null).sort((a, b) => (b.average ?? -1) - (a.average ?? -1));
  const attentionRows = [...rows].sort((a, b) => a.completion - b.completion || a.district.localeCompare(b.district));
  const tabTitle = view === 'status' ? 'Status penghantaran mengikut daerah' : view === 'prestasi' ? 'Prestasi daerah Selangor' : view === 'kedudukan' ? 'Kedudukan daerah' : 'Ringkasan negeri Selangor';

  return (
    <section className="owner-dashboard-wrap">
      <div className="owner-dashboard-banner">
        <div><span className="eyebrow">PAPAN PEMILIK SISTEM</span><h2>Dashboard UPI Selangor</h2><p>Pusat pemantauan keseluruhan sekolah, penghantaran markah dan pencapaian daerah.</p></div>
        <div className="owner-banner-exam"><small>Peperiksaan dipilih</small><strong>{insights.latestExamLabel}</strong><span>9 daerah dalam Selangor</span></div>
      </div>

      <div className="owner-kpi-grid">
        <div className="owner-kpi"><span>Jumlah sekolah</span><strong>{allCounts.schools}</strong><small>Seluruh Selangor</small></div>
        <div className="owner-kpi"><span>Jumlah calon</span><strong>{allCounts.students}</strong><small>Murid aktif</small></div>
        <div className="owner-kpi owner-kpi--good"><span>Penghantaran lengkap</span><strong>{totalComplete}</strong><small>{totalComplete + totalPending ? Math.round((totalComplete / (totalComplete + totalPending)) * 100) : 0}% daripada sekolah</small></div>
        <div className="owner-kpi owner-kpi--warning"><span>Perlu tindakan</span><strong>{totalPending}</strong><small>Sekolah belum lengkap</small></div>
      </div>

      <div className="owner-dashboard-grid">
        <section className="panel owner-district-panel">
          <div className="panel-head"><div><h2>{tabTitle}</h2><p className="table-note">Perbandingan prestasi dan status {insights.latestExamLabel}.</p></div><span>{rows.length} daerah</span></div>
          <div className="owner-district-table"><div className="owner-table-row owner-table-head"><span>Daerah</span><span>Sekolah</span><span>Calon</span><span>Lengkap</span><span>Purata</span></div>{rows.map((row) => <div className="owner-table-row" key={row.district}><strong>{row.district}</strong><span>{row.counts.schools}</span><span>{row.counts.students}</span><span><b>{row.completion}%</b><i className="owner-progress"><em style={{ width: `${row.completion}%` }} /></i></span><span>{row.average === null ? '-' : row.average.toFixed(2)}</span></div>)}</div>
        </section>

        <section className="panel owner-alert-panel">
          <div className="panel-head"><div><h2>Perlu perhatian segera</h2><p className="table-note">Daerah dengan penghantaran paling rendah.</p></div></div>
          <div className="owner-alert-list">{attentionRows.slice(0, 5).map((row) => <div key={row.district}><span><strong>{row.district}</strong><small>{row.pending} sekolah belum lengkap</small></span><b>{row.completion}%</b></div>)}</div>
        </section>
      </div>

      <div className="owner-dashboard-grid">
        <section className="panel owner-chart-panel"><div className="panel-head"><div><h2>Purata prestasi daerah</h2><p className="table-note">Daerah yang telah mempunyai data markah.</p></div></div><div className="owner-bars">{performanceRows.length ? performanceRows.map((row) => <div className="owner-bar-row" key={row.district}><span>{row.district}</span><div><i style={{ width: `${Math.min(Math.max((row.average ?? 0), 0), 100)}%` }} /></div><b>{row.average?.toFixed(2)}</b></div>) : <InsightEmpty text="Belum ada data prestasi daerah." />}</div></section>
        <section className="panel owner-chart-panel"><div className="panel-head"><div><h2>Ringkasan sistem</h2><p className="table-note">Maklumat asas yang perlu dipantau pemilik.</p></div></div><div className="owner-fact-list"><div><span>Kelas aktif</span><strong>{allCounts.classes}</strong></div><div><span>Guru / pengguna</span><strong>{allCounts.users}</strong></div><div><span>Mata pelajaran</span><strong>{allCounts.subjects}</strong></div><div><span>Peperiksaan</span><strong>{allCounts.exams}</strong></div></div></section>
      </div>
    </section>
  );
}

export default function DashboardContent({ counts, insights }: { counts: SetupCounts; insights: DashboardInsights }) {
  const profile = useAccessProfile();
  const [schoolCategory, setSchoolCategory] = useState('SEMUA');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [dashboardView, setDashboardView] = useState<'ringkasan' | 'status' | 'prestasi' | 'kedudukan'>('ringkasan');
  const isTeacher = profile?.role === 'GURU_KELAS' || profile?.role === 'GURU_SUBJEK';
  const teacherClasses = insights.teacherClasses.filter((item) => item.user_id === profile?.id);
  const teacherSubjects = insights.teacherSubjects.filter((item) => item.user_id === profile?.id);
  const scopedCounts = scopedCountsForProfile(counts, insights, profile, selectedDistrict);
  const metrics = metricsForRole(scopedCounts, profile?.role);
  const isSchoolAdmin = profile?.role === 'ADMIN_SEKOLAH';
  const isZoneAdmin = profile?.role === 'ADMIN_ZON';
  const dashboardDistrict = profile?.role === 'ADMIN_DAERAH'
    ? profile.daerah?.toUpperCase() ?? 'GOMBAK'
    : selectedDistrict;
  const scopedSchoolRanks = insights.schoolRanks.filter((row) => {
    if (dashboardDistrict && row.daerah?.toUpperCase?.() !== dashboardDistrict) return false;
    if (isZoneAdmin) return row.zon === profile?.zon;
    if (isSchoolAdmin) return row.kod_sekolah === profile?.kod_sekolah;
    return true;
  });
  const categorySchoolRanks = schoolCategory === 'SEMUA'
    ? scopedSchoolRanks
    : scopedSchoolRanks.filter((row) => row.kategori.toUpperCase() === schoolCategory);
  const schoolOwnRank = scopedSchoolRanks.find((row) => row.kod_sekolah === profile?.kod_sekolah);
  const schoolClassRanks = insights.classRanks.filter((row) => row.kod_sekolah === profile?.kod_sekolah);
  const scopedCompletionSchools = insights.completionSchools.filter((row) => {
    if (dashboardDistrict && row.daerah?.toUpperCase?.() !== dashboardDistrict) return false;
    if (isZoneAdmin) return row.zon === profile?.zon;
    if (isSchoolAdmin) return row.kod_sekolah === profile?.kod_sekolah;
    return true;
  });
  const scopedCompletionSchoolCodes = new Set(scopedCompletionSchools.map((school) => school.kod_sekolah));
  const scopedCompletionClasses = insights.completionClasses.filter((row) => {
    if (isSchoolAdmin) return row.kod_sekolah === profile?.kod_sekolah;
    if (dashboardDistrict || isZoneAdmin) return scopedCompletionSchoolCodes.has(row.kod_sekolah);
    return true;
  });
  const bestSchool = categorySchoolRanks[0];
  const districtHasPsraAccess = profile?.role === 'ADMIN_DAERAH' && insights.psraAvailableDistricts.includes(
    profile.daerah?.toUpperCase() ?? '',
  );
  const canViewPsra = profile?.role === 'OWNER' || districtHasPsraAccess || Boolean(
    profile?.enabled_modules?.includes('PERCUBAAN_PSRA'),
  );

  useEffect(() => {
    if (profile && insights.psraSelection && !canViewPsra) {
      window.location.replace('/');
    }
  }, [canViewPsra, insights.psraSelection, profile]);

  if (profile && insights.psraSelection && !canViewPsra) {
    return (
      <>
        {profile.nama && <h2 className="welcome-title">Selamat datang, {profile.nama}</h2>}
        <ExamSelector examOptions={insights.examOptions} selectedKey={null} showPsra={false} />
        <div className="panel"><p className="empty">Percubaan PSRA belum dibenarkan untuk sekolah atau daerah ini.</p></div>
      </>
    );
  }

  if (profile && !isTeacher && insights.psraSelection) {
    return (
      <>
        {profile.nama && <h2 className="welcome-title">Selamat datang, {profile.nama}</h2>}
        <ExamSelector examOptions={insights.examOptions} selectedKey={insights.latestExamKey} showPsra={canViewPsra} />
        {profile.role === 'OWNER' ? (
          <div className="category-tabs dashboard-category-tabs dashboard-district-tabs" role="tablist" aria-label="Daerah Selangor">
            {['SEMUA', ...SELANGOR_DISTRICTS].map((district) => (
              <button
                key={district}
                type="button"
                className={`category-tab${(district === 'SEMUA' ? !selectedDistrict : selectedDistrict === district) ? ' active' : ''}`}
                onClick={() => setSelectedDistrict(district === 'SEMUA' ? null : district)}
              >
                {district === 'SEMUA' ? 'Semua Selangor' : district}
              </button>
            ))}
          </div>
        ) : null}
        <PsraDashboard
          insights={insights}
          selectedDistrict={selectedDistrict}
          role={profile.role}
          profileDistrict={profile.daerah}
          profileZone={profile.zon}
          profileSchool={profile.kod_sekolah}
        />
      </>
    );
  }

  return (
    <>
      {profile?.nama && <h2 className="welcome-title">Selamat datang, {profile.nama}</h2>}
      {isTeacher ? (
        <TeacherDashboard
          nama={profile?.nama ?? '-'}
          role={profile?.role}
          kodSekolah={profile?.kod_sekolah}
          classes={teacherClasses}
          subjects={teacherSubjects}
        />
      ) : (
        <>
      <ExamSelector examOptions={insights.examOptions} selectedKey={insights.latestExamKey} showPsra={canViewPsra} />
      {profile?.role !== 'OWNER' && <>
        <ExamDashboardTabs active={dashboardView} onChange={setDashboardView} />
        <ExamActionKpis
          latestExamLabel={insights.latestExamLabel}
          schools={isSchoolAdmin ? [] : scopedCompletionSchools}
          classes={isSchoolAdmin ? scopedCompletionClasses : []}
          bestSchool={bestSchool}
        />

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
      </>}

      {profile?.role === 'OWNER' ? (
        <div className="category-tabs dashboard-category-tabs dashboard-district-tabs" role="tablist" aria-label="Daerah Selangor">
          {['SEMUA', ...SELANGOR_DISTRICTS].map((district) => (
            <button
              key={district}
              type="button"
              className={`category-tab${(district === 'SEMUA' ? !selectedDistrict : selectedDistrict === district) ? ' active' : ''}`}
              onClick={() => setSelectedDistrict(district === 'SEMUA' ? null : district)}
            >
              {district === 'SEMUA' ? 'Semua Selangor' : district}
            </button>
          ))}
        </div>
      ) : (
        <div className="category-tabs dashboard-category-tabs" role="tablist" aria-label="Kategori sekolah dashboard">
          {['SEMUA', 'SRAI', 'SRA', 'KAFAI', 'SRI'].map((category) => (
            <button
              key={category}
              type="button"
              className={`category-tab${schoolCategory === category ? ' active' : ''}`}
              onClick={() => setSchoolCategory(category)}
            >
              {category === 'SEMUA' ? 'Semua Sekolah' : category}
            </button>
          ))}
        </div>
      )}

      {profile?.role === 'OWNER' ? (
        <OwnerStateDashboard insights={insights} selectedDistrict={selectedDistrict} view={dashboardView} />
      ) : <>
      {dashboardView !== 'status' && dashboardView !== 'kedudukan' && (
        <div className="dashboard-feature-grid">
          {isSchoolAdmin ? (
            <SchoolFocus schoolRank={schoolOwnRank} classRanks={schoolClassRanks} />
          ) : (
            <SchoolLeaderboard
              rows={categorySchoolRanks}
              title={isZoneAdmin ? `5 Sekolah Terbaik ${zoneLabel(profile?.zon)}` : '5 Sekolah Terbaik Daerah'}
              subtitle={`Mengikut kategori sekolah berdasarkan ${insights.latestExamLabel}.`}
            />
          )}

          <MarkCompletionPanel
            role={profile?.role}
            zon={profile?.zon}
            kodSekolah={profile?.kod_sekolah}
            latestExamLabel={insights.latestExamLabel}
            schools={scopedCompletionSchools}
            classes={scopedCompletionClasses}
          />
        </div>
      )}

      {dashboardView === 'status' && (
        <MarkCompletionPanel
          role={profile?.role}
          zon={profile?.zon}
          kodSekolah={profile?.kod_sekolah}
          latestExamLabel={insights.latestExamLabel}
          schools={scopedCompletionSchools}
          classes={scopedCompletionClasses}
        />
      )}

      {dashboardView === 'prestasi' && (
        <div className="dashboard-feature-grid dashboard-feature-grid--single">
          {isSchoolAdmin ? (
            <SchoolFocus schoolRank={schoolOwnRank} classRanks={schoolClassRanks} />
          ) : (
            <SchoolLeaderboard
              rows={categorySchoolRanks}
              title="Prestasi sekolah"
              subtitle={`Purata dan GPS sekolah berdasarkan ${insights.latestExamLabel}.`}
            />
          )}
        </div>
      )}

      {dashboardView === 'kedudukan' && (
        <div className="dashboard-feature-grid dashboard-feature-grid--single">
          <SchoolLeaderboard
            rows={categorySchoolRanks}
            title={isZoneAdmin ? `Kedudukan sekolah ${zoneLabel(profile?.zon)}` : 'Kedudukan sekolah'}
            subtitle={`Senarai prestasi terbaik berdasarkan ${insights.latestExamLabel}.`}
          />
        </div>
      )}
      </>}
        </>
      )}

    </>
  );
}
