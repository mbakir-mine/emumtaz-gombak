'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeUsers } from '../ui/scopedData';
import { bulkAssignTeacherClasses, bulkAssignTeacherSubjects } from './actions';
import type {
  ClassRecord,
  School,
  SubjectRecord,
  TeacherClassAssignment,
  TeacherSubjectAssignment,
  UserRecord,
} from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

function allowedSubjectForTahun(subject: SubjectRecord, tahun: number) {
  if ([1, 2].includes(tahun)) {
    return ['AKHLAK', 'BAHASA_ARAB', 'JAWI', 'TAUHID', 'FEKAH', 'TILAWAH', 'HAFAZAN'].includes(
      subject.kod_subjek,
    );
  }

  if (tahun === 3) {
    return [
      'AKHLAK',
      'SIRAH',
      'BAHASA_ARAB',
      'JAWI',
      'IMLAK_KHAT',
      'TAUHID',
      'FEKAH',
      'TAJWID',
      'TILAWAH',
      'HAFAZAN',
    ].includes(subject.kod_subjek);
  }

  return ['AS01', 'BA02', 'JIK03', 'TF04', 'TJ05', 'TILAWAH', 'HAFAZAN'].includes(subject.kod_subjek);
}

function classLabel(item: ClassRecord) {
  return `Tahun ${item.tahun} - ${item.nama_kelas}`;
}

function schoolLabel(school?: School) {
  if (!school) return 'Sekolah';
  return `${school.kod_sekolah} - ${school.nama_sekolah}`;
}

function teacherOptionsForSchool(users: UserRecord[], kodSekolah: string) {
  return users.filter(
    (user) =>
      user.kod_sekolah === kodSekolah &&
      user.status === 'AKTIF' &&
      ['GURU_KELAS', 'GURU_SUBJEK'].includes(user.role),
  );
}

