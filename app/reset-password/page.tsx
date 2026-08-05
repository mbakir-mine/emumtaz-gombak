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
  const [message, setMessage] = useState(
    hasSupabaseEnv ? 'Menyemak pautan pemulihan...' : 'Tetapan Supabase belum lengkap.',
  );
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let active = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'INITIAL_SESSION' && session) || event === 'SIGNED_IN') {
        setReady(Boolean(session));
        setMessage(session ? '' : 'Pautan pemulihan tidak sah atau telah tamat tempoh.');
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setReady(Boolean(data.session));
      setMessage(error || !data.session ? 'Pautan pemulihan tidak sah atau telah tamat tempoh.' : '');
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    if (password.length < 8) {
      setMessage('Kata laluan mesti sekurang-kurangnya 8 aksara.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Pengesahan kata laluan tidak sama.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setMessage(`Gagal kemaskini kata laluan: ${error.message}`);
      return;
    }

    const user = sessionData.session?.user;
    let profileUpdateFailed = false;
    if (user?.id) {
      const { error: idError } = await supabase
        .from('app_users')
        .update({ must_change_password: false })
        .eq('auth_user_id', user.id);
      profileUpdateFailed = Boolean(idError);
    }
    if (user?.email) {
      const { error: emailError } = await supabase
        .from('app_users')
        .update({ must_change_password: false })
        .ilike('email', user.email);
      profileUpdateFailed = profileUpdateFailed || Boolean(emailError);
    }

    await supabase.auth.signOut({ scope: 'global' });
    setLoading(false);
    setReady(false);

    setSuccess(true);
    setMessage(
      profileUpdateFailed
        ? 'Kata laluan berjaya dikemaskini, tetapi status profil perlu disemak oleh Pentadbir Utama.'
        : 'Kata laluan berjaya dikemaskini. Semua sesi lama telah ditamatkan. Sila log masuk semula.',
    );
    window.setTimeout(() => router.push('/login'), 1500);
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz</strong>
            <span>Tetapkan kata laluan baharu</span>
          </div>
        </div>

        <h1>Tetapkan Kata Laluan Baharu</h1>
        <p className="login-copy">Gunakan sekurang-kurangnya 8 aksara dan elakkan kata laluan yang pernah digunakan.</p>

        {success ? (
          <div className="login-form">
            <p className="form-success">{message}</p>
            <Link className="button secondary login-register-link" href="/login">
              Kembali ke Log Masuk
            </Link>
          </div>
        ) : !ready ? (
          <div className="login-form">
            {message && <p className="form-message">{message}</p>}
            <Link className="button secondary login-register-link" href="/lupa-password">
              Minta Pautan Baharu
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="login-form">
            <PasswordField
              label="Kata Laluan Baru"
              placeholder="Minimum 8 aksara"
              value={password}
              onChange={setPassword}
              required
              autoComplete="new-password"
            />

            <PasswordField
              label="Sahkan Kata Laluan Baharu"
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
