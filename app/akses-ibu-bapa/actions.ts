'use server';

import { randomInt } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { parentAccessHash } from '@/lib/parentAccess';
import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

export type ParentCodeState = { ok: boolean; message: string; code?: string; expiresAt?: string };
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

function generateCode() {
  return Array.from({ length: 8 }, () => alphabet[randomInt(0, alphabet.length)]).join('');
}

export async function issueParentAccessCode(_previous: ParentCodeState, formData: FormData): Promise<ParentCodeState> {
  const studentId = String(formData.get('student_id') ?? '').trim();
  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const days = Math.min(Math.max(Number(formData.get('valid_days') ?? 7), 1), 31);
  if (!/^[0-9a-f-]{36}$/i.test(studentId) || !schoolCode || !Number.isInteger(days)) {
    return { ok: false, message: 'Maklumat murid atau tempoh tidak sah.' };
  }
  const supabase = await getAuthenticatedSupabaseServerClient();
  if (!supabase) return { ok: false, message: 'Sila log masuk semula.' };
  const code = generateCode();
  const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString();

  const { error } = await supabase.rpc('issue_parent_access_code', {
    p_student_id: studentId,
    p_school_code: schoolCode,
    p_code_hash: parentAccessHash('code', `${schoolCode}:${studentId}:${code}`),
    p_expires_at: expiresAt,
  });
  if (error) return { ok: false, message: `Gagal menjana kod: ${error.message}` };
  revalidatePath('/akses-ibu-bapa');
  return { ok: true, message: 'Kod dijana. Salin sekarang kerana kod penuh tidak disimpan.', code, expiresAt };
}
