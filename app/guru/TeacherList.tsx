'use client';

import { useMemo, useState } from 'react';
import type { School, TeacherClassAssignment, TeacherSubjectAssignment, UserRecord } from '@/lib/data';
import { roleLabel } from '@/lib/access';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeUsers } from '../ui/scopedData';
import TeacherForm from './TeacherForm';
import TeacherImportForm from './TeacherImportForm';

function accessLabel(user: UserRecord) {
  if (user.role === 'ADMIN_DAERAH') return 'Semua sekolah';
  if (user.role === 'ADMIN_ZON') {
    return user.zon ? `Zon ${user.zon.charAt(0) + user.zon.slice(1).toLowerCase()}` : 'Zon belum ditetapkan';
  }
  return user.kod_sekolah ?? '-';
}

const adminRoles = ['ADMIN_DAERAH', 'ADMIN_ZON', 'ADMIN_SEKOLAH'];
const teacherRoles = ['GURU_KELAS', 'GURU_SUBJEK'];
const countedRoles = ['ADMIN_ZON', 'ADMIN_SEKOLAH', 'GURU_KELAS', 'GURU_SUBJEK'];
const zoneOrder = ['BARAT', 'TENGAH', 'TIMUR'];

type UserFilter = {
  key: 'all' | 'admin' | 'teacher';
  label: string;
};

function schoolCategory(user: UserRecord, schoolMap: Map<string, School>) {
  if (!user.kod_sekolah) return null;
  return schoolMap.get(user.kod_sekolah)?.kategori?.toUpperCase() ?? null;
}

function userZone(user: UserRecord, schoolMap: Map<string, School>) {
  if (user.zon) return user.zon;
  if (!user.kod_sekolah) return null;
  return schoolMap.get(user.kod_sekolah)?.zon ?? null;
}

function countUsersByRole(users: UserRecord[], role: string) {
  return users.filter((user) => user.role === role).length;
}

function countUsersByCategory(users: UserRecord[], schools: Map<string, School>, category: string) {
  return users.filter((user) => schoolCategory(user, schools) === category).length;
}

function filterUsers(users: UserRecord[], filter: UserFilter | null) {
  if (!filter) return [];
  if (filter.key === 'admin') return users.filter((user) => adminRoles.includes(user.role));
  if (filter.key === 'teacher') return users.filter((user) => teacherRoles.includes(user.role));
  return users;
}

function teacherIdsByYear(
  users: UserRecord[],
  classAssignments: TeacherClassAssignment[],
  subjectAssignments: TeacherSubjectAssignment[],
  year: number,
) {
  const scopedUserIds = new Set(users.map((user) => user.id));
  const teacherIds = new Set<string>();
  classAssignments.forEach((item) => {
    if (item.classes?.tahun === year && scopedUserIds.has(item.user_id)) teacherIds.add(item.user_id);
  });
  subjectAssignments.forEach((item) => {
    if (item.classes?.tahun === year && scopedUserIds.has(item.user_id)) teacherIds.add(item.user_id);
  });
  return teacherIds;
}

function statsTitle(role: string | undefined) {
  const currentYear = new Date().getFullYear();
  if (role === 'ADMIN_ZON') return `Statistik Guru Zon ${currentYear}`;
  if (role === 'ADMIN_SEKOLAH') return `Statistik Guru Sekolah ${currentYear}`;
  return `Statistik Guru Daerah Gombak ${currentYear}`;
}

function TeacherSummaryCards({
  users,
  schools,
  role,
  classAssignments,
  subjectAssignments,
  onToggleForm,
  formOpen,
  onSelectYear,
}: {
  users: UserRecord[];
  schools: School[];
  role?: string;
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
  onToggleForm: () => void;
  formOpen: boolean;
  onSelectYear: (year: number) => void;
}) {
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school])), [schools]);
  const zoneCounts = zoneOrder.map((zone) => ({
    zone,
    count: users.filter((user) => userZone(user, schoolMap) === zone).length,
  }));
  const teacherByYear = [1, 2, 3, 4, 5, 6].map((year) => {
    const teacherIds = teacherIdsByYear(users, classAssignments, subjectAssignments, year);
    return { year, count: teacherIds.size };
  });
  const isSchoolAdmin = role === 'ADMIN_SEKOLAH';
  const schoolTeacherTotal = users.filter((user) => teacherRoles.includes(user.role)).length;

  return (
    <div className={`teacher-summary-grid ${isSchoolAdmin ? 'teacher-summary-grid-school' : ''}`}>
      <article className="teacher-summary-card">
        <div>
          <span>Jumlah Keseluruhan</span>
          <strong>{users.length}</strong>
        </div>
        <button className="button summary-add-button teacher-add-button" type="button" onClick={onToggleForm}>
          {formOpen ? 'TUTUP BORANG' : 'TAMBAH GURU'}
        </button>
      </article>

      <article className="teacher-summary-card">
        <div>
          <span>{isSchoolAdmin ? 'Jumlah Guru Mengikut Tahun' : 'Jumlah Mengikut Kategori'}</span>
          <strong>
            {isSchoolAdmin ? schoolTeacherTotal : users.filter((user) => user.kod_sekolah).length}
          </strong>
        </div>
        <div className={`teacher-count-list ${isSchoolAdmin ? 'teacher-count-list-year' : ''}`}>
          {(isSchoolAdmin ? teacherByYear : ['SRAI', 'SRA', 'KAFAI']).map((item) => (
            <span key={typeof item === 'string' ? item : item.year}>
              <em>{typeof item === 'string' ? item : `Tahun ${item.year}`}</em>
              <i>:</i>
              {typeof item === 'string' ? (
                <b>{countUsersByCategory(users, schoolMap, item)}</b>
              ) : (
                <button
                  type="button"
                  className="teacher-count-button"
                  onClick={() => onSelectYear(item.year)}
                  aria-label={`Papar guru Tahun ${item.year}`}
                >
                  {item.count}
                </button>
              )}
            </span>
          ))}
        </div>
      </article>

      {!isSchoolAdmin && (
        <article className="teacher-summary-card">
          <div>
            <span>Jumlah Zon</span>
            <strong>{zoneCounts.reduce((total, item) => total + item.count, 0)}</strong>
          </div>
          <div className="teacher-count-list">
            {zoneCounts.map((item) => (
              <span key={item.zone}>
                <em>Zon {item.zone.charAt(0) + item.zone.slice(1).toLowerCase()}</em>
                <i>:</i>
                <b>{item.count}</b>
              </span>
            ))}
          </div>
        </article>
      )}
    </div>
  );
}

