import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const hasSupabaseServerEnv = Boolean(supabaseUrl && supabaseAnonKey);

export async function getVerifiedStudentScope() {
  if (!hasSupabaseServerEnv || !supabaseServiceRoleKey) return null;

  const accessToken = (await cookies()).get('emumtaz_access_token')?.value;
  if (!accessToken) return null;

  const verifier = createClient(supabaseUrl as string, supabaseAnonKey as string, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: authData } = await verifier.auth.getUser(accessToken);
  const user = authData.user;
  if (!user?.email) return null;

  const client = createClient(supabaseUrl as string, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: profiles, error } = await client
    .from('app_users')
    .select('role,kod_sekolah,zon')
    .eq('status', 'AKTIF')
    .or(`auth_user_id.eq.${user.id},email.ilike.${user.email}`);
  if (error || !profiles?.length) return null;

  if (profiles.some((profile) => ['OWNER', 'ADMIN_DAERAH'].includes(profile.role))) {
    return { client, schoolCodes: null };
  }

  const schoolCodes = new Set<string>();
  profiles.forEach((profile) => {
    if (profile.kod_sekolah) schoolCodes.add(profile.kod_sekolah);
  });

  const zones = [...new Set(profiles.filter((profile) => profile.role === 'ADMIN_ZON' && profile.zon).map((profile) => profile.zon!))];
  if (zones.length > 0) {
    const { data: zoneSchools } = await client.from('schools').select('kod_sekolah').in('zon', zones).eq('status', 'AKTIF');
    zoneSchools?.forEach((school) => schoolCodes.add(school.kod_sekolah));
  }

  return { client, schoolCodes: [...schoolCodes] };
}

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
  const authenticatedHeaders: Record<string, string> = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};
  const options = {
    global: {
      headers: authenticatedHeaders,
      fetch: (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
        return fetch(input, { ...init, headers, cache: 'no-store' });
      },
    },
    auth: { autoRefreshToken: false, persistSession: false },
    ...(accessToken ? { accessToken: async () => accessToken } : {}),
  };

  return createClient(supabaseUrl as string, supabaseAnonKey as string, options);
}
