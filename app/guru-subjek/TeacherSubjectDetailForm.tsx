'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeUsers } from '../ui/scopedData';
import { bulkAssignTeacherSubjects } from './actions';
import { allowedSubjectForTahun, classLabel, schoolLabel, teacherOptionsForSchool } from './helpers';
import type {
  ClassRecord,
  School,
  SubjectRecord,
  SubjectComponentRecord,
  TeacherClassAssignment,
  TeacherSubjectComponentAssignment,
  TeacherSubjectAssignment,
  UserRecord,
} from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

export default function TeacherSubjectDetailForm({
  classId,
  schools,
  classes,
  users,
  subjects,
  classAssignments,
  subjectAssignments,
  subjectComponents,
  componentAssignments,
}: {
  classId: string;
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
  subjects: SubjectRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
  subjectComponents: SubjectComponentRecord[];
  componentAssignments: TeacherSubjectComponentAssignment[];
}) {
  const profile = useAccessProfile();
  const [subjectSelections, setSubjectSelections] = useState<Record<string, string>>({});
  const [componentSelections, setComponentSelections] = useState<Record<string, string>>({});
  const [applyAllTeacher, setApplyAllTeacher] = useState('');
  const [state, action, pending] = useActionState(bulkAssignTeacherSubjects, initialState);

  const visibleClasses = useMemo(() => scopeClasses(profile, classes, schools), [profile, classes, schools]);
  const visibleUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, users, schools]);
  const schoolMap = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school])), [schools]);
  const selectedClass = useMemo(() => visibleClasses.find((item) => item.id === classId) ?? null, [classId, visibleClasses]);

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

  const componentTeacherMap = useMemo(() => {
    const map = new Map<string, string>();
    componentAssignments.forEach((assignment) => {
      const key = `${assignment.class_id}|${assignment.kod_subjek}|${assignment.kod_komponen}`;
      if (!map.has(key)) {
        map.set(key, assignment.user_id);
      }
    });
    return map;
  }, [componentAssignments]);

  const componentsBySubject = useMemo(() => {
    const map = new Map<string, SubjectComponentRecord[]>();
    subjectComponents
      .filter((component) => component.status === 'AKTIF')
      .forEach((component) => {
        const items = map.get(component.kod_subjek) ?? [];
        items.push(component);
        map.set(component.kod_subjek, items.sort((left, right) => left.susunan - right.susunan));
      });
    return map;
  }, [subjectComponents]);

  const selectedClassTeacher = selectedClass
    ? visibleUsers.find((user) => user.id === classTeacherMap.get(selectedClass.id))
    : null;
  const selectedSchoolRecord = selectedClass ? schoolMap.get(selectedClass.kod_sekolah) : null;
  const selectedClassTeachers = selectedClass ? teacherOptionsForSchool(visibleUsers, selectedClass.kod_sekolah) : [];
  const filteredSubjects = useMemo(
    () =>
      subjects.filter(
        (subject) => subject.status === 'AKTIF' && (selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : true),
      ),
    [selectedClass, subjects],
  );

  useEffect(() => {
    if (!selectedClass) {
      setSubjectSelections({});
      setComponentSelections({});
      setApplyAllTeacher('');
      return;
    }

    const nextSelections: Record<string, string> = {};
    const nextComponentSelections: Record<string, string> = {};
    filteredSubjects.forEach((subject) => {
      nextSelections[subject.kod_subjek] = subjectTeacherMap.get(`${selectedClass.id}|${subject.kod_subjek}`) ?? '';
      (componentsBySubject.get(subject.kod_subjek) ?? []).forEach((component) => {
        const key = `${subject.kod_subjek}|${component.kod_komponen}`;
        nextComponentSelections[key] =
          componentTeacherMap.get(`${selectedClass.id}|${subject.kod_subjek}|${component.kod_komponen}`) ?? '';
      });
    });
    setSubjectSelections(nextSelections);
    setComponentSelections(nextComponentSelections);
    setApplyAllTeacher('');
  }, [componentTeacherMap, componentsBySubject, filteredSubjects, selectedClass, subjectTeacherMap]);

  function applyTeacherToAllSubjects() {
    if (!applyAllTeacher) return;
    setSubjectSelections((current) => {
      const next = { ...current };
      filteredSubjects.forEach((subject) => {
        if ((componentsBySubject.get(subject.kod_subjek) ?? []).length === 0) {
          next[subject.kod_subjek] = applyAllTeacher;
        }
      });
      return next;
    });
    setComponentSelections((current) => {
      const next = { ...current };
      filteredSubjects.forEach((subject) => {
        (componentsBySubject.get(subject.kod_subjek) ?? []).forEach((component) => {
          next[`${subject.kod_subjek}|${component.kod_komponen}`] = applyAllTeacher;
        });
      });
      return next;
    });
  }

  return (
    <section className="panel teacher-subject-panel">
      <div className="panel-head">
        <div>
          <h2>
            {selectedClass
              ? `Guru Mata Pelajaran ${classLabel(selectedClass)} ${selectedClass.tahun_akademik}`
              : 'Guru Mata Pelajaran'}
          </h2>
          {selectedClass ? (
            <p className="panel-copy">
              {schoolLabel(selectedSchoolRecord ?? undefined)}
              {selectedClassTeacher ? ` | Guru kelas: ${selectedClassTeacher.nama}` : ' | Guru kelas belum ditetapkan'}
            </p>
          ) : (
            <p className="panel-copy">Kelas tidak ditemui atau bukan dalam akses pengguna semasa.</p>
          )}
        </div>
        <Link className="button secondary" href="/guru-subjek">
          Kembali
        </Link>
      </div>

      {!selectedClass ? (
        <p className="empty">Sila kembali dan pilih kelas daripada senarai.</p>
      ) : (
        <form action={action}>
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
                  <th>Guru Subjek</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject, index) => {
                  const components = componentsBySubject.get(subject.kod_subjek) ?? [];
                  return (
                    <tr key={subject.kod_subjek}>
                      <td>{index + 1}</td>
                      <td>{subject.kod_subjek}</td>
                      <td>{subject.nama_subjek}</td>
                      <td>
                        <div className="subject-teacher-stack">
                          {components.length === 0 && (
                            <label>
                              <span>Guru subjek</span>
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
                                <option value="">Kekalkan / belum ditetapkan</option>
                                {subjectSelections[subject.kod_subjek] && <option value="__CLEAR__">Kosongkan guru subjek</option>}
                                {selectedClassTeachers.map((user) => (
                                  <option key={user.id} value={user.id}>
                                    {user.nama}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}

                          {components.length > 0 && (
                            <div className="subject-component-teachers">
                              <input name="component_parent_kod_subjek" type="hidden" value={subject.kod_subjek} />
                              {components.map((component) => {
                                const componentKey = `${subject.kod_subjek}|${component.kod_komponen}`;
                                return (
                                  <label key={componentKey}>
                                    <span>
                                      {component.nama_komponen} /{component.markah_penuh}
                                    </span>
                                    <input name="component_kod_subjek" type="hidden" value={subject.kod_subjek} />
                                    <input name="component_kod_komponen" type="hidden" value={component.kod_komponen} />
                                    <select
                                      name="component_teacher_id"
                                      value={componentSelections[componentKey] ?? ''}
                                      onChange={(event) =>
                                        setComponentSelections((current) => ({
                                          ...current,
                                          [componentKey]: event.target.value,
                                        }))
                                      }
                                    >
                                      <option value="">Pilih guru / belum ditetapkan</option>
                                      {componentSelections[componentKey] && (
                                        <option value="__CLEAR__">Kosongkan guru komponen</option>
                                      )}
                                      {selectedClassTeachers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                          {user.nama}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="form-actions teacher-assignment-actions">
            <button className="button" type="submit" disabled={pending}>
              {pending ? 'Menyimpan...' : `Kemaskini Guru Subjek ${selectedClass.tahun_akademik}`}
            </button>
            {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
          </div>
        </form>
      )}
    </section>
  );
}
