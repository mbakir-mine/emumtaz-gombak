'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TeacherSubjectActionState = {
  ok: boolean;
  message: string;
};

export async function assignTeacherSubject(
  _previousState: TeacherSubjectActionState,
  formData: FormData,
): Promise<TeacherSubjectActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const userId = String(formData.get('user_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();

  if (!userId || !classId || !kodSubjek) {
    return { ok: false, message: 'Pilih guru, kelas dan subjek.' };
  }

  const { error } = await supabase.from('teacher_subject_assignments').upsert(
    {
      user_id: userId,
      class_id: classId,
      kod_subjek: kodSubjek,
    },
    {
      onConflict: 'user_id,class_id,kod_subjek',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal tetapkan guru subjek: ${error.message}` };
  }

  revalidatePath('/guru-subjek');
  return { ok: true, message: 'Guru subjek berjaya ditetapkan.' };
}

