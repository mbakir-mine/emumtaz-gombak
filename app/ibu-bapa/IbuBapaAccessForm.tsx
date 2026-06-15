'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { School } from '@/lib/data';

export default function IbuBapaAccessForm({ schools }: { schools: School[] }) {
  const router = useRouter();
  const [mykid, setMykid] = useState('');
  const [kodSekolah, setKodSekolah] = useState(schools[0]?.kod_sekolah ?? '');
  const [message, setMessage] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMykid = mykid.replace(/\D/g, '');
    const cleanKodSekolah = kodSekolah.trim().toUpperCase();

    if (schools.length === 0) {
      setMessage('Akses Ibu Bapa belum dibuka untuk mana-mana sekolah.');
      return;
    }

    if (cleanMykid.length < 6) {
      setMessage('Sila masukkan MyKid yang sah.');
      return;
    }

    if (!cleanKodSekolah) {
      setMessage('Sila pilih sekolah.');
      return;
    }

    router.push(
      `/ibu-bapa/laporan?mykid=${encodeURIComponent(cleanMykid)}&kod_sekolah=${encodeURIComponent(cleanKodSekolah)}`,
    );
  }

  return (
    <form onSubmit={handleSubmit} className="login-form">
      <label>
        MyKid Murid
        <input
          inputMode="numeric"
          placeholder="Contoh: 150101100001"
          value={mykid}
          onChange={(event) => setMykid(event.target.value)}
          required
          disabled={schools.length === 0}
        />
      </label>

      <label>
        Sekolah
        <select value={kodSekolah} onChange={(event) => setKodSekolah(event.target.value)} required disabled={schools.length === 0}>
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

      {schools.length === 0 && (
        <p className="notice">Servis Akses Ibu Bapa hanya dibuka kepada sekolah yang telah diluluskan.</p>
      )}
      {message && <p className="form-message">{message}</p>}

      <button className="button" type="submit" disabled={schools.length === 0}>
        Semak Laporan
      </button>

      <Link className="button secondary login-register-link" href="/login">
        Kembali ke Login
      </Link>
    </form>
  );
}
