'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import PasswordField from '../ui/PasswordField';

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
    const user = sessionData.session?.user;
    const email = user?.email;

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

    let flagUpdateFailed = false;
    if (user?.id) {
      const { error: idUpdateError } = await supabase
        .from('app_users')
        .update({ must_change_password: false })
        .eq('auth_user_id', user.id);
      flagUpdateFailed = Boolean(idUpdateError);
    }
    const { error: emailUpdateError } = await supabase
      .from('app_users')
      .update({ must_change_password: false })
      .ilike('email', email);
    flagUpdateFailed = flagUpdateFailed || Boolean(emailUpdateError);

    setLoading(false);

    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    if (flagUpdateFailed) {
      setMessage('Password berjaya ditukar, tetapi status wajib tukar password gagal dikemaskini. Sila maklumkan Pentadbir Utama.');
      return;
    }

    setSuccess(true);
    setMessage('Password berjaya ditukar.');
    router.replace('/');
  }

  return (
    <form className="form-grid password-form" onSubmit={handleSubmit}>
      <PasswordField
        label="Password Semasa"
        value={currentPassword}
        onChange={setCurrentPassword}
        placeholder="Masukkan password semasa"
        required
        autoComplete="current-password"
      />

      <PasswordField
        label="Password Baru"
        value={newPassword}
        onChange={setNewPassword}
        placeholder="Minimum 6 aksara"
        required
        autoComplete="new-password"
      />

      <PasswordField
        label="Sahkan Password Baru"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Ulang password baru"
        required
        autoComplete="new-password"
      />

      <div className="form-actions">
        <button className="button" type="submit" disabled={loading}>
          {loading ? 'Menyimpan...' : 'Tukar Password'}
        </button>
        {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}
      </div>
    </form>
  );
}
