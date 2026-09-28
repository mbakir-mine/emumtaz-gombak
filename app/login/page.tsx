'use client';

import { useState } from 'react';
import Link from 'next/link';
import PasswordField from '../ui/PasswordField';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

const selfHostedAuthUrl = getTrustedSelfHostedUrl();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (selfHostedAuthUrl) {
      setLoading(true);
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 15000);
      const response = await fetch(`${selfHostedAuthUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
        cache: 'no-store',
        signal: controller.signal,
      }).catch(() => null);
      window.clearTimeout(timeout);
      if (!response?.ok) {
        setLoading(false);
        setMessage('Login gagal. Semak email dan password.');
        return;
      }
      setLoading(false);
      window.localStorage.removeItem('emumtaz_selected_profile_id');
      window.location.assign(new URL('/', window.location.origin).href);
      return;
    }

    setMessage('Backend Laravel belum disambungkan.');
  }

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="login-card login-info-card">
          <div className="login-brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz</strong>
              <span>Sistem Analisis Prestasi Murid SRA, SRAI, SRI & KAFAI</span>
            </div>
          </div>

          <div>
            <h1>e-Mumtaz</h1>
            <p className="login-copy">
              Platform pengurusan dan analisis prestasi murid untuk membantu sekolah memantau markah,
              laporan, kehadiran, modul pembelajaran dan data pentadbiran secara lebih tersusun.
            </p>
          </div>

          <div className="login-info-grid">
            <div>
              <span>Sekolah</span>
              <strong>SRA, SRAI, SRI & KAFAI</strong>
            </div>
            <div>
              <span>Akses</span>
              <strong>Admin, guru dan ibu bapa</strong>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-brand login-form-brand">
            <div>
              <strong>Log Masuk</strong>
              <span>Gunakan akaun yang telah disahkan.</span>
            </div>
          </div>

          <h1>Log Masuk</h1>
          <p className="login-copy">
            Akaun baru hanya boleh masuk selepas status diaktifkan oleh Admin.
          </p>

          {selfHostedAuthUrl ? (
            <div className="notice">Mod self-hosted aktif. Login menggunakan session Laravel.</div>
          ) : (
            <div className="notice">Backend Laravel belum disambungkan. Sila semak konfigurasi `NEXT_PUBLIC_SELF_HOSTED_URL`.</div>
          )}

          <form onSubmit={handleLogin} className="login-form">
            <label>
              Email
              <input
                type="email"
                placeholder="contoh@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <PasswordField
              label="Kata Laluan"
              placeholder="Masukkan kata laluan"
              value={password}
              onChange={setPassword}
              required
              autoComplete="current-password"
            />

            <Link className="forgot-link" href="/lupa-password">
              Lupa Kata Laluan?
            </Link>

            {message && <p className="form-message">{message}</p>}

            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Sedang log masuk...' : 'Log Masuk'}
            </button>

            <div className="login-divider">
              <span>atau</span>
            </div>

            <Link className="button secondary login-register-link" href="/daftar">
              Daftar Pengguna Baru
            </Link>

            <Link className="button secondary login-register-link" href="/ibu-bapa">
              Akses Ibu Bapa
            </Link>
          </form>
        </section>
      </div>
    </main>
  );
}
