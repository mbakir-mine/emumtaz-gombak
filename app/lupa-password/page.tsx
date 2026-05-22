'use client';

import Link from 'next/link';
import { useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    setLoading(true);
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    });
    setLoading(false);

    if (error) {
      setMessage(`Gagal hantar email reset: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage('Jika email ini wujud, pautan reset kata laluan telah dihantar.');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Reset kata laluan pengguna</span>
          </div>
        </div>

        <h1>Lupa Kata Laluan</h1>
        <p className="login-copy">Masukkan email akaun. Sistem akan menghantar pautan untuk tetapkan kata laluan baru.</p>

        <form onSubmit={handleReset} className="login-form">
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

          {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Menghantar...' : 'Hantar Link Reset'}
          </button>

          <Link className="button secondary login-register-link" href="/login">
            Kembali ke Login
          </Link>
        </form>
      </section>
    </main>
  );
}
