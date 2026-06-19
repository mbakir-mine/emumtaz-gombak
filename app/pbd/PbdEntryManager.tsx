'use client';

import { useActionState, useEffect, useMemo, useState } from 'react';
import type {
  ClassRecord,
  PbdMarkDetailRecord,
  School,
  SchoolModuleAccess,
  StudentRecord,
  SubjectRecord,
  TeacherSubjectAssignment,
  TeacherSubjectComponentAssignment,
} from '@/lib/data';
import { allowedSubjectForTahun } from '@/lib/subjects';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeClasses, scopeSchools, scopeStudents } from '../ui/scopedData';
import { savePbdMarks, type PbdActionState } from './actions';

const initialState: PbdActionState = { ok: false, message: '' };

const instrumenOptions = [
  'Pemerhatian',
  'Soal Jawab',
  'Tugasan',
  'Kuiz',
  'Latihan',
  'Amali',
  'Projek',
  'Pembentangan',
  'Ujian Bertulis',
  'Portfolio',
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function sortByClass(a: ClassRecord, b: ClassRecord) {
  return (
    a.kod_sekolah.localeCompare(b.kod_sekolah) ||
    a.tahun - b.tahun ||
    a.nama_kelas.localeCompare(b.nama_kelas, 'ms', { sensitivity: 'base' })
  );
}

export default function PbdEntryManager({
  schools,
  classes,
  students,
  subjects,
  subjectAssignments,
  componentAssignments,
  pbdMarks,
  moduleAccesses,
}: {
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  subjects: SubjectRecord[];
  subjectAssignments: TeacherSubjectAssignment[];
  componentAssignments: TeacherSubjectComponentAssignment[];
  pbdMarks: PbdMarkDetailRecord[];
  moduleAccesses: SchoolModuleAccess[];
}) {
  const profile = useAccessProfile();
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear, currentYear + 1].filter((year, index, list) => list.indexOf(year) === index);
  const scopedSchools = useMemo(() => scopeSchools(profile, schools), [profile, schools]);
  const scopedClasses = useMemo(() => scopeClasses(profile, classes, schools), [classes, profile, schools]);
  const scopedStudents = useMemo(() => scopeStudents(profile, students, classes, schools), [classes, profile, schools, students]);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tarikh, setTarikh] = useState(todayIso());
  const [tajuk, setTajuk] = useState('Penilaian PBD');
  const [instrumen, setInstrumen] = useState('Pemerhatian');
  const [markahPenuh, setMarkahPenuh] = useState(100);
  const [state, action, pending] = useActionState(savePbdMarks, initialState);

  const myTeachingKeys = useMemo(() => {
    const keys = new Set<string>();
    if (!profile?.id) return keys;

    subjectAssignments
      .filter((assignment) => assignment.user_id === profile.id)
      .forEach((assignment) => keys.add(`${assignment.class_id}|${assignment.kod_subjek}`));

    componentAssignments
      .filter((assignment) => assignment.user_id === profile.id)
      .forEach((assignment) => keys.add(`${assignment.class_id}|${assignment.kod_subjek}`));

    return keys;
  }, [componentAssignments, profile?.id, subjectAssignments]);

  const canManageSchoolPbd = profile?.role === 'OWNER' || profile?.role === 'ADMIN_SEKOLAH';
  const forceOwnAssignments = Boolean(profile && !canManageSchoolPbd);

  useEffect(() => {
    if (!selectedSchool && scopedSchools.length === 1) {
      setSelectedSchool(scopedSchools[0].kod_sekolah);
    }
  }, [scopedSchools, selectedSchool]);

  const moduleEnabled = useMemo(() => {
    if (!profile || !selectedSchool) return false;
    if (profile.role === 'OWNER') return true;
    return moduleAccesses.some(
      (access) => access.kod_sekolah === selectedSchool && access.module_key === 'PELAPORAN_PBD' && access.enabled,
    );
  }, [moduleAccesses, profile, selectedSchool]);

  const filteredClasses = useMemo(() => {
    const items = scopedClasses
      .filter(
        (item) =>
          selectedSchool &&
          item.kod_sekolah === selectedSchool &&
          item.tahun_akademik === selectedYear &&
          item.status === 'AKTIF',
      )
      .sort(sortByClass);

    if (!forceOwnAssignments) return items;
    return items.filter((item) => [...myTeachingKeys].some((key) => key.startsWith(`${item.id}|`)));
  }, [forceOwnAssignments, myTeachingKeys, scopedClasses, selectedSchool, selectedYear]);

  const selectedClass = filteredClasses.find((item) => item.id === selectedClassId);

  const filteredSubjects = useMemo(() => {
    const allowedSubjects = subjects
      .filter((subject) => subject.status === 'AKTIF' && selectedClass && allowedSubjectForTahun(subject, selectedClass.tahun))
      .sort((a, b) => a.susunan - b.susunan || a.nama_subjek.localeCompare(b.nama_subjek, 'ms', { sensitivity: 'base' }));

    if (!selectedClass || !forceOwnAssignments) return allowedSubjects;
    return allowedSubjects.filter((subject) => myTeachingKeys.has(`${selectedClass.id}|${subject.kod_subjek}`));
  }, [forceOwnAssignments, myTeachingKeys, selectedClass, subjects]);

  const classStudents = useMemo(
    () =>
      scopedStudents
        .filter((student) => student.class_id === selectedClassId && student.status === 'AKTIF')
        .sort((a, b) => a.nama_murid.localeCompare(b.nama_murid, 'ms', { sensitivity: 'base' })),
    [scopedStudents, selectedClassId],
  );

  const assignedTeacherId = useMemo(() => {
    if (!selectedClassId || !selectedSubject) return profile?.id ?? '';
    const subjectTeacher = subjectAssignments.find(
      (assignment) => assignment.class_id === selectedClassId && assignment.kod_subjek === selectedSubject,
    );
    const componentTeacher = componentAssignments.find(
      (assignment) => assignment.class_id === selectedClassId && assignment.kod_subjek === selectedSubject,
    );
    return subjectTeacher?.user_id ?? componentTeacher?.user_id ?? profile?.id ?? '';
  }, [componentAssignments, profile?.id, selectedClassId, selectedSubject, subjectAssignments]);

  const existingMarks = useMemo(() => {
    const map = new Map<string, PbdMarkDetailRecord>();
    pbdMarks.forEach((mark) => {
      const assessment = mark.pbd_assessments;
      if (
        assessment?.class_id === selectedClassId &&
        assessment.kod_subjek === selectedSubject &&
        assessment.tarikh === tarikh &&
        assessment.tajuk === tajuk &&
        assessment.instrumen === instrumen
      ) {
        map.set(mark.student_id, mark);
      }
    });
    return map;
  }, [instrumen, pbdMarks, selectedClassId, selectedSubject, tajuk, tarikh]);

  useEffect(() => {
    if (selectedClassId && !filteredClasses.some((item) => item.id === selectedClassId)) {
      setSelectedClassId('');
      setSelectedSubject('');
    }
  }, [filteredClasses, selectedClassId]);

  useEffect(() => {
    if (selectedSubject && !filteredSubjects.some((subject) => subject.kod_subjek === selectedSubject)) {
      setSelectedSubject('');
    }
  }, [filteredSubjects, selectedSubject]);

  return (
    <section className="panel pbd-entry-panel">
      <div className="panel-head">
        <div>
          <h2>Kemasukan PBD</h2>
          <p>Pentaksiran berterusan diisi oleh guru subjek mengikut kelas, subjek dan instrumen.</p>
        </div>
        <span>{classStudents.length} murid</span>
      </div>

      <div className="module-toolbar">
        <label>
          Sekolah
          <select
            value={selectedSchool}
            onChange={(event) => {
              setSelectedSchool(event.target.value);
              setSelectedClassId('');
              setSelectedSubject('');
            }}
          >
            <option value="">Pilih sekolah</option>
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
        <label>
          Tahun Akademik
          <select
            value={selectedYear}
            onChange={(event) => {
              setSelectedYear(Number(event.target.value));
              setSelectedClassId('');
              setSelectedSubject('');
            }}
          >
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </label>
        <label>
          Kelas
          <select
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(event.target.value);
              setSelectedSubject('');
            }}
            disabled={!selectedSchool}
          >
            <option value="">{selectedSchool ? 'Pilih kelas' : 'Pilih sekolah dahulu'}</option>
            {filteredClasses.map((item) => (
              <option key={item.id} value={item.id}>
                Tahun {item.tahun} - {item.nama_kelas}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedSchool ? (
        <p className="empty">Pilih sekolah untuk mula mengisi PBD.</p>
      ) : !moduleEnabled ? (
        <p className="empty">
          Sekolah ini belum diberi akses modul PBD. Pentadbir Utama perlu menanda modul PBD di Tetapan &gt; Akses Modul
          Sekolah.
        </p>
      ) : (
        <form action={action} className="pbd-entry-form">
          <input type="hidden" name="kod_sekolah" value={selectedSchool} />
          <input type="hidden" name="tahun_akademik" value={selectedYear} />
          <input type="hidden" name="class_id" value={selectedClassId} />
          <input type="hidden" name="kod_subjek" value={selectedSubject} />
          <input type="hidden" name="teacher_id" value={assignedTeacherId} />

          <div className="module-toolbar">
            <label>
              Subjek
              <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)} disabled={!selectedClassId}>
                <option value="">{selectedClassId ? 'Pilih subjek' : 'Pilih kelas dahulu'}</option>
                {filteredSubjects.map((subject) => (
                  <option key={subject.kod_subjek} value={subject.kod_subjek}>
                    {subject.kod_subjek} - {subject.nama_subjek}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Tarikh
              <input name="tarikh" type="date" value={tarikh} onChange={(event) => setTarikh(event.target.value)} />
            </label>
            <label>
              Instrumen
              <select name="instrumen" value={instrumen} onChange={(event) => setInstrumen(event.target.value)}>
                {instrumenOptions.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="module-toolbar">
            <label>
              Tajuk / Kemahiran
              <input name="tajuk" value={tajuk} onChange={(event) => setTajuk(event.target.value)} />
            </label>
            <label>
              Markah Penuh
              <input
                name="markah_penuh"
                type="number"
                min="1"
                step="0.01"
                value={markahPenuh}
                onChange={(event) => setMarkahPenuh(Number(event.target.value))}
              />
            </label>
          </div>

          {!selectedClassId || !selectedSubject ? (
            <p className="empty">Pilih kelas dan subjek untuk memaparkan senarai murid.</p>
          ) : classStudents.length === 0 ? (
            <p className="empty">Tiada murid aktif dalam kelas ini.</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table compact-table">
                <thead>
                  <tr>
                    <th>BIL</th>
                    <th>NAMA MURID</th>
                    <th>MARKAH</th>
                    <th>TP</th>
                    <th>CATATAN</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map((student, index) => {
                    const saved = existingMarks.get(student.id);
                    return (
                      <tr key={student.id}>
                        <td>{index + 1}</td>
                        <td>
                          <input type="hidden" name="student_id" value={student.id} />
                          <strong>{student.nama_murid}</strong>
                        </td>
                        <td>
                          <input
                            name={`markah_${student.id}`}
                            type="number"
                            min="0"
                            max={markahPenuh}
                            step="0.01"
                            defaultValue={saved?.markah ?? ''}
                            placeholder="-"
                          />
                        </td>
                        <td>
                          <select name={`tp_${student.id}`} defaultValue={saved?.tahap_penguasaan ?? ''}>
                            <option value="">-</option>
                            {[1, 2, 3, 4, 5, 6].map((tp) => (
                              <option key={tp} value={tp}>
                                TP {tp}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input name={`catatan_${student.id}`} defaultValue={saved?.catatan ?? ''} placeholder="Catatan ringkas" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="form-actions">
            <button className="button" type="submit" disabled={pending || !selectedClassId || !selectedSubject || classStudents.length === 0}>
              {pending ? 'Menyimpan...' : 'Simpan PBD'}
            </button>
            {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
          </div>
        </form>
      )}
    </section>
  );
}
