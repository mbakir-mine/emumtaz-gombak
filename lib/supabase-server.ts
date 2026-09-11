import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServerEnv = Boolean(supabaseUrl && supabaseAnonKey);

export async function getSupabaseServerClient() {
  if (!hasSupabaseServerEnv) return null;

  const accessToken = (await cookies()).get('emumtaz_access_token')?.value;
  if (accessToken && supabaseServiceRoleKey) {
    const verifier = createClient(supabaseUrl as string, supabaseAnonKey as string);
    const { data: authData } = await verifier.auth.getUser(accessToken);
    if (authData.user?.email) {
      const adminClient = createClient(supabaseUrl as string, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data: ownerProfiles } = await adminClient
        .from('app_users')
        .select('id')
        .eq('status', 'AKTIF')
        .eq('role', 'OWNER')
        .or(`auth_user_id.eq.${authData.user.id},email.ilike.${authData.user.email}`)
        .limit(1);
      if (ownerProfiles?.length) return adminClient;
    }
  }
  const options = {
    global: {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
  };

  return createClient(supabaseUrl as string, supabaseAnonKey as string, options);
}
