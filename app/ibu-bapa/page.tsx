'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function IbuBapaLoginPage() {
  const router = useRouter();
  const [mykid, setMykid] = useState('');
  const [kodSekolah, setKodSekolah] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanMykid = mykid.replace(/\D/g, '');
    const cleanKodSekolah = kodSekolah.trim().toUpperCase();

    if (cleanMykid.length < 6) {
      setMessage('Sila masukkan MyKid yang sah.');
      return;
    }

    if (!cleanKodSekolah) {
      setMessage('Sila masukkan kod sekolah.');
      return;
    }

    router.push(
      `/ibu-bapa/laporan?mykid=${encodeURIComponent(cleanMykid)}&kod_sekolah=${encodeURIComponent(cleanKodSekolah)}`,
    );
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Akses Ibu Bapa</span>
          </div>
        </div>

        <h1>Semakan Anak</h1>
        <p className="login-copy">Masukkan MyKid dan kod sekolah murid.</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            MyKid Murid
            <input
              inputMode="numeric"
              placeholder="Contoh: 150101100001"
              value={mykid}
              onChange={(event) => setMykid(event.target.value)}
              required
            />
          </label>

          <label>
            Kod Sekolah
            <input
              placeholder="Contoh: BYP7010"
              value={kodSekolah}
              onChange={(event) => setKodSekolah(event.target.value.toUpperCase())}
              required
            />
          </label>

          {message && <p className="form-message">{message}</p>}

          <button className="button" type="submit">
            Semak Laporan
          </button>

          <Link className="button secondary login-register-link" href="/login">
            Kembali ke Login
          </Link>
        </form>
      </section>
    </main>
  );
}
