import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseServerEnv = Boolean(supabaseUrl && supabaseAnonKey);

export async function getSupabaseServerClient() {
  if (!hasSupabaseServerEnv) return null;

  const accessToken = (await cookies()).get('emumtaz_access_token')?.value;
  const options = {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
  };

  return createClient(supabaseUrl as string, supabaseAnonKey as string, options);
}
