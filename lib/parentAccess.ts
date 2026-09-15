import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { getSupabaseServiceClient } from './supabase-server';
import type { StudentSummaryRecord } from './data';

export const parentSessionCookie = 'emumtaz_parent_session';
const secret = process.env.PARENT_ACCESS_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function parentAccessHash(purpose: string, value: string) {
  if (!secret) throw new Error('Rahsia akses ibu bapa belum ditetapkan pada server.');
  return createHmac('sha256', secret).update(`${purpose}:${value}`).digest('hex');
}

export function secureHashMatch(left: string, right: string) {
  if (!/^[a-f0-9]{64}$/.test(left) || !/^[a-f0-9]{64}$/.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
}

export async function requestNetworkHash() {
  const requestHeaders = await headers();
  const address = requestHeaders.get('cf-connecting-ip')
    || requestHeaders.get('x-real-ip')
    || requestHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '';
  return address ? parentAccessHash('network', address) : null;
}

export async function getParentReportSession() {
  const rawToken = (await cookies()).get(parentSessionCookie)?.value ?? '';
  if (!/^[A-Za-z0-9_-]{40,100}$/.test(rawToken)) return null;
  const service = getSupabaseServiceClient();
  if (!service) return null;
  const tokenHash = parentAccessHash('session', rawToken);
  const now = new Date().toISOString();
  const { data: session } = await service
    .from('parent_access_sessions')
    .select('id,student_id,kod_sekolah,expires_at')
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .maybeSingle();
  if (!session) return null;

  const [{ data: moduleAccess }, { data: student }] = await Promise.all([
    service.from('school_module_access').select('enabled').eq('kod_sekolah', session.kod_sekolah).eq('module_key', 'AKSES_IBU_BAPA').maybeSingle(),
    service.from('students').select('id,mykid,nama_murid,kod_sekolah,status').eq('id', session.student_id).eq('kod_sekolah', session.kod_sekolah).maybeSingle(),
  ]);
  if (!moduleAccess?.enabled || !student || student.status !== 'AKTIF') return null;

  const { data: summaries } = await service
    .from('v_school_student_exam_summary')
    .select('*')
    .eq('student_id', student.id)
    .eq('kod_sekolah', student.kod_sekolah)
    .order('tahun_akademik', { ascending: false });
  await service.from('parent_access_sessions').update({ last_seen_at: now }).eq('id', session.id);
  return { sessionId: session.id, student, summaries: (summaries ?? []) as StudentSummaryRecord[] };
}
