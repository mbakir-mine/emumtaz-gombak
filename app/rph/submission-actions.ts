'use server';

import { revalidatePath } from 'next/cache';
import { getRphWeekStart } from '@/lib/rph';
import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

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

  const supabase = await getAuthenticatedSupabaseServerClient();
  if (!supabase) return { ok: false, message: 'Sesi pengguna tidak sah. Sila log masuk semula.' };

  const { error } = await supabase.rpc('transition_rph_weekly_submission', {
    p_actor_profile_id: actorProfileId,
    p_school_code: schoolCode,
    p_week_start: weekStart,
    p_submission_id: submissionId || null,
    p_next_action: nextAction,
    p_note: note,
  });
  if (error) return { ok: false, message: `Tindakan tidak berjaya: ${error.message}` };

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
