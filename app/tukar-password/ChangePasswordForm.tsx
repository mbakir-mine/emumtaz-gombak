'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

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

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password baru mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Pengesahan password baru tidak sama.');
      return;
    }

    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const email = sessionData.session?.user.email;

    if (!email) {
      setLoading(false);
      setMessage('Sesi login tidak dijumpai. Sila login semula.');
      return;
    }

    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });

    if (verifyError) {
      setLoading(false);
      setMessage('Password semasa tidak tepat.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setLoading(false);
      setMessage(`Gagal tukar password: ${error.message}`);
      return;
    }

    await supabase
      .from('app_users')
      .update({ must_change_password: false })
      .eq('email', email.toLowerCase());

    setLoading(false);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSuccess(true);
    setMessage('Password berjaya ditukar.');
    router.refresh();
  }

  return (
    <form className="form-grid password-form" onSubmit={handleSubmit}>
      <label>
        Password Semasa
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          placeholder="Masukkan password semasa"
          required
        />
      </label>

      <label>
        Password Baru
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          placeholder="Minimum 6 aksara"
          required
        />
      </label>

      <label>
        Sahkan Password Baru
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Ulang password baru"
          required
        />
      </label>

      <div className="form-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Tukar Password'}
        </button>
        {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}
      </div>
    </form>
  );
}
