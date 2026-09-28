import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import type { StudentSummaryRecord } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

export const parentSessionCookie = 'emumtaz_parent_session';
const secret = process.env.PARENT_ACCESS_SECRET || '';

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
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return null;
  const response = await fetch(`${selfHostedUrl}/api/parent/report`, { headers: { Cookie: `emumtaz_parent_session=${rawToken}` }, cache: 'no-store' });
  if (!response.ok) return null;
  const payload = await response.json() as { data?: { student?: { id: string; mykid: string; nama: string; kod_sekolah: string; status: string }; marks?: Array<{ exam_id: string; student_id: string; kod_subjek: string; markah: number | null }> } };
  const student = payload.data?.student;
  if (!student) return null;
  const grouped = (payload.data?.marks ?? []).reduce<Record<string, StudentSummaryRecord>>((acc, mark) => {
    const key = `${mark.exam_id}|${mark.student_id}`;
    const item = acc[key] ?? { tahun_akademik: 0, kod_peperiksaan: mark.exam_id, kod_sekolah: student.kod_sekolah, class_id: '', student_id: student.id, mykid: student.mykid, nama_murid: student.nama, bil_subjek_dikira: 0, purata: null, jumlah_markah: null };
    if (mark.markah !== null) { item.bil_subjek_dikira += 1; item.jumlah_markah = (item.jumlah_markah ?? 0) + Number(mark.markah); item.purata = item.jumlah_markah / item.bil_subjek_dikira; }
    acc[key] = item;
    return acc;
  }, {});
  return { sessionId: null, student: { id: student.id, mykid: student.mykid, nama_murid: student.nama, kod_sekolah: student.kod_sekolah, status: student.status }, summaries: Object.values(grouped) };
}
