'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeUsers } from '../ui/scopedData';
import { bulkAssignTeacherSubjects } from './actions';
import { allowedSubjectForTahun, classLabel, displaySubjectCode, schoolLabel, teacherOptionsForSchool } from './helpers';
import type {
  ClassRecord,
  School,
  SubjectRecord,
  SubjectComponentRecord,
  TeacherClassAssignment,
  TeacherSubjectComponentAssignment,
  TeacherSubjectAssignment,
  TimetableRequirement,
  UserRecord,
} from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

type SubjectSplitRow = {
  key: string;
  label: string;
  teacherId: string;
  slotCount: string;
};

function displaySplitLabel(subjectName: string, label: string, index: number) {
  if (label) return label;
  return index === 0 ? subjectName : `${subjectName} ${index + 1}`;
}

function nextSplitLabel(subjectName: string, rows: SubjectSplitRow[]) {
  let nextIndex = rows.length + 1;
  let label = nextIndex === 2 ? 'Guru Kedua' : `${subjectName} ${nextIndex}`;
  const existing = new Set(rows.map((row) => row.label));

  while (existing.has(label)) {
    nextIndex += 1;
    label = `${subjectName} ${nextIndex}`;
  }

  return label;
}

function firstSplitLabel() {
  return 'Guru Utama';
}

