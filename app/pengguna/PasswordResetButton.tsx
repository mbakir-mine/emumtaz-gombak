'use client';

import { useActionState } from 'react';
import { resetUserPassword } from './actions';
import { useAccessProfile } from '../ui/AuthGate';
import { useAccessToken } from '../ui/useAccessToken';

const initialState = { ok: false, message: '' };

export default function PasswordResetButton({
  userId,
  userName,
  locked,
}: {
  userId: string;
  userName: string;
  locked: boolean;
}) {
  const profile = useAccessProfile();
  const [state, action, pending] = useActionState(resetUserPassword, initialState);
  const accessToken = useAccessToken();

  if (locked || profile?.role !== 'OWNER') return null;

  return (
    <form
      action={action}
      className="inline-action-form"
      onSubmit={(event) => {
        if (!window.confirm(`Reset kata laluan untuk ${userName}? Kata laluan sedia ada tidak lagi boleh digunakan untuk log masuk baharu.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={userId} />
      <input type="hidden" name="access_token" value={accessToken} />
      <button className="button secondary" type="submit" disabled={pending || !accessToken}>
        {pending ? 'Menetapkan...' : 'Jana Kata Laluan Sementara'}
      </button>
      {state.message ? (
        <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>
      ) : (
        <p className="table-note">Kata laluan unik akan dipaparkan sekali dan pengguna diwajibkan menukarnya selepas log masuk.</p>
      )}
    </form>
  );
}
