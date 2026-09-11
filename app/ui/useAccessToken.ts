'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useAccessToken() {
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

  return accessToken;
}
