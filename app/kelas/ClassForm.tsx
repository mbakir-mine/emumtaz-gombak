'use client';

import { useActionState } from 'react';
import { createClass } from './actions';
import type { School } from '@/lib/data';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeSchools } from '../ui/scopedData';

const initialState = {
  ok: false,
  message: '',
};

export default function ClassForm({ schools }: { schools: School[] }) {
  const profile = useAccessProfile();
  const [state, action, pending] = useActionState(createClass, initialState);
  const scopedSchools = scopeSchools(profile, schools);
  const hideSchoolSelect = profile?.role === 'ADMIN_SEKOLAH' && Boolean(profile.kod_sekolah);

  return (
    <form action={action} className="form-grid class-form-grid">
      {hideSchoolSelect ? (
        <input type="hidden" name="kod_sekolah" value={profile?.kod_sekolah ?? ''} />
      ) : (
        <label>
          <span>Sekolah</span>
          <select name="kod_sekolah" required>
            <option value="">Pilih sekolah</option>
            {scopedSchools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))}
          </select>
        </label>
      )}

      <label>
        <span>Tahun Akademik</span>
        <input name="tahun_akademik" type="number" min="2020" max="2100" defaultValue="2026" required />
      </label>

      <label>
        <span>Tahun Murid</span>
        <select name="tahun" required>
          <option value="">Pilih tahun</option>
          {[1, 2, 3, 4, 5, 6].map((tahun) => (
            <option key={tahun} value={tahun}>
              Tahun {tahun}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span>Nama Kelas</span>
        <input name="nama_kelas" placeholder="Contoh: 5 AMANAH" required />
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? 'Menyimpan...' : 'Simpan Kelas'}
        </button>
        {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
      </div>
    </form>
  );
}
