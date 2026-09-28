'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { findKhalifahMudaIndicator } from '@/lib/khalifahMuda';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type KhalifahMudaActionState = { ok: boolean; message: string };
const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

async function saveRecord(formData: FormData, scope: 'KELAS' | 'INDIVIDU'): Promise<KhalifahMudaActionState> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const kodSekolah = text(formData, 'kod_sekolah');
  const classId = text(formData, 'class_id');
  const indicator = findKhalifahMudaIndicator(text(formData, 'indicator_key'));
  const studentIds = scope === 'KELAS' ? formData.getAll('student_ids').map(String).filter(Boolean) : [text(formData, 'student_id')];
  if (!kodSekolah || !classId || !indicator || studentIds.length === 0 || (scope === 'KELAS' && indicator.kind !== 'AKTIVITI_KELAS') || (scope === 'INDIVIDU' && indicator.kind === 'AKTIVITI_KELAS')) return { ok: false, message: scope === 'KELAS' ? 'Lengkapkan sekolah, kelas Tahun 6 dan aktiviti kelas.' : 'Pilih murid Tahun 6 dan indikator peristiwa.' };
  for (const studentId of studentIds) {
    const response = await fetch(`${baseUrl}/api/character/khalifah-muda`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ kod_sekolah: kodSekolah, class_id: classId, student_id: studentId, record_date: text(formData, 'record_date') || new Date().toISOString().slice(0, 10), record_scope: scope, record_kind: indicator.kind, domain: indicator.domain, indicator_key: indicator.key, indicator_label: indicator.label, points: indicator.points, catatan: text(formData, 'catatan') || null }), cache: 'no-store' });
    if (!response.ok) return { ok: false, message: `Gagal simpan rekod Khalifah Muda (${response.status}).` };
  }
  revalidatePath('/khalifah-muda');
  return { ok: true, message: scope === 'KELAS' ? `Rekod aktiviti kelas berjaya disimpan untuk ${studentIds.length} murid.` : 'Rekod murid berjaya disimpan.' };
}

export async function createKhalifahMudaClassRecord(_previousState: KhalifahMudaActionState, formData: FormData) { return saveRecord(formData, 'KELAS'); }
export async function createKhalifahMudaStudentRecord(_previousState: KhalifahMudaActionState, formData: FormData) { return saveRecord(formData, 'INDIVIDU'); }
