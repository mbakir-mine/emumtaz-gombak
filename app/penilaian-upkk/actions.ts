'use server';

import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { calculateUpkkAmaliTotal, UPKK_AMALI_SOLAT_ITEMS } from '@/lib/upkkAmaliSolat';
import { calculateUpkkPchiTotal, UPKK_PCHI_ITEMS } from '@/lib/upkkPchi';

export type UpkkActionState = { ok: boolean; message: string };

function readScore(value: FormDataEntryValue | null, max: number) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return 0;
  const score = Number(text);
  return Number.isFinite(score) ? Math.min(max, Math.max(0, score)) : null;
}

async function savePractical(formData: FormData, kind: 'amali' | 'pchi'): Promise<UpkkActionState> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const tahunAkademik = Number(String(formData.get('tahun_akademik') ?? '').trim());
  const classId = String(formData.get('class_id') ?? '').trim();
  const studentId = String(formData.get('student_id') ?? '').trim();
  if (!kodSekolah || !tahunAkademik || !classId || !studentId) return { ok: false, message: 'Lengkapkan sekolah, tahun, kelas dan murid.' };
  const items = kind === 'amali' ? UPKK_AMALI_SOLAT_ITEMS : UPKK_PCHI_ITEMS;
  const scores: Record<string, number> = {};
  for (const item of items) {
    const score = readScore(formData.get(`score_${item.code}`), item.max);
    if (score === null) return { ok: false, message: `Markah ${item.code} tidak sah.` };
    scores[item.code] = score;
  }
  const jumlah = kind === 'amali' ? calculateUpkkAmaliTotal(scores) : calculateUpkkPchiTotal(scores);
  const response = await fetch(`${baseUrl}/api/assessments/upkk/practical/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ kod_sekolah: kodSekolah, tahun_akademik: tahunAkademik, class_id: classId, student_id: studentId, scores, jumlah, status: jumlah > 0 ? 'LENGKAP' : 'DRAF' }), cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { ok: false, message: `Gagal simpan markah UPKK ${kind === 'amali' ? 'Amali Solat' : 'PCHI'} (${response?.status ?? 'rangkaian'}).` };
  return { ok: true, message: `Markah UPKK ${kind === 'amali' ? 'Amali Solat' : 'PCHI'} berjaya disimpan.` };
}

export async function saveUpkkAmaliSolat(_previousState: UpkkActionState, formData: FormData) { return savePractical(formData, 'amali'); }
export async function saveUpkkPchi(_previousState: UpkkActionState, formData: FormData) { return savePractical(formData, 'pchi'); }
