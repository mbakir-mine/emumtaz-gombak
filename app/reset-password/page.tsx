'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import PasswordField from '../ui/PasswordField';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState(
    'Menyemak pautan pemulihan...',
  );
  const [success, setSuccess] = useState(false);
  const selfHosted = getTrustedSelfHostedUrl();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setReady(Boolean(selfHosted && params.get('token') && params.get('email')));
    setMessage(selfHosted && params.get('token') && params.get('email') ? '' : 'Pautan pemulihan tidak sah atau telah tamat tempoh.');
  }, [selfHosted]);

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (!selfHosted) { setMessage('Backend Laravel belum dikonfigurasi.'); return; }
    if (password.length < 8) {
      setMessage('Kata laluan mesti sekurang-kurangnya 8 aksara.');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Pengesahan kata laluan tidak sama.');
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setLoading(true);
    const response = await fetch(`${selfHosted}/api/auth/reset-password`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: params.get('token'), email: params.get('email'), password, password_confirmation: confirmPassword }) });
    setLoading(false);
    if (!response.ok) { setMessage('Pautan tidak sah atau password tidak dapat dikemaskini.'); return; }
    setSuccess(true); setReady(false); setMessage('Kata laluan berjaya dikemaskini. Sila log masuk semula.');
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
