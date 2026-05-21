'use client';

import { useMemo, useState, useActionState } from 'react';
import { createStudent } from './actions';
import type { ClassRecord, School } from '@/lib/data';

const initialState = {
  ok: false,
  message: '',
};

export default function StudentForm({
  schools,
  classes,
}: {
  schools: School[];
  classes: ClassRecord[];
}) {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [state, action, pending] = useActionState(createStudent, initialState);

  const filteredClasses = useMemo(
    () => classes.filter((item) => !selectedSchool || item.kod_sekolah === selectedSchool),
    [classes, selectedSchool],
  );

  return (
    <form action={action} className="form-grid">
      <label>
        Sekolah
        <select
          name="kod_sekolah"
          value={selectedSchool}
          onChange={(event) => setSelectedSchool(event.target.value)}
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

      <label>
        MyKid
        <input name="mykid" placeholder="Contoh: 150101100001" required />
      </label>

      <label>
        Nama Murid
        <input name="nama_murid" placeholder="Nama penuh murid" required />
      </label>

      <label>
        Jantina
        <select name="jantina" required>
          <option value="">Pilih jantina</option>
          <option value="L">Lelaki</option>
          <option value="P">Perempuan</option>
        </select>
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Murid'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}

