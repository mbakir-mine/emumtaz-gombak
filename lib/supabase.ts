import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = hasSupabaseEnv
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export async function syncServerSession(accessToken: string | null) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const response = await fetch('/api/auth/session', {
    method: accessToken ? 'POST' : 'DELETE',
    headers: { 'Content-Type': 'application/json', 'X-Emumtaz-CSRF': '1' },
    body: accessToken ? JSON.stringify({ accessToken }) : undefined,
    credentials: 'same-origin',
    cache: 'no-store',
    signal: controller.signal,
  });
  window.clearTimeout(timeout);
  if (!response.ok) throw new Error('Sesi server gagal diselaraskan.');

  const result = (await response.json()) as { changed?: unknown };
  return result.changed === true;
}
