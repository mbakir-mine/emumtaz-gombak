'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type PbdActionState = {
  ok: boolean;
  message: string;
};

function numberOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export async function savePbdMarks(_previousState: PbdActionState, formData: FormData): Promise<PbdActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  return savePbdMarksSelfHosted(selfHostedUrl, formData);
}

async function savePbdMarksSelfHosted(baseUrl: string, formData: FormData): Promise<PbdActionState> {
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const tarikh = String(formData.get('tarikh') ?? '').trim();
  const tajuk = String(formData.get('tajuk') ?? '').trim() || 'Penilaian PBD';
  const instrumen = String(formData.get('instrumen') ?? '').trim() || 'Pemerhatian';
  const markahPenuh = Number(formData.get('markah_penuh') ?? 100);
  const studentIds = formData.getAll('student_id').map((value) => String(value).trim()).filter(Boolean);
  if (!kodSekolah || !classId || !tahunAkademik || !kodSubjek || !tarikh || studentIds.length === 0) return { ok: false, message: 'Pilih sekolah, kelas, subjek, tarikh dan murid terlebih dahulu.' };
  if (!Number.isFinite(markahPenuh) || markahPenuh <= 0) return { ok: false, message: 'Markah penuh PBD mesti lebih daripada 0.' };
  const cookieHeader = (await cookies()).toString();
  const headers = { 'Content-Type': 'application/json', Cookie: cookieHeader };
  const assessmentResponse = await fetch(`${baseUrl}/api/pbd/assessments`, { method: 'POST', headers, body: JSON.stringify({ class_id: classId, tahun_akademik: tahunAkademik, kod_subjek: kodSubjek, tarikh, tajuk, instrumen, markah_penuh: markahPenuh }), cache: 'no-store' });
  if (!assessmentResponse.ok) return { ok: false, message: `Gagal simpan tetapan PBD (${assessmentResponse.status}).` };
  const assessmentPayload = await assessmentResponse.json() as { data?: { id?: string } };
  if (!assessmentPayload.data?.id) return { ok: false, message: 'Laravel tidak memulangkan ID penilaian PBD.' };
  const records = studentIds.map((studentId) => ({ student_id: studentId, markah: numberOrNull(formData.get(`markah_${studentId}`)), tahap_penguasaan: numberOrNull(formData.get(`tp_${studentId}`)), catatan: String(formData.get(`catatan_${studentId}`) ?? '').trim() || null }));
  const invalid = records.find((record) => (record.markah !== null && (record.markah < 0 || record.markah > markahPenuh)) || (record.tahap_penguasaan !== null && (record.tahap_penguasaan < 1 || record.tahap_penguasaan > 6)));
  if (invalid) return { ok: false, message: 'Markah atau tahap penguasaan PBD tidak sah.' };
  const marksResponse = await fetch(`${baseUrl}/api/pbd/assessments/${assessmentPayload.data.id}/marks`, { method: 'POST', headers, body: JSON.stringify({ records }), cache: 'no-store' });
  if (!marksResponse.ok) return { ok: false, message: `Gagal simpan markah PBD (${marksResponse.status}).` };
  revalidatePath('/pbd');
  revalidatePath('/laporan/pbd');
  return { ok: true, message: `${records.length} rekod PBD berjaya disimpan.` };
}
