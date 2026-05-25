'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccessProfile } from '@/lib/access';
import type { ClassRecord, School, StudentRecord, StudentSchoolSummary } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import StudentForm from './StudentForm';
import StudentImportForm from './StudentImportForm';

const zoneOrder = ['BARAT', 'TENGAH', 'TIMUR'];
const yearOrder = [1, 2, 3, 4, 5, 6];

type StudentFilter = {
  label: string;
  category?: string;
  zone?: string;
  year?: number;
  gender?: string;
};

function zoneText(zon: string | null | undefined) {
  if (!zon) return 'Zon belum ditetapkan';
  return `Zon ${zon.charAt(0) + zon.slice(1).toLowerCase()}`;
}

function statsTitle(profile: AccessProfile | null) {
  const currentYear = new Date().getFullYear();
  if (profile?.role === 'ADMIN_ZON') return `Statistik Murid ${zoneText(profile.zon)} ${currentYear}`;
  if (profile?.role === 'ADMIN_SEKOLAH') return `Statistik Murid Sekolah ${profile.kod_sekolah ?? ''} ${currentYear}`.trim();
  return `Statistik Murid Daerah Gombak ${currentYear}`;
}

function scopeLabel(profile: AccessProfile | null) {
  if (profile?.role === 'ADMIN_ZON') return zoneText(profile.zon);
  if (profile?.role === 'ADMIN_SEKOLAH') return profile.kod_sekolah ?? 'Sekolah';
  return 'Daerah Gombak';
}

function genderLabel(gender: string) {
  if (gender === 'L') return 'Lelaki';
  if (gender === 'P') return 'Perempuan';
  return 'Tiada jantina';
}

function CountButton({
  children,
  filter,
  onSelect,
}: {
  children: ReactNode;
  filter: StudentFilter;
  onSelect: (filter: StudentFilter) => void;
}) {
  return (
    <button type="button" className="school-count-button" onClick={() => onSelect(filter)}>
      {children}
    </button>
  );
}

function studentZone(student: StudentRecord, schoolMap: Map<string, School>) {
  return schoolMap.get(student.kod_sekolah)?.zon ?? null;
}

function studentCategory(student: StudentRecord, schoolMap: Map<string, School>) {
  return schoolMap.get(student.kod_sekolah)?.kategori?.toUpperCase() ?? null;
}

function studentYear(student: StudentRecord, classMap: Map<string, ClassRecord>) {
  if (!student.class_id) return null;
  return classMap.get(student.class_id)?.tahun ?? null;
}

function matchesFilter(
  student: StudentRecord,
  filter: StudentFilter | null,
  schoolMap: Map<string, School>,
  classMap: Map<string, ClassRecord>,
) {
  if (!filter) return false;
  if (filter.category && studentCategory(student, schoolMap) !== filter.category) return false;
  if (filter.zone && studentZone(student, schoolMap) !== filter.zone) return false;
  if (filter.year && studentYear(student, classMap) !== filter.year) return false;
  if (filter.gender && student.jantina !== filter.gender) return false;
  return true;
}

function matchesSchoolSummary(summary: StudentSchoolSummary, filter: StudentFilter | null) {
  if (!filter) return false;
  if (filter.category && summary.kategori?.toUpperCase() !== filter.category) return false;
  if (filter.zone && summary.zon !== filter.zone) return false;
  return true;
}

function summaryCounts(summary: StudentSchoolSummary, gender?: string) {
  const male = gender === 'P' ? 0 : summary.murid_lelaki;
  const female = gender === 'L' ? 0 : summary.murid_perempuan;
  return {
    male,
    female,
    total: male + female,
  };
}

function schoolLabel(kodSekolah: string, schoolMap: Map<string, School>) {
  const school = schoolMap.get(kodSekolah);
  return school ? `${school.kod_sekolah} - ${school.nama_sekolah}` : kodSekolah;
}

function canManageStudents(profile: AccessProfile | null) {
  return ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'].includes(profile?.role ?? '');
}

function BreakdownRow({
  label,
  filter,
  count,
  onSelect,
}: {
  label: string;
  filter: StudentFilter;
  count: number;
  onSelect: (filter: StudentFilter) => void;
}) {
  return (
    <span className="student-breakdown-row">
      <em>{label}</em>
      <i>:</i>
      <CountButton filter={filter} onSelect={onSelect}>
        <b>{count}</b>
      </CountButton>
    </span>
  );
}

