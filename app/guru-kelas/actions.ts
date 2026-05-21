'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TeacherClassActionState = {
  ok: boolean;
  message: string;
};

export async function assignTeacherClass(
  _previousState: TeacherClassActionState,
  formData: FormData,
): Promise<TeacherClassActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const userId = String(formData.get('user_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();

  if (!userId || !classId) {
    return { ok: false, message: 'Pilih guru dan kelas.' };
  }

  const { error } = await supabase.from('teacher_class_assignments').upsert(
    {
      user_id: userId,
      class_id: classId,
    },
    {
      onConflict: 'user_id,class_id',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal tetapkan guru kelas: ${error.message}` };
  }

  revalidatePath('/guru-kelas');
  return { ok: true, message: 'Guru kelas berjaya ditetapkan.' };
}

