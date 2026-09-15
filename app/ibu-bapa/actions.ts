'use server';

import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { parentAccessHash, parentSessionCookie, requestNetworkHash, secureHashMatch } from '@/lib/parentAccess';
import { getSupabaseServiceClient } from '@/lib/supabase-server';

export type ParentLoginState = { ok: boolean; message: string };
const genericFailure = 'Maklumat akses tidak sepadan atau kod telah tamat tempoh.';

async function recordEvent(input: {
  schoolCode: string;
  studentId: string | null;
  eventType: 'BERJAYA' | 'GAGAL' | 'DIKUNCI' | 'LOG_KELUAR';
  identifierHash: string;
  networkHash: string | null;
}) {
  const service = getSupabaseServiceClient();
  if (!service) return;
  await service.from('parent_access_events').insert({
    kod_sekolah: input.schoolCode || null,
    student_id: input.studentId,
    event_type: input.eventType,
    identifier_hash: input.identifierHash,
    network_hash: input.networkHash,
  });
}

export async function loginParent(_previous: ParentLoginState, formData: FormData): Promise<ParentLoginState> {
  const mykid = String(formData.get('mykid') ?? '').replace(/\D/g, '');
  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const code = String(formData.get('access_code') ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (mykid.length < 6 || !schoolCode || code.length !== 8) return { ok: false, message: genericFailure };

  const service = getSupabaseServiceClient();
  if (!service) return { ok: false, message: 'Perkhidmatan akses ibu bapa belum tersedia.' };
  const identifierHash = parentAccessHash('identifier', `${schoolCode}:${mykid}`);
  const networkHash = await requestNetworkHash();
  const since = new Date(Date.now() - 15 * 60_000).toISOString();
  const [{ count: identifierAttempts }, networkAttemptsResult] = await Promise.all([
    service.from('parent_access_events').select('id', { count: 'exact', head: true }).eq('identifier_hash', identifierHash).in('event_type', ['GAGAL', 'DIKUNCI']).gte('created_at', since),
    networkHash
      ? service.from('parent_access_events').select('id', { count: 'exact', head: true }).eq('network_hash', networkHash).in('event_type', ['GAGAL', 'DIKUNCI']).gte('created_at', since)
      : Promise.resolve({ count: 0 }),
  ]);
  if ((identifierAttempts ?? 0) >= 10 || (networkAttemptsResult.count ?? 0) >= 30) {
    await recordEvent({ schoolCode, studentId: null, eventType: 'DIKUNCI', identifierHash, networkHash });
    return { ok: false, message: 'Terlalu banyak percubaan. Cuba semula selepas 15 minit.' };
  }

  const [{ data: moduleAccess }, { data: student }] = await Promise.all([
    service.from('school_module_access').select('enabled').eq('kod_sekolah', schoolCode).eq('module_key', 'AKSES_IBU_BAPA').maybeSingle(),
    service.from('students').select('id').eq('kod_sekolah', schoolCode).eq('mykid', mykid).eq('status', 'AKTIF').maybeSingle(),
  ]);
  if (!moduleAccess?.enabled || !student) {
    await recordEvent({ schoolCode, studentId: null, eventType: 'GAGAL', identifierHash, networkHash });
    return { ok: false, message: genericFailure };
  }

  const now = new Date().toISOString();
  const { data: activeCodes } = await service
    .from('parent_access_codes')
    .select('id,code_hash,expires_at,failed_attempts,locked_until')
    .eq('student_id', student.id)
    .eq('kod_sekolah', schoolCode)
    .eq('status', 'AKTIF')
    .gt('expires_at', now)
    .order('created_at', { ascending: false })
    .limit(3);
  const match = activeCodes?.find((item) => {
    if (item.locked_until && item.locked_until > now) return false;
    return secureHashMatch(item.code_hash, parentAccessHash('code', `${schoolCode}:${student.id}:${code}`));
  });
  if (!match) {
    const latest = activeCodes?.[0];
    if (latest) {
      const attempts = Math.min(Number(latest.failed_attempts ?? 0) + 1, 20);
      await service.from('parent_access_codes').update({
        failed_attempts: attempts,
        locked_until: attempts >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : null,
        updated_at: now,
      }).eq('id', latest.id);
    }
    await recordEvent({ schoolCode, studentId: student.id, eventType: latest && Number(latest.failed_attempts ?? 0) + 1 >= 5 ? 'DIKUNCI' : 'GAGAL', identifierHash, networkHash });
    return { ok: false, message: genericFailure };
  }

  const rawToken = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Math.min(Date.now() + 30 * 60_000, new Date(match.expires_at).getTime())).toISOString();
  const { error } = await service.from('parent_access_sessions').insert({
    access_code_id: match.id,
    student_id: student.id,
    kod_sekolah: schoolCode,
    token_hash: parentAccessHash('session', rawToken),
    expires_at: expiresAt,
  });
  if (error) return { ok: false, message: 'Sesi semakan gagal diwujudkan.' };
  await service.from('parent_access_codes').update({ failed_attempts: 0, locked_until: null, updated_at: now }).eq('id', match.id);
  await recordEvent({ schoolCode, studentId: student.id, eventType: 'BERJAYA', identifierHash, networkHash });
  (await cookies()).set(parentSessionCookie, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/ibu-bapa',
    expires: new Date(expiresAt),
  });
  redirect('/ibu-bapa/laporan');
}

export async function logoutParent() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(parentSessionCookie)?.value ?? '';
  const service = getSupabaseServiceClient();
  if (service && rawToken) {
    const tokenHash = parentAccessHash('session', rawToken);
    const { data: session } = await service.from('parent_access_sessions').select('student_id,kod_sekolah').eq('token_hash', tokenHash).maybeSingle();
    await service.from('parent_access_sessions').update({ revoked_at: new Date().toISOString() }).eq('token_hash', tokenHash);
    if (session) {
      await recordEvent({
        schoolCode: session.kod_sekolah,
        studentId: session.student_id,
        eventType: 'LOG_KELUAR',
        identifierHash: parentAccessHash('identifier', `${session.kod_sekolah}:${session.student_id}`),
        networkHash: await requestNetworkHash(),
      });
    }
  }
  cookieStore.delete(parentSessionCookie);
}