export default function TeacherSubjectForm({
  schools,
  classes,
  users,
  subjects,
  classAssignments,
  subjectAssignments,
}: {
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
  subjects: SubjectRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
}) {
  const profile = useAccessProfile();
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [searchDraft, setSearchDraft] = useState('');
  const [search, setSearch] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [subjectSelections, setSubjectSelections] = useState<Record<string, string>>({});
  const [applyAllTeacher, setApplyAllTeacher] = useState('');
  const [classState, classAction, classPending] = useActionState(bulkAssignTeacherClasses, initialState);
  const [subjectState, subjectAction, subjectPending] = useActionState(bulkAssignTeacherSubjects, initialState);

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

  const subjectTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    subjectAssignments.forEach((assignment) => {
      const key = `${assignment.class_id}|${assignment.kod_subjek}`;
      if (!map.has(key)) {
        map.set(key, assignment.user_id);
      }
    });
    return map;
  }, [subjectAssignments]);

  const filteredClasses = useMemo(() => {
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
  }, [schoolMap, search, selectedSchool, selectedYear, visibleClasses]);

  useEffect(() => {
    if (selectedClassId && !filteredClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId('');
    }
  }, [filteredClasses, selectedClassId]);

  const selectedClass = useMemo(
    () => filteredClasses.find((item) => item.id === selectedClassId) ?? null,
    [filteredClasses, selectedClassId],
  );

  const selectedClassTeacher = selectedClass ? visibleUsers.find((user) => user.id === classTeacherMap.get(selectedClass.id)) : null;
  const selectedSchoolRecord = selectedClass ? schoolMap.get(selectedClass.kod_sekolah) : null;
  const selectedClassTeachers = selectedClass ? teacherOptionsForSchool(visibleUsers, selectedClass.kod_sekolah) : [];
  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => subject.status === 'AKTIF' && (selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : true)),
    [selectedClass, subjects],
  );

  useEffect(() => {
    if (!selectedClass) {
      setSubjectSelections({});
      setApplyAllTeacher('');
      return;
    }

    const nextSelections: Record<string, string> = {};
    filteredSubjects.forEach((subject) => {
      nextSelections[subject.kod_subjek] = subjectTeacherMap.get(`${selectedClass.id}|${subject.kod_subjek}`) ?? '';
    });
    setSubjectSelections(nextSelections);
    setApplyAllTeacher('');
  }, [filteredSubjects, selectedClass, subjectTeacherMap]);

  function applyTeacherToAllSubjects() {
    if (!applyAllTeacher) return;
    setSubjectSelections((current) => {
      const next = { ...current };
      filteredSubjects.forEach((subject) => {
        next[subject.kod_subjek] = applyAllTeacher;
      });
      return next;
    });
  }

  return (
    <div className="teacher-assignment-manager">
      <section className="panel teacher-assignment-panel">
        <div className="panel-head">
          <div>
            <h2>Pengurusan Guru Kelas & Guru Subjek</h2>
            <p className="panel-copy">Tetapkan guru kelas dan kemaskini guru mata pelajaran dalam paparan yang sama.</p>
          </div>
          <span>{filteredClasses.length} kelas</span>
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
              <select
                value={selectedSchool}
                onChange={(event) => {
                  setSelectedSchool(event.target.value);
                  setSelectedClassId('');
                }}
              >
                <option value="">Semua sekolah</option>
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
                      <tr className={selectedClassId === item.id ? 'selected-row' : ''} key={item.id}>
                        <td>{index + 1}</td>
                        <td>{item.tahun_akademik}</td>
                        <td>
                          <strong>{classLabel(item)}</strong>
                          {visibleSchools.length > 1 && <small>{schoolLabel(schoolMap.get(item.kod_sekolah))}</small>}
                        </td>
                        <td>
                          <input name="class_id" type="hidden" value={item.id} />
                          <select name="teacher_id" defaultValue={assignedTeacher}>
                            <option value="">Belum ditetapkan</option>
                            {teacherOptions.map((user) => (
                              <option key={user.id} value={user.id}>
                                {user.nama}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button className="soft-action-button" type="button" onClick={() => setSelectedClassId(item.id)}>
                            Lihat / Kemaskini
                          </button>
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
      </section>

      <section className="panel teacher-subject-panel">
        <div className="panel-head">
          <div>
            <h2>{selectedClass ? `Guru Mata Pelajaran ${classLabel(selectedClass)} ${selectedClass.tahun_akademik}` : 'Guru Mata Pelajaran'}</h2>
            {selectedClass ? (
              <p className="panel-copy">
                {schoolLabel(selectedSchoolRecord ?? undefined)}
                {selectedClassTeacher ? ` | Guru kelas: ${selectedClassTeacher.nama}` : ' | Guru kelas belum ditetapkan'}
              </p>
            ) : (
              <p className="panel-copy">Klik Lihat / Kemaskini pada kelas untuk membuka senarai subjek.</p>
            )}
          </div>
          <span>{selectedClass ? `${filteredSubjects.length} subjek` : 'Pilih kelas'}</span>
        </div>

        {selectedClass ? (
          <form action={subjectAction}>
            <input name="subject_class_id" type="hidden" value={selectedClass.id} />
            <div className="subject-bulk-toolbar">
              <label>
                Tetapkan semua subjek kepada
                <select value={applyAllTeacher} onChange={(event) => setApplyAllTeacher(event.target.value)}>
                  <option value="">Pilih guru</option>
                  {selectedClassTeachers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nama}
                    </option>
                  ))}
                </select>
              </label>
              <button className="soft-action-button" type="button" onClick={applyTeacherToAllSubjects} disabled={!applyAllTeacher}>
                Guna Untuk Semua
              </button>
            </div>

            <div className="table-scroll">
              <table className="teacher-assignment-table">
                <thead>
                  <tr>
                    <th>Bil</th>
                    <th>Kod</th>
                    <th>Mata Pelajaran</th>
                    <th>Kumpulan</th>
                    <th>Guru Subjek</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubjects.map((subject, index) => (
                    <tr key={subject.kod_subjek}>
                      <td>{index + 1}</td>
                      <td>{subject.kod_subjek}</td>
                      <td>{subject.nama_subjek}</td>
                      <td>Subjek JAIS</td>
                      <td>
                        <input name="kod_subjek" type="hidden" value={subject.kod_subjek} />
                        <select
                          name="subject_teacher_id"
                          value={subjectSelections[subject.kod_subjek] ?? ''}
                          onChange={(event) =>
                            setSubjectSelections((current) => ({
                              ...current,
                              [subject.kod_subjek]: event.target.value,
                            }))
                          }
                        >
                          <option value="">Belum ditetapkan</option>
                          {selectedClassTeachers.map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.nama}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="form-actions teacher-assignment-actions">
              <button className="button" type="submit" disabled={subjectPending}>
                {subjectPending ? 'Menyimpan...' : `Kemaskini Guru Subjek ${selectedClass.tahun_akademik}`}
              </button>
              {subjectState.message && <p className={subjectState.ok ? 'form-success' : 'form-message'}>{subjectState.message}</p>}
            </div>
          </form>
        ) : (
          <p className="empty">Belum ada kelas dipilih.</p>
        )}
      </section>
    </div>
  );
}