function canSplitSubject(subject: SubjectRecord, selectedClass: ClassRecord) {
  return selectedClass.tahun === 1 && subject.kod_subjek === 'JAWI';
}

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
  timetableRequirements,
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
  timetableRequirements: TimetableRequirement[];
}) {
  const profile = useAccessProfile();
  const [subjectRows, setSubjectRows] = useState<Record<string, SubjectSplitRow[]>>({});
  const [componentSelections, setComponentSelections] = useState<Record<string, string>>({});
  const [componentSlots, setComponentSlots] = useState<Record<string, string>>({});
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

  const subjectAssignmentMap = useMemo(() => {
    const map = new Map<string, TeacherSubjectAssignment[]>();
    subjectAssignments.forEach((assignment) => {
      if (assignment.class_id !== classId) return;
      const list = map.get(assignment.kod_subjek) ?? [];
      list.push(assignment);
      map.set(assignment.kod_subjek, list);
    });
    return map;
  }, [classId, subjectAssignments]);

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

  const timetableRequirementMap = useMemo(() => {
    const map = new Map<string, TimetableRequirement>();
    timetableRequirements.forEach((requirement) => {
      if (requirement.class_id === classId) {
        map.set(`${requirement.kod_subjek}|${requirement.kod_komponen ?? ''}|${requirement.assignment_label ?? ''}`, requirement);
      }
    });
    return map;
  }, [classId, timetableRequirements]);

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
      setSubjectRows({});
      setComponentSelections({});
      setComponentSlots({});
      setApplyAllTeacher('');
      return;
    }

    const nextSubjectRows: Record<string, SubjectSplitRow[]> = {};
    const nextComponentSelections: Record<string, string> = {};
    const nextComponentSlots: Record<string, string> = {};

    filteredSubjects.forEach((subject) => {
      const components = componentsBySubject.get(subject.kod_subjek) ?? [];
      if (components.length === 0) {
        const assignments = subjectAssignmentMap.get(subject.kod_subjek) ?? [];
        const baseRows = assignments.length > 0 ? assignments : [{ assignment_label: '', user_id: '' }];

        nextSubjectRows[subject.kod_subjek] = baseRows.map((assignment, index) => {
          const label = String(assignment.assignment_label ?? '').trim();
          const requirement = timetableRequirementMap.get(`${subject.kod_subjek}||${label}`);
          return {
            key: `${subject.kod_subjek}-${label || 'utama'}-${index}`,
            label,
            teacherId: assignment.user_id ?? '',
            slotCount: requirement?.bil_slot_seminggu?.toString() ?? '',
          };
        });
      }

      components.forEach((component) => {
        const componentKey = `${subject.kod_subjek}|${component.kod_komponen}`;
        nextComponentSelections[componentKey] =
          componentTeacherMap.get(`${selectedClass.id}|${subject.kod_subjek}|${component.kod_komponen}`) ?? '';
        nextComponentSlots[componentKey] =
          timetableRequirementMap.get(`${subject.kod_subjek}|${component.kod_komponen}|`)?.bil_slot_seminggu?.toString() ?? '';
      });
    });

    setSubjectRows(nextSubjectRows);
    setComponentSelections(nextComponentSelections);
    setComponentSlots(nextComponentSlots);
    setApplyAllTeacher('');
  }, [
    componentTeacherMap,
    componentsBySubject,
    filteredSubjects,
    selectedClass,
    subjectAssignmentMap,
    timetableRequirementMap,
  ]);

  function applyTeacherToAllSubjects() {
    if (!applyAllTeacher) return;
    setSubjectRows((current) => {
      const next = { ...current };
      filteredSubjects.forEach((subject) => {
        if ((componentsBySubject.get(subject.kod_subjek) ?? []).length === 0) {
          const rows = next[subject.kod_subjek] ?? [];
          next[subject.kod_subjek] =
            rows.length > 0
              ? rows.map((row, index) => (index === 0 ? { ...row, teacherId: applyAllTeacher } : row))
              : [{ key: `${subject.kod_subjek}-utama`, label: '', teacherId: applyAllTeacher, slotCount: '' }];
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

  function updateSubjectRow(kodSubjek: string, rowKey: string, patch: Partial<SubjectSplitRow>) {
    setSubjectRows((current) => ({
      ...current,
      [kodSubjek]: (current[kodSubjek] ?? []).map((row) => (row.key === rowKey ? { ...row, ...patch } : row)),
    }));
  }

  function addSubjectRow(subject: SubjectRecord) {
    setSubjectRows((current) => {
      const rows = current[subject.kod_subjek] ?? [];
      const label = nextSplitLabel(subject.nama_subjek, rows);
      return {
        ...current,
        [subject.kod_subjek]: [
          ...rows.map((row, index) => (index === 0 && !row.label ? { ...row, label: firstSplitLabel() } : row)),
          {
            key: `${subject.kod_subjek}-${Date.now()}`,
            label,
            teacherId: '',
            slotCount: '',
          },
        ],
      };
    });
  }

  function removeSubjectRow(kodSubjek: string, rowKey: string) {
    setSubjectRows((current) => {
      const rows = current[kodSubjek] ?? [];
      const nextRows = rows.filter((row) => row.key !== rowKey);
      return {
        ...current,
        [kodSubjek]: nextRows.length > 0 ? nextRows : [{ key: `${kodSubjek}-utama`, label: '', teacherId: '', slotCount: '' }],
      };
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
          <input name="subject_kod_sekolah" type="hidden" value={selectedClass.kod_sekolah} />
          <input name="subject_tahun" type="hidden" value={selectedClass.tahun} />
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
                  <th className="slot-column">Bil. Masa</th>
                  <th>Guru Subjek</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubjects.map((subject, index) => {
                  const components = componentsBySubject.get(subject.kod_subjek) ?? [];
                  const allowSplit = canSplitSubject(subject, selectedClass);
                  const rows = (subjectRows[subject.kod_subjek] ?? [
                    { key: `${subject.kod_subjek}-utama`, label: '', teacherId: '', slotCount: '' },
                  ]).slice(0, allowSplit ? undefined : 1);
                  const showSplitLabels = allowSplit && rows.length > 1;

                  return (
                    <tr key={subject.kod_subjek}>
                      <td>{index + 1}</td>
                      <td>{displaySubjectCode(subject, selectedClass.tahun)}</td>
                      <td>{subject.nama_subjek}</td>
                      <td className="slot-column">
                        {components.length === 0 ? (
                          <div className="subject-slot-stack">
                            {rows.map((row, rowIndex) => (
                              <label key={row.key} className="subject-slot-label">
                                <span>{displaySplitLabel(subject.nama_subjek, row.label, rowIndex)}</span>
                                <input name="timetable_kod_subjek" type="hidden" value={subject.kod_subjek} />
                                <input name="timetable_kod_komponen" type="hidden" value="" />
                                <input name="timetable_assignment_label" type="hidden" value={row.label} />
                                <input
                                  name="timetable_nama_paparan"
                                  type="hidden"
                                  value={displaySplitLabel(subject.nama_subjek, row.label, rowIndex)}
                                />
                                <input name="timetable_teacher_id" type="hidden" value={row.teacherId} />
                                <input
                                  className="subject-slot-input"
                                  name="timetable_bil_slot"
                                  type="number"
                                  min="0"
                                  max="40"
                                  value={row.slotCount}
                                  onChange={(event) => updateSubjectRow(subject.kod_subjek, row.key, { slotCount: event.target.value })}
                                  placeholder="0"
                                />
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="subject-slot-stack">
                            {components.map((component) => {
                              const componentKey = `${subject.kod_subjek}|${component.kod_komponen}`;
                              return (
                                <label key={componentKey} className="subject-slot-label">
                                  <span>{component.nama_komponen}</span>
                                  <input name="timetable_kod_subjek" type="hidden" value={subject.kod_subjek} />
                                  <input name="timetable_kod_komponen" type="hidden" value={component.kod_komponen} />
                                  <input name="timetable_assignment_label" type="hidden" value="" />
                                  <input name="timetable_nama_paparan" type="hidden" value={component.nama_komponen} />
                                  <input name="timetable_teacher_id" type="hidden" value={componentSelections[componentKey] ?? ''} />
                                  <input
                                    className="subject-slot-input"
                                    name="timetable_bil_slot"
                                    type="number"
                                    min="0"
                                    max="40"
                                    value={componentSlots[componentKey] ?? ''}
                                    onChange={(event) =>
                                      setComponentSlots((current) => ({
                                        ...current,
                                        [componentKey]: event.target.value,
                                      }))
                                    }
                                    placeholder="0"
                                  />
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="subject-teacher-stack">
                          {components.length === 0 && (
                            <div className="subject-split-teachers">
                              {rows.map((row, rowIndex) => (
                                <div
                                  key={row.key}
                                  className={showSplitLabels ? 'subject-split-row' : 'subject-split-row subject-split-row-simple'}
                                >
                                  {showSplitLabels ? (
                                    <label>
                                      <span>Pecahan</span>
                                      <input
                                        name="subject_assignment_label"
                                        value={row.label}
                                        onChange={(event) =>
                                          updateSubjectRow(subject.kod_subjek, row.key, { label: event.target.value.trimStart() })
                                        }
                                        placeholder={rowIndex === 0 ? 'Guru Utama' : `Guru ${rowIndex + 1}`}
                                      />
                                    </label>
                                  ) : (
                                    <input name="subject_assignment_label" type="hidden" value={row.label} />
                                  )}
                                  <label>
                                    <span>Guru subjek</span>
                                    <input name="kod_subjek" type="hidden" value={subject.kod_subjek} />
                                    <select
                                      name="subject_teacher_id"
                                      value={row.teacherId}
                                      onChange={(event) =>
                                        updateSubjectRow(subject.kod_subjek, row.key, { teacherId: event.target.value })
                                      }
                                    >
                                      <option value="">Pilih guru / belum ditetapkan</option>
                                      {row.teacherId && <option value="__CLEAR__">Kosongkan guru subjek</option>}
                                      {selectedClassTeachers.map((user) => (
                                        <option key={user.id} value={user.id}>
                                          {user.nama}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                  {allowSplit && (
                                    <button
                                      className="soft-action-button subject-split-remove"
                                      type="button"
                                      onClick={() => removeSubjectRow(subject.kod_subjek, row.key)}
                                      disabled={rows.length <= 1 && !row.teacherId && !row.slotCount && !row.label}
                                    >
                                      Buang
                                    </button>
                                  )}
                                </div>
                              ))}
                              {allowSplit && (
                                <button className="soft-action-button subject-split-add" type="button" onClick={() => addSubjectRow(subject)}>
                                  Tambah Guru
                                </button>
                              )}
                            </div>
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
