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

    if (newPassword.length < 8) {
      setMessage('Kata laluan baharu mesti sekurang-kurangnya 8 aksara.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Pengesahan kata laluan baharu tidak sama.');
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
      setMessage('Kata laluan semasa tidak tepat.');
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setLoading(false);
      setMessage(`Gagal menukar kata laluan: ${error.message}`);
      return;
    }

    await supabase.auth.signOut({ scope: 'others' });

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
      setMessage('Kata laluan berjaya ditukar, tetapi status wajib tukar kata laluan gagal dikemaskini. Sila maklumkan Pentadbir Utama.');
      return;
    }

    setSuccess(true);
    setMessage('Kata laluan berjaya ditukar. Sesi lain telah ditamatkan.');
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
      </div>
    </form>
  );
}
