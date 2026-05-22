'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap. Sila isi .env.local dahulu.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setMessage('Login gagal. Semak email dan password.');
      return;
    }

    router.push('/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Sistem Analisis Prestasi Murid SRA & KAFAI</span>
          </div>
        </div>

        <h1>Log Masuk</h1>
        <p className="login-copy">
          Gunakan akaun admin atau guru yang telah disahkan.
        </p>

        {!hasSupabaseEnv && (
          <div className="notice">
            Supabase belum disambungkan. Isi fail <strong>.env.local</strong> dengan URL dan anon key
            Supabase, kemudian restart server.
          </div>
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

          <label>
            Password
            <input
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <Link className="forgot-link" href="/lupa-password">
            Lupa kata laluan?
          </Link>

          {message && <p className="form-message">{message}</p>}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Sedang login...' : 'Login'}
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
    </main>
  );
}