function userOptions(role: string | undefined): UserFilter[] {
  if (role === 'ADMIN_ZON') {
    return [
      { key: 'all', label: 'Senarai Keseluruhan Pengguna Zon' },
      { key: 'teacher', label: 'Senarai Pengguna Guru' },
    ];
  }

  if (role === 'ADMIN_SEKOLAH') {
    return [{ key: 'teacher', label: 'Senarai Guru' }];
  }

  return [
    { key: 'all', label: 'Senarai Keseluruhan Pengguna' },
    { key: 'admin', label: 'Senarai Pengguna Admin' },
    { key: 'teacher', label: 'Senarai Pengguna Guru' },
  ];
}

export default function TeacherList({
  users,
  schools,
  classAssignments,
  subjectAssignments,
}: {
  users: UserRecord[];
  schools: School[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
}) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<UserFilter | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showForms, setShowForms] = useState(false);
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const options = useMemo(() => userOptions(profile?.role), [profile?.role]);
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    const yearTeacherIds = selectedYear
      ? teacherIdsByYear(scopedUsers, classAssignments, subjectAssignments, selectedYear)
      : null;
    const baseUsers = selectedYear
      ? scopedUsers.filter((user) => yearTeacherIds?.has(user.id))
      : selectedFilter
        ? filterUsers(scopedUsers, selectedFilter)
        : [];
    if (!term) return baseUsers;

    return (selectedFilter || selectedYear ? baseUsers : scopedUsers).filter((user) =>
      [accessLabel(user), user.nama, user.email, roleLabel(user.role), user.role, user.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [classAssignments, query, scopedUsers, selectedFilter, selectedYear, subjectAssignments]);
  const shouldShowList = Boolean(selectedFilter) || Boolean(selectedYear) || query.trim().length > 0;

  return (
    <>
      <div className="panel-head">
        <h2>{statsTitle(profile?.role)}</h2>
        <span>{scopedUsers.length} rekod pengguna</span>
      </div>
      <TeacherSummaryCards
        users={scopedUsers}
        schools={schools}
        role={profile?.role}
        classAssignments={classAssignments}
        subjectAssignments={subjectAssignments}
        formOpen={showForms}
        onToggleForm={() => setShowForms((value) => !value)}
        onSelectYear={(year) => {
          setSelectedYear(year);
          setSelectedFilter(null);
          setQuery('');
        }}
      />
      {showForms && (
        <div className="inline-add-panel teacher-add-panel">
          <div>
            <div className="panel-head">
              <h3>Tambah Guru</h3>
              <span>Profil akses sekolah</span>
            </div>
            <TeacherForm schools={schools} />
          </div>
          <div>
            <TeacherImportForm />
          </div>
        </div>
      )}
      <div className="panel-head">
        <h2>{selectedYear ? `Senarai Guru Tahun ${selectedYear}` : 'Senarai Pengguna Sekolah'}</h2>
        <span>
          {filteredUsers.length} / {scopedUsers.length} rekod
        </span>
      </div>
      <div className="list-choice-row">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={selectedFilter?.key === option.key ? 'button' : 'button soft'}
            onClick={() => {
              setSelectedFilter(option);
              setSelectedYear(null);
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (event.target.value.trim()) {
              setSelectedFilter(null);
              setSelectedYear(null);
            }
          }}
          placeholder="Cari nama guru, email, role atau status"
          aria-label="Cari guru"
        />
      </div>
      {!shouldShowList ? (
        <p className="empty">Pilih senarai pengguna atau gunakan carian nama guru untuk memaparkan rekod.</p>
      ) : filteredUsers.length === 0 ? (
        <p className="empty">Tiada pengguna sekolah sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Bil</th>
                <th>Akses</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id}>
                  <td>{index + 1}</td>
                  <td>{accessLabel(user)}</td>
                  <td>{user.nama}</td>
                  <td>{user.email}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
