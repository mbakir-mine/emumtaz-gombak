'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedSupabaseServerClient } from '@/lib/supabase-server';

export type MarkWorkflowActionState = { ok: boolean; message: string };
const statuses = new Set(['DRAF', 'DIHANTAR', 'DISAHKAN', 'DIKUNCI', 'PEMBETULAN']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function transitionMarkSubmission(
  _previous: MarkWorkflowActionState,
  formData: FormData,
): Promise<MarkWorkflowActionState> {
  const supabase = await getAuthenticatedSupabaseServerClient();
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const schoolCode = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const examId = String(formData.get('exam_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const subjectCode = String(formData.get('kod_subjek') ?? '').trim().toUpperCase();
  const nextStatus = String(formData.get('next_status') ?? '').trim().toUpperCase();
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 1000) || null;
  if (!schoolCode || !uuid.test(examId) || !uuid.test(classId) || !subjectCode || !statuses.has(nextStatus)) {
    return { ok: false, message: 'Skop atau status penghantaran tidak sah.' };
  }

  const { error } = await supabase.rpc('transition_mark_submission', {
    p_school_code: schoolCode,
    p_exam_id: examId,
    p_class_id: classId,
    p_subject_code: subjectCode,
    p_next_status: nextStatus,
    p_notes: notes,
  });
  if (error) return { ok: false, message: `Tindakan gagal: ${error.message}` };

  revalidatePath('/pengesahan-markah');
  revalidatePath('/notifikasi');
  revalidatePath('/markah');
  return { ok: true, message: `Status berjaya dikemas kini kepada ${nextStatus}.` };
}
