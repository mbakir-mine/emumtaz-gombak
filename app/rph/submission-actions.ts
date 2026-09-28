'use server';

import { revalidatePath } from 'next/cache';
import { getRphWeekStart } from '@/lib/rph';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type RphSubmissionActionState = { ok: boolean; message: string };

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const allowedActions = new Set(['HANTAR', 'MULA_SEMAK', 'PEMBETULAN', 'SAH']);

export async function transitionRphWeeklySubmission(
  _previous: RphSubmissionActionState,
  formData: FormData,
): Promise<RphSubmissionActionState> {
  const actorProfileId = String(formData.get('actor_profile_id') ?? '').trim();
  const submissionId = String(formData.get('submission_id') ?? '').trim();
  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase().slice(0, 32);
  const weekStart = getRphWeekStart(String(formData.get('week_start') ?? '').trim());
  const nextAction = String(formData.get('next_action') ?? '').trim().toUpperCase();
  const note = String(formData.get('note') ?? '').trim().slice(0, 2000) || null;

  if (!uuid.test(actorProfileId) || (submissionId && !uuid.test(submissionId)) || !schoolCode || !weekStart || !allowedActions.has(nextAction)) {
    return { ok: false, message: 'Maklumat penghantaran atau semakan tidak sah.' };
  }
  if (nextAction !== 'HANTAR' && !submissionId) {
    return { ok: false, message: 'Penghantaran untuk disemak tidak ditemui.' };
  }
  if (nextAction === 'PEMBETULAN' && (note?.length ?? 0) < 5) {
    return { ok: false, message: 'Nyatakan pembetulan yang diperlukan, sekurang-kurangnya 5 aksara.' };
  }

  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const response = await fetch(`${selfHostedUrl}/api/rph/weekly/transition`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ submission_id: submissionId || null, kod_sekolah: schoolCode, week_start: weekStart, next_action: nextAction, note }), cache: 'no-store' });
  if (!response.ok) return { ok: false, message: `Tindakan tidak berjaya (${response.status}).` };

  revalidatePath('/rph');
  revalidatePath('/notifikasi');
  const labels: Record<string, string> = {
    HANTAR: 'RPH mingguan berjaya dihantar untuk semakan.',
    MULA_SEMAK: 'Semakan telah dimulakan.',
    PEMBETULAN: 'RPH dipulangkan kepada guru untuk pembetulan.',
    SAH: 'Penghantaran RPH mingguan berjaya disahkan.',
  };
  return { ok: true, message: labels[nextAction] };
}
