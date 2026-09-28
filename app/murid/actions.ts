'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { parseCsv, pickValue } from '@/lib/csv';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type StudentActionState = { ok: boolean; message: string; needsConfirmation?: boolean };

function baseUrl() { return getTrustedSelfHostedUrl(); }
function text(value: unknown) { return String(value ?? '').trim(); }
function normalize(value: string) { return value.replace(/\s+/g, ' ').trim().toUpperCase(); }
function gender(value: string) { const result = normalize(value); return ['L', 'LELAKI', 'MALE', 'M'].includes(result) ? 'L' : ['P', 'PEREMPUAN', 'FEMALE', 'F'].includes(result) ? 'P' : result; }
function mykid(value: string) { const result = value.trim(); return /[eE][+-]?\d+|\./.test(result) ? result : result.replace(/\D/g, ''); }
function year(value: string) { const result = Number(value.match(/\d+/)?.[0] ?? 0); return result >= 1 && result <= 6 ? result : null; }
function academicYear(value: string) { const result = Number(value.match(/\d{4}/)?.[0] ?? value); return Number.isFinite(result) && result > 0 ? result : new Date().getFullYear(); }

export async function createStudent(_state: StudentActionState, form: FormData): Promise<StudentActionState> {
  const base = baseUrl();
  if (!base) return { ok: false, message: 'Backend self-hosted belum dikonfigurasi.' };
  const payload = { mykid: text(form.get('mykid')), nama: normalize(text(form.get('nama_murid'))), jantina: gender(text(form.get('jantina'))), kod_sekolah: text(form.get('kod_sekolah')), class_id: text(form.get('class_id')), confirm_transfer: text(form.get('confirm_transfer')) === 'YA' };
  if (!payload.mykid || !payload.nama || !payload.jantina || !payload.kod_sekolah || !payload.class_id) return { ok: false, message: 'Lengkapkan semua medan murid.' };
  const response = await fetch(`${base}/api/students/upsert`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify(payload), cache: 'no-store' }).catch(() => null);
  if (response?.status === 409) return { ok: false, needsConfirmation: true, message: 'MyKid ini telah berada di sekolah atau kelas lain. Sahkan pindahan dahulu.' };
  if (!response?.ok) return { ok: false, message: 'Gagal menyimpan murid pada backend self-hosted.' };
  revalidatePath('/murid'); revalidatePath('/kelas'); revalidatePath('/');
  return { ok: true, message: `Murid ${payload.nama} berjaya disimpan.` };
}

export async function importStudents(_state: StudentActionState, form: FormData): Promise<StudentActionState> {
  const base = baseUrl();
  if (!base) return { ok: false, message: 'Backend self-hosted belum dikonfigurasi.' };
  const file = form.get('csv_file');
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Sila pilih fail CSV murid.' };
  const defaultSchool = normalize(text(form.get('default_kod_sekolah')));
  const parsed = await parseCsv(await file.text());
  const rows = parsed.rows.map((row) => ({
    mykid: mykid(pickValue(row, ['mykid', 'my_kid', 'no_kp', 'nokp'])),
    nama: normalize(pickValue(row, ['nama_murid', 'nama', 'nama pelajar'])),
    jantina: gender(pickValue(row, ['jantina', 'gender'])),
    kod_sekolah: normalize(pickValue(row, ['kod_sekolah', 'kod sekolah', 'sekolah']) || defaultSchool),
    class_id: pickValue(row, ['class_id', 'id_kelas']) || null,
    tahun: year(pickValue(row, ['tahun', 'tahun_murid', 'tahun murid', 'darjah'])),
    tahun_akademik: academicYear(pickValue(row, ['tahun_akademik', 'tahun akademik', 'sesi'])),
    nama_kelas: normalize(pickValue(row, ['nama_kelas', 'nama kelas', 'kelas'])) || null,
  })).filter((row) => row.mykid && row.nama && row.kod_sekolah);
  if (!rows.length) return { ok: false, message: 'Tiada rekod sah ditemui dalam CSV.' };
  const invalid = rows.find((row) => !/^\d{12}$/.test(row.mykid) || !row.jantina);
  if (invalid) return { ok: false, message: `Rekod ${invalid.nama || invalid.mykid} mempunyai MyKid atau jantina tidak sah.` };
  const duplicate = new Set<string>();
  if (rows.some((row) => duplicate.has(row.mykid) ? true : (duplicate.add(row.mykid), false))) return { ok: false, message: 'CSV mengandungi MyKid berulang. Semak fail sebelum import.' };
  const response = await fetch(`${base}/api/students/bulk`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ rows }), cache: 'no-store' }).catch(() => null);
  const payload = await response?.json().catch(() => null) as { created?: number; updated?: number; classes?: number; message?: string } | null;
  if (!response?.ok) return { ok: false, message: payload?.message ?? 'Import murid gagal pada backend self-hosted.' };
  revalidatePath('/murid'); revalidatePath('/');
  return { ok: true, message: `${payload?.created ?? 0} murid baharu, ${payload?.updated ?? 0} dikemaskini. ${payload?.classes ?? 0} kelas disediakan.` };
}
