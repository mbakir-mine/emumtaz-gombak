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
  TeacherClassAssignment,
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
}: {
  classId: string;
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
  subjects: SubjectRecord[];
  classAssignments: TeacherClassAssignment[];
  subjectAssignments: TeacherSubjectAssignment[];
}) {
  const profile = useAccessProfile();
  const [subjectSelections, setSubjectSelections] = useState<Record<string, string>>({});
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
