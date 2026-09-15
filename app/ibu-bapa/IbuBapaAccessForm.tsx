'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import type { School } from '@/lib/data';
import { loginParent, type ParentLoginState } from './actions';

const initialState: ParentLoginState = { ok: false, message: '' };

export default function IbuBapaAccessForm({ schools }: { schools: School[] }) {
  const [mykid, setMykid] = useState('');
  const [kodSekolah, setKodSekolah] = useState(schools[0]?.kod_sekolah ?? '');
  const [state, formAction, pending] = useActionState(loginParent, initialState);

  return (
    <form action={formAction} className="login-form">
      <label>
        MyKid Murid
        <input
          inputMode="numeric"
          placeholder="Contoh: 150101100001"
          value={mykid}
          onChange={(event) => setMykid(event.target.value)}
          name="mykid"
          required
          disabled={schools.length === 0}
        />
      </label>

      <label>
        Sekolah
        <select name="kod_sekolah" value={kodSekolah} onChange={(event) => setKodSekolah(event.target.value)} required disabled={schools.length === 0}>
          {schools.length === 0 ? (
            <option value="">Tiada sekolah aktif</option>
          ) : (
            schools.map((school) => (
              <option key={school.kod_sekolah} value={school.kod_sekolah}>
                {school.kod_sekolah} - {school.nama_sekolah}
              </option>
            ))
          )}
        </select>
      </label>

      <label>
        Kod Akses 8 Aksara
        <input name="access_code" inputMode="text" autoComplete="one-time-code" minLength={8} maxLength={8} placeholder="Contoh: 7M4K9P2R" required disabled={schools.length === 0 || pending} />
      </label>

      {schools.length === 0 && (
        <p className="notice">Servis Akses Ibu Bapa hanya dibuka kepada sekolah yang telah diluluskan.</p>
      )}
      {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}

      <button className="button" type="submit" disabled={schools.length === 0 || pending}>
        {pending ? 'Mengesahkan…' : 'Semak Laporan'}
      </button>

      <Link className="button secondary login-register-link" href="/login">
        Kembali ke Login
      </Link>
    </form>
  );
}