function CategoryStudentCard({
  category,
  summaries,
  onSelect,
}: {
  category: string;
  summaries: StudentSchoolSummary[];
  onSelect: (filter: StudentFilter) => void;
}) {
  const categorySummaries = summaries.filter((summary) => summary.kategori?.toUpperCase() === category);
  const categoryTotal = categorySummaries.reduce((total, summary) => total + summary.jumlah_murid, 0);
  const maleCount = categorySummaries.reduce((total, summary) => total + summary.murid_lelaki, 0);
  const femaleCount = categorySummaries.reduce((total, summary) => total + summary.murid_perempuan, 0);
  const zoneCounts = zoneOrder.map((zone) => ({
    zone,
    count: categorySummaries
      .filter((summary) => summary.zon === zone)
      .reduce((total, summary) => total + summary.jumlah_murid, 0),
  }));

  return (
    <article className="student-category-card">
      <div className="student-category-left">
        <h3>Murid Di {category}</h3>
        <CountButton filter={{ label: `Murid ${category}`, category }} onSelect={onSelect}>
          <strong>{categoryTotal}</strong>
        </CountButton>
        <div className="student-category-gender">
          <BreakdownRow
            label="L"
            filter={{ label: `Murid lelaki ${category}`, category, gender: 'L' }}
            count={maleCount}
            onSelect={onSelect}
          />
          <BreakdownRow
            label="P"
            filter={{ label: `Murid perempuan ${category}`, category, gender: 'P' }}
            count={femaleCount}
            onSelect={onSelect}
          />
        </div>
      </div>
      <div className="student-category-zones">
        {zoneCounts.map((item) => (
          <BreakdownRow
            key={item.zone}
            label={zoneText(item.zone)}
            filter={{ label: `${category} ${zoneText(item.zone)}`, category, zone: item.zone }}
            count={item.count}
            onSelect={onSelect}
          />
        ))}
      </div>
    </article>
  );
}

