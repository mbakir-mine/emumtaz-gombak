'use client';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { AccessProfile } from '@/lib/access';
import type { ClassRecord, School, StudentRecord } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeStudents } from '../ui/scopedData';
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

function canManageStudents(profile: AccessProfile | null) {
  return ['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'].includes(profile?.role ?? '');
}

function CategoryStudentCard({
  category,
  students,
  schoolMap,
  onSelect,
}: {
  category: string;
  students: StudentRecord[];
  schoolMap: Map<string, School>;
  onSelect: (filter: StudentFilter) => void;
}) {
  const categoryStudents = students.filter((student) => studentCategory(student, schoolMap) === category);
  const maleCount = categoryStudents.filter((student) => student.jantina === 'L').length;
  const femaleCount = categoryStudents.filter((student) => student.jantina === 'P').length;
  const zoneCounts = zoneOrder.map((zone) => ({
    zone,
    count: categoryStudents.filter((student) => studentZone(student, schoolMap) === zone).length,
  }));

  return (
    <article className="student-category-card">
      <div className="student-category-left">
        <h3>Murid Di {category}:</h3>
        <CountButton filter={{ label: `Murid ${category}`, category }} onSelect={onSelect}>
          <strong>{categoryStudents.length}</strong>
        </CountButton>
        <div className="student-category-gender">
          <span>
            L :
            <CountButton filter={{ label: `Murid lelaki ${category}`, category, gender: 'L' }} onSelect={onSelect}>
              <b>{maleCount}</b>
            </CountButton>
          </span>
          <span>
            P :
            <CountButton filter={{ label: `Murid perempuan ${category}`, category, gender: 'P' }} onSelect={onSelect}>
              <b>{femaleCount}</b>
            </CountButton>
          </span>
        </div>
      </div>
      <div className="student-category-zones">
        {zoneCounts.map((item) => (
          <span key={item.zone}>
            <em>{zoneText(item.zone)}</em>
            <i>:</i>
            <CountButton
              filter={{ label: `${category} ${zoneText(item.zone)}`, category, zone: item.zone }}
              onSelect={onSelect}
            >
              <b>{item.count}</b>
            </CountButton>
          </span>
        ))}
      </div>
    </article>
  );
}

function StudentSummaryCards({
  profile,
  students,
  schoolMap,
  formOpen,
  onToggleForm,
  onSelect,
}: {
  profile: AccessProfile | null;
  students: StudentRecord[];
  schoolMap: Map<string, School>;
  formOpen: boolean;
  onToggleForm: () => void;
  onSelect: (filter: StudentFilter) => void;
}) {
  const currentScope = scopeLabel(profile);
  const categoryCounts = ['SRAI', 'SRA', 'KAFAI'].map((category) => ({
    category,
    count: students.filter((student) => studentCategory(student, schoolMap) === category).length,
  }));

  return (
    <div className="student-summary-grid student-summary-category-grid">
      <article className="metric dashboard-metric student-summary-card student-total-card">
        <div className="student-card-main">
          <span>Jumlah Keseluruhan</span>
          <CountButton filter={{ label: `Semua murid ${currentScope}` }} onSelect={onSelect}>
            <strong>{students.length}</strong>
          </CountButton>
          {canManageStudents(profile) ? (
            <button className="button summary-add-button student-add-button" type="button" onClick={onToggleForm}>
              {formOpen ? 'TUTUP BORANG' : 'TAMBAH MURID'}
            </button>
          ) : null}
        </div>
        <div className="metric-breakdown student-count-list student-total-breakdown">
          {categoryCounts.map((item) => (
            <span key={item.category}>
              <em>{item.category}</em>
              <i>:</i>
              <CountButton
                filter={{ label: `${item.category} ${currentScope}`, category: item.category }}
                onSelect={onSelect}
              >
                <b>{item.count}</b>
              </CountButton>
            </span>
          ))}
        </div>
      </article>

      {['SRAI', 'SRA', 'KAFAI'].map((category) => (
        <CategoryStudentCard
          key={category}
          category={category}
          students={students}
          schoolMap={schoolMap}
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
}: {
  students: StudentRecord[];
  classes: ClassRecord[];
  schools: School[];
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
  const shouldShowList = Boolean(selectedFilter) || query.trim().length > 0;

  return (
    <>
      <div className="panel-head">
        <h2>{statsTitle(profile)}</h2>
        <span>{scopedStudents.length} rekod murid</span>
      </div>
      <StudentSummaryCards
        profile={profile}
        students={scopedStudents}
        schoolMap={schoolMap}
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
          <h2>Carian Murid</h2>
          {selectedFilter ? <p className="table-note">Paparan: {selectedFilter.label}</p> : null}
        </div>
        <span>
          {filteredStudents.length} / {scopedStudents.length} rekod
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
      ) : filteredStudents.length === 0 ? (
        <p className="empty">Tiada murid sepadan dengan carian.</p>
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
