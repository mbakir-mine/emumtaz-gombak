'use client';

import { useActionState } from 'react';
import { createTeacher } from './actions';
import type { School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';

const initialState = {
  ok: false,
  message: '',
};

export default function TeacherForm({ schools }: { schools: School[] }) {
  const profile = useAccessProfile();
  const [state, action, pending] = useActionState(createTeacher, initialState);
  const scopedSchools = scopeSchools(profile, schools);

  return (
    <form action={action} className="form-grid">
      <label>
        Sekolah
        <select name="kod_sekolah" required>
          <option value="">Pilih sekolah</option>
          {scopedSchools.map((school) => (
            <option key={school.kod_sekolah} value={school.kod_sekolah}>
              {school.kod_sekolah} - {school.nama_sekolah}
            </option>
          ))}
        </select>
      </label>

      <label>
        Role
        <select name="role" required>
          <option value="">Pilih role</option>
          <option value="GURU_KELAS">Guru Kelas</option>
          <option value="GURU_SUBJEK">Guru Subjek</option>
          <option value="ADMIN_SEKOLAH">Admin Sekolah</option>
        </select>
      </label>

      <label>
        Nama Guru
        <input name="nama" placeholder="Nama penuh guru" required />
      </label>

      <label>
        Email
        <input name="email" type="email" placeholder="guru@email.com" required />
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Guru'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
