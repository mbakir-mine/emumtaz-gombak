import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export async function syncServerSession(accessToken: string | null) {
  const response = await fetch('/api/auth/session', {
    method: accessToken ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: accessToken ? JSON.stringify({ accessToken }) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) throw new Error('Sesi server gagal diselaraskan.');

  const result = (await response.json()) as { changed?: unknown };
  return result.changed === true;
}
