'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import PasswordField from '../ui/PasswordField';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export default function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    const selfHostedUrl = getTrustedSelfHostedUrl();
    if (!selfHostedUrl) { setMessage('Backend Laravel belum dikonfigurasi.'); return; }
    if (newPassword.length < 8 || newPassword !== confirmPassword) { setMessage('Password baharu tidak sah atau pengesahan tidak sama.'); return; }
    setLoading(true);
    const response = await fetch(`${selfHostedUrl}/api/auth/change-password`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current_password: currentPassword, password: newPassword, password_confirmation: confirmPassword }) });
    setLoading(false);
    if (!response.ok) { setMessage('Kata laluan semasa tidak tepat atau password baharu tidak sah.'); return; }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);
    setMessage('Kata laluan berjaya ditukar.');
    router.replace('/');
  }

  return (
    <form className="form-grid password-form" onSubmit={handleSubmit}>
      <PasswordField
        label="Kata Laluan Semasa"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Masukkan kata laluan semasa"
        required
        autoComplete="current-password"
      />

      <PasswordField
        label="Kata Laluan Baharu"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="Minimum 8 aksara"
        required
        autoComplete="new-password"
      />

      <PasswordField
        label="Sahkan Kata Laluan Baharu"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Ulang kata laluan baharu"
        required
        autoComplete="new-password"
      />

      <div className="form-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Tukar Kata Laluan'}
        </button>
        {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}
        {!success && (
          <Link className="forgot-link" href="/lupa-password">
            Lupa kata laluan semasa?
          </Link>
        )}
      </div>
    </form>
  );
}
