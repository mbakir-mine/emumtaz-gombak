'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type MarkActionState = { ok: boolean; message: string };

function wholeMark(rawValue: FormDataEntryValue | null) {
  const raw = String(rawValue ?? '').trim();
  if (raw === '') return null;
  const markah = Number(raw);
  return Number.isInteger(markah) ? markah : Number.NaN;
}

export async function saveMarks(_previousState: MarkActionState, formData: FormData): Promise<MarkActionState> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const examId = String(formData.get('exam_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const studentIds = formData.getAll('student_id').map((value) => String(value));
  const componentCodes = [...new Set(formData.getAll('component_code').map((value) => String(value ?? '').trim()).filter(Boolean))];
  if (!examId || !classId || !kodSekolah || !kodSubjek || studentIds.length === 0) return { ok: false, message: 'Pilihan peperiksaan, kelas, subjek atau murid tidak lengkap.' };
  const cookieHeader = (await cookies()).toString();
  if (componentCodes.length > 0) {
    const definitions = componentCodes.map((code, index) => ({ kod_komponen: code, nama_komponen: String(formData.get(`component_name_${code}`) ?? code), markah_penuh: Number(formData.get(`component_max_${code}`) ?? 100), susunan: Number(formData.get(`component_order_${code}`) ?? index + 1) }));
    const rows = studentIds.flatMap((studentId) => componentCodes.map((code) => ({ student_id: studentId, kod_komponen: code, markah: wholeMark(formData.get(`component_markah_${studentId}_${code}`)) })));
    const response = await fetch(`${baseUrl}/api/marks/components`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieHeader }, body: JSON.stringify({ exam_id: examId, class_id: classId, kod_sekolah: kodSekolah, kod_subjek: kodSubjek, definitions, rows }), cache: 'no-store' });
    if (!response.ok) return { ok: false, message: `Gagal simpan komponen markah (${response.status}).` };
    revalidatePath('/markah'); revalidatePath('/analisis'); revalidatePath('/laporan');
    return { ok: true, message: 'Markah komponen dan jumlah rasmi berjaya disimpan.' };
  }
  for (const studentId of studentIds) {
    const markah = wholeMark(formData.get(`markah_${studentId}`));
    if (markah !== null && (!Number.isInteger(markah) || markah < 0 || markah > 10000)) return { ok: false, message: 'Markah mesti nombor bulat yang sah.' };
    const response = await fetch(`${baseUrl}/api/marks`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieHeader }, body: JSON.stringify({ exam_id: examId, student_id: studentId, kod_sekolah: kodSekolah, class_id: classId, kod_subjek: kodSubjek, markah }), cache: 'no-store' });
    if (!response.ok) { const payload = await response.json().catch(() => null) as { message?: string; errors?: Record<string, string[]> } | null; return { ok: false, message: payload?.message ?? Object.values(payload?.errors ?? {})[0]?.[0] ?? `Gagal simpan markah (${response.status}).` }; }
  }
  revalidatePath('/markah'); revalidatePath('/analisis'); revalidatePath('/laporan');
  return { ok: true, message: 'Markah berjaya disimpan.' };
}
