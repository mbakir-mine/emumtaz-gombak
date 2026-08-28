'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import PasswordField from '../ui/PasswordField';

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
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      setLoading(false);
      setMessage('Login gagal. Semak email dan password.');
      return;
    }

    const user = data.user;
    const profileFilter = user.id
      ? `auth_user_id.eq.${user.id},email.ilike.${cleanEmail}`
      : `email.ilike.${cleanEmail}`;
    const { data: activeProfiles, error: activeError } = await supabase
      .from('app_users')
      .select('id')
      .or(profileFilter)
      .eq('status', 'AKTIF')
      .limit(1);

    if (activeError) {
      await supabase.auth.signOut();
      setLoading(false);
      setMessage('Ralat menyemak status akaun. Sila cuba semula.');
      return;
    }

    if (!activeProfiles || activeProfiles.length === 0) {
      const { data: pendingProfiles } = await supabase
        .from('app_users')
        .select('status')
        .or(profileFilter)
        .limit(1);

      await supabase.auth.signOut();
      setLoading(false);
      setMessage(
        pendingProfiles?.some((profile) => profile.status === 'MENUNGGU')
          ? 'Akaun anda masih menunggu pengesahan Admin.'
          : 'Akaun anda belum aktif. Sila hubungi Admin.',
      );
      return;
    }

    setLoading(false);
    window.localStorage.removeItem('emumtaz_selected_profile_id');
    router.push('/');
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz</strong>
            <span>Sistem Analisis Prestasi Murid SRA, SRAI, SRI & KAFAI</span>
          </div>
        </div>

        <h1>Log Masuk</h1>
        <p className="login-copy">
          Gunakan akaun pentadbir atau guru yang telah disahkan.
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
    </main>
  );
}
