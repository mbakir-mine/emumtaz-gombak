import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { cache } from 'react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseServerEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const getSupabaseServerClient = cache(async () => {
  if (!hasSupabaseServerEnv) return null;

  const accessToken = (await cookies()).get('emumtaz_access_token')?.value;

  return createClient(supabaseUrl as string, supabaseAnonKey as string, {
    global: {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: { autoRefreshToken: false, persistSession: false },
  });
});
