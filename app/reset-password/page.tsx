'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import PasswordField from '../ui/PasswordField';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('Menyemak pautan reset...');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session));
      setMessage(data.session ? '' : 'Pautan reset tidak sah atau telah tamat tempoh.');
    });
  }, []);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    if (password.length < 6) {
      setMessage('Kata laluan mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Pengesahan kata laluan tidak sama.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setMessage(`Gagal kemaskini kata laluan: ${error.message}`);
      return;
    }

    const user = sessionData.session?.user;
    if (user?.id) {
      await supabase.from('app_users').update({ must_change_password: false }).eq('auth_user_id', user.id);
    }
    if (user?.email) {
      await supabase.from('app_users').update({ must_change_password: false }).ilike('email', user.email);
    }

    setSuccess(true);
    setMessage('Kata laluan berjaya dikemaskini. Anda boleh log masuk semula.');
    window.setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Tetapkan kata laluan baru</span>
          </div>
        </div>

        <h1>Reset Kata Laluan</h1>
        <p className="login-copy">Masukkan kata laluan baru untuk akaun anda.</p>

        {!ready ? (
          <div className="login-form">
            {message && <p className="form-message">{message}</p>}
            <Link className="button secondary login-register-link" href="/lupa-password">
              Minta Link Baru
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="login-form">
            <PasswordField
              label="Kata Laluan Baru"
              placeholder="Minimum 6 aksara"
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
            />

            <PasswordField
              label="Sahkan Kata Laluan"
              placeholder="Ulang kata laluan baru"
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              autoComplete="new-password"
            />

            {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}

            <button className="button" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Kata Laluan'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
