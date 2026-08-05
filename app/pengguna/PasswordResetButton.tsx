'use client';

import { useActionState, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { resetUserPassword } from './actions';
import { useAccessProfile } from '../ui/AuthGate';

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
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setAccessToken(data.session?.access_token ?? '');
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setAccessToken(session?.access_token ?? '');
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

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
