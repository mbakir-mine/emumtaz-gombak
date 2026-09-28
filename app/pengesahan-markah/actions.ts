'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type MarkWorkflowActionState = { ok: boolean; message: string };
const statuses = new Set(['DRAF', 'DIHANTAR', 'DISAHKAN', 'DIKUNCI', 'PEMBETULAN']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function transitionMarkSubmission(
  _previous: MarkWorkflowActionState,
  formData: FormData,
): Promise<MarkWorkflowActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const examId = String(formData.get('exam_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const subjectCode = String(formData.get('kod_subjek') ?? '').trim().toUpperCase();
  const nextStatus = String(formData.get('next_status') ?? '').trim().toUpperCase();
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 1000) || null;
  if (!schoolCode || !uuid.test(examId) || !uuid.test(classId) || !subjectCode || !statuses.has(nextStatus)) {
    return { ok: false, message: 'Skop atau status penghantaran tidak sah.' };
  }

  const response = await fetch(`${selfHostedUrl}/api/mark-workflows`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ kod_sekolah: schoolCode, exam_id: examId, class_id: classId, kod_subjek: subjectCode, status: nextStatus, notes }), cache: 'no-store' });
  if (!response.ok) return { ok: false, message: 'Tindakan gagal pada backend Laravel.' };

  revalidatePath('/pengesahan-markah');
  revalidatePath('/notifikasi');
  revalidatePath('/markah');
  return { ok: true, message: `Status berjaya dikemas kini kepada ${nextStatus}.` };
}
