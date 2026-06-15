'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import { bulkAssignTeacherClasses } from './actions';
import { classLabel, schoolLabel, teacherOptionsForSchool } from './helpers';
import type { ClassRecord, School, TeacherClassAssignment, UserRecord } from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

export default function TeacherSubjectForm({
  schools,
  classes,
  users,
  classAssignments,
}: {
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
  classAssignments: TeacherClassAssignment[];
}) {
  const profile = useAccessProfile();
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [classState, classAction, classPending] = useActionState(bulkAssignTeacherClasses, initialState);

  const visibleSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const visibleClasses = useMemo(() => scopeClasses(profile, classes, schools), [profile, classes, schools]);
  const visibleUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, users, schools]);
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school])), [schools]);

  const yearOptions = useMemo(
    () => [...new Set(visibleClasses.map((item) => item.tahun_akademik))].sort((a, b) => b - a),
    [visibleClasses],
  );

  useEffect(() => {
    if (visibleSchools.length === 1) {
      setSelectedSchool(visibleSchools[0].kod_sekolah);
      return;
    }

    if (selectedSchool && !visibleSchools.some((school) => school.kod_sekolah === selectedSchool)) {
      setSelectedSchool('');
    }
  }, [selectedSchool, visibleSchools]);

  useEffect(() => {
    if (yearOptions.length === 0) return;
    const numericYear = Number(selectedYear);
    if (!yearOptions.includes(numericYear)) {
      const currentYear = new Date().getFullYear();
      setSelectedYear(String(yearOptions.includes(currentYear) ? currentYear : yearOptions[0]));
    }
  }, [selectedYear, yearOptions]);

  const classTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    classAssignments.forEach((assignment) => {
      if (!map.has(assignment.class_id)) {
        map.set(assignment.class_id, assignment.user_id);
      }
    });
    return map;
  }, [classAssignments]);

  const hasSelectedSchool = visibleSchools.length === 1 || Boolean(selectedSchool);

  const filteredClasses = useMemo(() => {
    if (!hasSelectedSchool) return [];

    const needle = search.trim().toLowerCase();
    return visibleClasses
      .filter((item) => !selectedSchool || item.kod_sekolah === selectedSchool)
      .filter((item) => !selectedYear || item.tahun_akademik === Number(selectedYear))
      .filter((item) => item.status === 'AKTIF')
      .filter((item) => {
        if (!needle) return true;
        const school = schoolMap.get(item.kod_sekolah);
        return [item.nama_kelas, item.kod_sekolah, school?.nama_sekolah, String(item.tahun), String(item.tahun_akademik)]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(needle));
      })
      .sort((a, b) => a.tahun - b.tahun || a.nama_kelas.localeCompare(b.nama_kelas));
  }, [hasSelectedSchool, schoolMap, search, selectedSchool, selectedYear, visibleClasses]);

  return (
    <section className="panel teacher-assignment-panel">
      <div className="panel-head">
        <div>
          <h2>Pengurusan Guru Kelas & Guru Subjek</h2>
          <p className="panel-copy">Tetapkan guru kelas di sini. Guru mata pelajaran dibuka dalam paparan khusus mengikut kelas.</p>
        </div>
        <span>{hasSelectedSchool ? `${filteredClasses.length} kelas` : 'Pilih sekolah'}</span>
      </div>

      <form
        className="teacher-assignment-toolbar"
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(searchDraft.trim());
        }}
      >
        {visibleSchools.length > 1 && (
          <label>
            Sekolah
            <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)}>
              <option value="">Pilih sekolah</option>
              {visibleSchools.map((school) => (
                <option key={school.kod_sekolah} value={school.kod_sekolah}>
                  {school.kod_sekolah} - {school.nama_sekolah}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          Sesi
          <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>

        <label>
          Carian
          <input
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Cari kelas, sekolah atau tahun"
          />
        </label>

        <button className="button" type="submit">
          Cari
        </button>
      </form>

      {!hasSelectedSchool ? (
        <p className="empty">Pilih sekolah dahulu untuk memaparkan senarai kelas.</p>
      ) : (
        <form action={classAction}>
          <div className="table-scroll">
            <table className="teacher-assignment-table">
              <thead>
                <tr>
                  <th>Bil</th>
                  <th>Sesi</th>
                  <th>Kelas</th>
                  <th>Guru Kelas</th>
                  <th>Guru Mata Pelajaran</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Tiada kelas ditemui.</td>
                  </tr>
                ) : (
                  filteredClasses.map((item, index) => {
                    const teacherOptions = teacherOptionsForSchool(visibleUsers, item.kod_sekolah);
                    const assignedTeacher = classTeacherMap.get(item.id) ?? '';
                    return (
                      <tr key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.tahun_akademik}</td>
                        <td>
                          <strong>{classLabel(item)}</strong>
                          {visibleSchools.length > 1 && <small>{schoolLabel(schoolMap.get(item.kod_sekolah))}</small>}
                        </td>
                        <td>
                          <input name="class_id" type="hidden" value={item.id} />
                          <select name="teacher_id" defaultValue={assignedTeacher}>
                            <option value="">Kekalkan / belum ditetapkan</option>
                            {assignedTeacher && <option value="__CLEAR__">Kosongkan guru kelas</option>}
                            {teacherOptions.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.nama}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <Link className="soft-action-button" href={`/guru-subjek/${item.id}`}>
                            Lihat / Kemaskini
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="form-actions teacher-assignment-actions">
            <button className="button" type="submit" disabled={classPending || filteredClasses.length === 0}>
              {classPending ? 'Menyimpan...' : `Kemaskini Guru Kelas ${selectedYear}`}
            </button>
            {classState.message && <p className={classState.ok ? 'form-success' : 'form-message'}>{classState.message}</p>}
          </div>
        </form>
      )}
    </section>
  );
}
