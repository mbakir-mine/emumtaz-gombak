'use client';

import { useMemo, useState, useActionState } from 'react';
import { assignTeacherClass } from './actions';
import type { ClassRecord, School, UserRecord } from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

export default function TeacherClassForm({
  schools,
  classes,
  users,
}: {
  schools: School[];
  classes: ClassRecord[];
  users: UserRecord[];
}) {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [state, action, pending] = useActionState(assignTeacherClass, initialState);

  const filteredClasses = useMemo(
    () => classes.filter((item) => !selectedSchool || item.kod_sekolah === selectedSchool),
    [classes, selectedSchool],
  );
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (item) =>
          ['GURU_KELAS', 'GURU_SUBJEK'].includes(item.role) &&
          (!selectedSchool || item.kod_sekolah === selectedSchool),
      ),
    [users, selectedSchool],
  );

  return (
    <form action={action} className="form-grid">
      <label>
        Sekolah
        <select value={selectedSchool} onChange={(event) => setSelectedSchool(event.target.value)} required>
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
          <option value="">Pilih guru kelas</option>
          {filteredUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.nama} ({user.role})
            </option>
          ))}
        </select>
      </label>

      <label>
        Kelas
        <select name="class_id" required disabled={!selectedSchool}>
          <option value="">Pilih kelas</option>
          {filteredClasses.map((item) => (
            <option key={item.id} value={item.id}>
              Tahun {item.tahun} - {item.nama_kelas} ({item.tahun_akademik})
            </option>
          ))}
        </select>
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={pending || !selectedSchool}>
          {pending ? 'Menyimpan...' : 'Tetapkan Guru Kelas'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