function StudentSummaryCards({
  profile,
  summaries,
  formOpen,
  onToggleForm,
  onSelect,
}: {
  profile: AccessProfile | null;
  summaries: StudentSchoolSummary[];
  formOpen: boolean;
  onToggleForm: () => void;
  onSelect: (filter: StudentFilter) => void;
}) {
  const currentScope = scopeLabel(profile);
  const categoryCounts = ['SRAI', 'SRA', 'KAFAI'].map((category) => ({
    category,
    count: summaries
      .filter((summary) => summary.kategori?.toUpperCase() === category)
      .reduce((total, summary) => total + summary.jumlah_murid, 0),
  }));
  const totalStudents = summaries.reduce((total, summary) => total + summary.jumlah_murid, 0);

  return (
    <div className="student-summary-grid student-summary-category-grid">
      <article className="metric dashboard-metric student-summary-card student-total-card">
        <div className="student-card-main">
          <span>Jumlah Keseluruhan</span>
          <CountButton filter={{ label: `Semua murid ${currentScope}` }} onSelect={onSelect}>
            <strong>{totalStudents}</strong>
          </CountButton>
          {canManageStudents(profile) ? (
            <button className="button summary-add-button student-add-button" type="button" onClick={onToggleForm}>
              {formOpen ? 'TUTUP BORANG' : 'TAMBAH MURID'}
            </button>
          ) : null}
        </div>
        <div className="metric-breakdown student-count-list student-total-breakdown">
          {categoryCounts.map((item) => (
            <BreakdownRow
              key={item.category}
              label={item.category}
              filter={{ label: `${item.category} ${currentScope}`, category: item.category }}
              count={item.count}
              onSelect={onSelect}
            />
          ))}
        </div>
      </article>

      {['SRAI', 'SRA', 'KAFAI'].map((category) => (
        <CategoryStudentCard
          key={category}
          category={category}
          summaries={summaries}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export default function StudentList({
  students,
  classes,
  schools,
  schoolSummaries,
}: {
  students: StudentRecord[];
  classes: ClassRecord[];
  schools: School[];
  schoolSummaries: StudentSchoolSummary[];
}) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<StudentFilter | null>(null);
  const [showForms, setShowForms] = useState(false);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(
    () => scopeStudents(profile, students, classes, schools),
    [classes, profile, schools, students],
  );
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school])), [schools]);
  const scopedSchoolCodes = useMemo(() => new Set(scopeSchools(profile, schools).map((school) => school.kod_sekolah)), [profile, schools]);
  const fallbackSchoolSummaries = useMemo<StudentSchoolSummary[]>(() => {
    const grouped = new Map<string, StudentSchoolSummary>();

    scopedStudents.forEach((student) => {
      const school = schoolMap.get(student.kod_sekolah);
      const current = grouped.get(student.kod_sekolah) ?? {
        kod_sekolah: student.kod_sekolah,
        nama_sekolah: school?.nama_sekolah ?? student.kod_sekolah,
        kategori: school?.kategori ?? '',
        zon: school?.zon ?? null,
        jumlah_murid: 0,
        murid_lelaki: 0,
        murid_perempuan: 0,
      };

      if (student.status === 'AKTIF') {
        current.jumlah_murid += 1;
        if (student.jantina === 'L') current.murid_lelaki += 1;
        if (student.jantina === 'P') current.murid_perempuan += 1;
      }

      grouped.set(student.kod_sekolah, current);
    });

    return [...grouped.values()];
  }, [schoolMap, scopedStudents]);
  const scopedSchoolSummaries = useMemo(() => {
    if (schoolSummaries.length === 0) return fallbackSchoolSummaries;
    return schoolSummaries.filter((summary) => scopedSchoolCodes.has(summary.kod_sekolah));
  }, [fallbackSchoolSummaries, schoolSummaries, scopedSchoolCodes]);
  const classById = useMemo(() => new Map(scopedClasses.map((item) => [item.id, item])), [scopedClasses]);
  const filteredStudents = useMemo(() => {
    const term = query.trim().toLowerCase();
    const baseStudents = selectedFilter
      ? scopedStudents.filter((student) => matchesFilter(student, selectedFilter, schoolMap, classById))
      : [];
    if (!term) return baseStudents;

    return (selectedFilter ? baseStudents : scopedStudents).filter((student) => {
      const classRecord = student.class_id ? classById.get(student.class_id) : null;
      const classLabel = classRecord ? `Tahun ${classRecord.tahun} ${classRecord.nama_kelas}` : 'Tiada kelas';
      const school = schoolMap.get(student.kod_sekolah);
      return [student.nama_murid, student.mykid, student.kod_sekolah, school?.nama_sekolah, school?.zon, classLabel, student.jantina, student.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }, [classById, query, schoolMap, scopedStudents, selectedFilter]);
  const selectedSchoolSummaries = useMemo(() => {
    if (!selectedFilter) return [];
    return scopedSchoolSummaries
      .filter((summary) => matchesSchoolSummary(summary, selectedFilter))
      .map((summary) => {
        const counts = summaryCounts(summary, selectedFilter.gender);
        return {
          kodSekolah: summary.kod_sekolah,
          male: counts.male,
          female: counts.female,
          total: counts.total,
        };
      })
      .filter((summary) => summary.total > 0)
      .sort((a, b) => schoolLabel(a.kodSekolah, schoolMap).localeCompare(schoolLabel(b.kodSekolah, schoolMap)));
  }, [schoolMap, scopedSchoolSummaries, selectedFilter]);
  const shouldShowList = Boolean(selectedFilter) || query.trim().length > 0;
  const showSchoolSummary = Boolean(selectedFilter) && query.trim().length === 0;

  return (
    <>
      <div className="panel-head">
        <h2>{statsTitle(profile)}</h2>
        <span>{scopedSchoolSummaries.reduce((total, summary) => total + summary.jumlah_murid, 0)} rekod murid</span>
      </div>
      <StudentSummaryCards
        profile={profile}
        summaries={scopedSchoolSummaries}
        formOpen={showForms}
        onToggleForm={() => setShowForms((value) => !value)}
        onSelect={setSelectedFilter}
      />
      {showForms && (
        <div className="inline-add-panel student-add-panel">
          <div>
            <div className="panel-head">
              <h3>Tambah Murid</h3>
              <span>Murid mesti diikat kepada kelas</span>
            </div>
            {scopedClasses.length === 0 ? (
              <p className="notice">Sila daftar kelas dahulu sebelum memasukkan murid.</p>
            ) : (
              <StudentForm schools={schools} classes={classes} />
            )}
          </div>
          <div>
            <StudentImportForm schools={schools} />
          </div>
        </div>
      )}

      <div className="panel-head">
        <div>
          <h2>{showSchoolSummary ? 'Ringkasan Murid Mengikut Sekolah' : 'Carian Murid'}</h2>
          {selectedFilter ? <p className="table-note">Paparan: {selectedFilter.label}</p> : null}
        </div>
        <span>
          {showSchoolSummary
            ? `${selectedSchoolSummaries.length} sekolah - ${selectedSchoolSummaries.reduce((total, item) => total + item.total, 0)} murid`
            : `${filteredStudents.length} / ${scopedStudents.length} rekod`}
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim()) setSelectedFilter(null);
          }}
          placeholder="Cari nama murid, MyKid, sekolah, kelas, zon atau status"
          aria-label="Cari murid"
        />
      </div>
      {!shouldShowList ? (
        <p className="empty">Klik angka pada kad di atas atau gunakan carian untuk memaparkan senarai murid.</p>
      ) : showSchoolSummary && selectedSchoolSummaries.length === 0 ? (
        <p className="empty">Tiada ringkasan sekolah sepadan dengan pilihan ini.</p>
      ) : !showSchoolSummary && filteredStudents.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan carian.</p>
      ) : showSchoolSummary ? (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Kod Sekolah + Nama Sekolah</th>
                <th>Murid Lelaki</th>
                <th>Murid Perempuan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {selectedSchoolSummaries.map((item, index) => (
                <tr key={item.kodSekolah}>
                  <td>{index + 1}</td>
                  <td>{schoolLabel(item.kodSekolah, schoolMap)}</td>
                  <td>{item.male}</td>
                  <td>{item.female}</td>
                  <td>
                    <strong>{item.total}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Nama Murid</th>
                <th>Sekolah</th>
                <th>Tahun</th>
                <th>Kelas</th>
                <th>Jantina</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student, index) => {
                const classRecord = student.class_id ? classById.get(student.class_id) : null;
                return (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{student.nama_murid}</strong>
                      <small className="cell-subtext">{student.mykid}</small>
                    </td>
                    <td>{student.kod_sekolah}</td>
                    <td>{classRecord ? `Tahun ${classRecord.tahun}` : '-'}</td>
                    <td>{classRecord ? classRecord.nama_kelas : 'Tiada kelas'}</td>
                    <td>{student.jantina ? genderLabel(student.jantina) : '-'}</td>
                    <td>{student.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
