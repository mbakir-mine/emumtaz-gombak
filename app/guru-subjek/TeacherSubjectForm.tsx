'use client';

import { useMemo, useState, useActionState } from 'react';
import { assignTeacherSubject } from './actions';
import type { ClassRecord, School, SubjectRecord, UserRecord } from '@/lib/data';

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

export default function TeacherSubjectForm({
  schools,
  classes,
  users,
  subjects,
}: {
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
  subjects: SubjectRecord[];
}) {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [state, action, pending] = useActionState(assignTeacherSubject, initialState);

  const filteredClasses = useMemo(
    () => classes.filter((item) => !selectedSchool || item.kod_sekolah === selectedSchool),
    [classes, selectedSchool],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          ['GURU_SUBJEK', 'GURU_KELAS'].includes(item.role) &&
          (!selectedSchool || item.kod_sekolah === selectedSchool),
      ),
    [users, selectedSchool],
  );
  const selectedClass = useMemo(
    () => classes.find((item) => item.id === selectedClassId),
    [classes, selectedClassId],
  );
  const filteredSubjects = useMemo(
    () => subjects.filter((subject) => (selectedClass ? allowedSubjectForTahun(subject, selectedClass.tahun) : true)),
    [subjects, selectedClass],
  );

  return (
    <form action={action} className="form-grid">
      <label>
        Sekolah
        <select
          value={selectedSchool}
          onChange={(event) => {
            setSelectedSchool(event.target.value);
            setSelectedClassId('');
          }}
          required
        >
          <option value="">Pilih sekolah</option>
          {schools.map((school) => (
            <option key={school.kod_sekolah} value={school.kod_sekolah}>
              {school.kod_sekolah} - {school.nama_sekolah}
            </option>
          ))}
        </select>
      </label>

      <label>
        Guru
        <select name="user_id" required disabled={!selectedSchool}>
          <option value="">Pilih guru subjek</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.nama} ({user.role})
            </option>
          ))}
        </select>
      </label>

      <label>
        Kelas
        <select
          name="class_id"
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
          required
          disabled={!selectedSchool}
        >
          <option value="">Pilih kelas</option>
          {filteredClasses.map((item) => (
            <option key={item.id} value={item.id}>
              Tahun {item.tahun} - {item.nama_kelas} ({item.tahun_akademik})
            </option>
          ))}
        </select>
      </label>

      <label>
        Subjek / Kertas
        <select name="kod_subjek" required disabled={!selectedClassId}>
          <option value="">Pilih subjek</option>
          {filteredSubjects.map((subject) => (
            <option key={subject.kod_subjek} value={subject.kod_subjek}>
              {subject.kod_subjek} - {subject.nama_subjek}
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={pending || !selectedClassId}>
          {pending ? 'Menyimpan...' : 'Tetapkan Guru Subjek'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}

