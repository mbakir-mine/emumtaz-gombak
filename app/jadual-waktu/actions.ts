'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type TimetableActionState = { ok: boolean; message: string };
const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const list = (form: FormData, key: string) => form.getAll(key).map(String);

async function post(path: string, body: unknown): Promise<TimetableActionState & { data?: unknown }> {
  const base = getTrustedSelfHostedUrl();
  if (!base) return { ok: false, message: 'Backend self-hosted belum dikonfigurasi.' };
  const response = await fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify(body), cache: 'no-store' });
  const data = await response.json().catch(() => ({}));
  return response.ok ? { ok: true, message: data.message ?? '', data } : { ok: false, message: data.message ?? `Permintaan gagal (${response.status}).` };
}

export async function generateDefaultTimetableSlots(_state: TimetableActionState, form: FormData) { const result = await post('/api/timetable/slots/generate', { kod_sekolah: value(form, 'kod_sekolah') }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? 'Slot asas jadual waktu berjaya dijana.' : result.message }; }

export async function saveTimetableSlotSettings(_state: TimetableActionState, form: FormData) {
  const rows = list(form, 'slot_susunan').map((susunan, index) => ({ susunan: Number(susunan), label: list(form, 'slot_label')[index] || `Masa ${index + 1}`, waktu_mula: list(form, 'slot_waktu_mula')[index], waktu_tamat: list(form, 'slot_waktu_tamat')[index] }));
  const result = await post('/api/timetable/slots/update', { kod_sekolah: value(form, 'kod_sekolah'), rows }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? `${rows.length} tetapan slot masa berjaya dikemaskini.` : result.message };
}

export async function addTimetableSlotSetting(_state: TimetableActionState, form: FormData) { const result = await post('/api/timetable/slots/add', { kod_sekolah: value(form, 'kod_sekolah') }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? 'Slot masa berjaya ditambah.' : result.message }; }
export async function deleteTimetableSlotSetting(_state: TimetableActionState, form: FormData) { const result = await post('/api/timetable/slots/delete', { kod_sekolah: value(form, 'kod_sekolah'), susunan: Number(value(form, 'slot_susunan_target')) }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? 'Slot masa berjaya dibuang.' : result.message }; }

export async function saveTimetableRequirement(_state: TimetableActionState, form: FormData) {
  const result = await post('/api/timetable/requirements', { kod_sekolah: value(form, 'kod_sekolah'), class_id: value(form, 'class_id'), kod_subjek: value(form, 'kod_subjek'), teacher_id: value(form, 'teacher_id'), bil_slot_seminggu: Number(value(form, 'bil_slot_seminggu')), boleh_gabung: false }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? 'Tetapan subjek kelas berjaya disimpan.' : result.message };
}

export async function saveTimetableRequirements(_state: TimetableActionState, form: FormData) {
  const codes = list(form, 'requirement_kod_subjek'); const components = list(form, 'requirement_kod_komponen'); const labels = list(form, 'requirement_assignment_label'); const names = list(form, 'requirement_nama_paparan'); const teachers = list(form, 'requirement_teacher_id'); const slots = list(form, 'requirement_bil_slot'); const merge = list(form, 'requirement_boleh_gabung');
  const rows = codes.map((kod_subjek, index) => ({ kod_subjek, kod_komponen: components[index] || null, assignment_label: labels[index] || null, nama_paparan: names[index] || null, teacher_id: teachers[index] || null, bil_slot_seminggu: Number(slots[index] || 0), boleh_gabung: merge[index] === 'true' || merge[index] === '1' })).filter((row) => row.teacher_id && row.bil_slot_seminggu > 0);
  const result = await post('/api/timetable/requirements/bulk', { kod_sekolah: value(form, 'kod_sekolah'), class_id: value(form, 'class_id'), rows }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? `${rows.length} tetapan subjek berjaya dikemaskini.` : result.message };
}

export async function generateAutoTimetable(_state: TimetableActionState, form: FormData) {
  const result = await post('/api/timetable/generate', { kod_sekolah: value(form, 'kod_sekolah'), tahun_akademik: Number(value(form, 'tahun_akademik')) }); if (result.ok) revalidatePath('/jadual-waktu'); const entries = (result.data as { entries?: number } | undefined)?.entries; return { ok: result.ok, message: result.ok ? `Jadual automatik berjaya dijana (${entries ?? 0} slot).` : result.message };
}

export async function saveTimetableEntry(_state: TimetableActionState, form: FormData) {
  const result = await post('/api/timetable/entries', { kod_sekolah: value(form, 'kod_sekolah'), class_id: value(form, 'class_id'), slot_id: value(form, 'slot_id'), kod_subjek: value(form, 'kod_subjek'), teacher_id: value(form, 'teacher_id') || null, bilik: value(form, 'bilik') || null }); if (result.ok) revalidatePath('/jadual-waktu'); return { ok: result.ok, message: result.ok ? 'Jadual waktu kelas berjaya dikemaskini.' : result.message };
}
