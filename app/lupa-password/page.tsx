'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

export default function LupaPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleReset(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (cooldown > 0) return;

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    setLoading(true);
    const normalizedEmail = email.trim().toLowerCase();
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
      redirectTo,
    });
    setLoading(false);

    if (error) {
      setMessage('Pautan belum dapat dihantar. Sila tunggu sebentar dan cuba semula.');
      return;
    }

    setSuccess(true);
    setCooldown(60);
    setMessage('Jika email ini didaftarkan, pautan pemulihan telah dihantar. Sila semak peti masuk dan folder Spam.');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz</strong>
            <span>Pemulihan akaun pengguna</span>
          </div>
        </div>

        <h1>Lupa Kata Laluan</h1>
        <p className="login-copy">Masukkan email yang didaftarkan. Sistem akan menghantar pautan untuk menetapkan kata laluan baharu.</p>

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

          <button className="button" type="submit" disabled={loading || cooldown > 0}>
            {loading ? 'Menghantar...' : cooldown > 0 ? `Hantar Semula (${cooldown}s)` : success ? 'Hantar Semula Pautan' : 'Hantar Pautan Pemulihan'}
          </button>

          <p className="login-copy">Tidak lagi mempunyai akses kepada email? Hubungi Pentadbir Utama untuk kata laluan sementara.</p>

          <Link className="button secondary login-register-link" href="/login">
            Kembali ke Login
          </Link>
        </form>
      </section>
    </main>
  );
}
