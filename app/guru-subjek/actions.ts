'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TeacherSubjectActionState = {
  ok: boolean;
  message: string;
};

function stringList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? '').trim());
}

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

export async function bulkAssignTeacherClasses(
  _previousState: TeacherSubjectActionState,
  formData: FormData,
): Promise<TeacherSubjectActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const classIds = stringList(formData, 'class_id').filter(Boolean);
  const userIds = stringList(formData, 'teacher_id');

  if (classIds.length === 0) {
    return { ok: false, message: 'Tiada kelas untuk dikemaskini.' };
  }

  let updated = 0;
  for (const [index, classId] of classIds.entries()) {
    const userId = userIds[index] ?? '';
    const { error: deleteError } = await supabase.from('teacher_class_assignments').delete().eq('class_id', classId);
    if (deleteError) {
      return { ok: false, message: `Gagal kemaskini guru kelas: ${deleteError.message}` };
    }

    if (userId) {
      const { error: insertError } = await supabase.from('teacher_class_assignments').insert({
        class_id: classId,
        user_id: userId,
      });
      if (insertError) {
        return { ok: false, message: `Gagal simpan guru kelas: ${insertError.message}` };
      }
      updated += 1;
    }
  }

  revalidatePath('/guru-subjek');
  revalidatePath('/guru-kelas');
  revalidatePath('/');
  return { ok: true, message: `${updated} guru kelas berjaya dikemaskini.` };
}

export async function bulkAssignTeacherSubjects(
  _previousState: TeacherSubjectActionState,
  formData: FormData,
): Promise<TeacherSubjectActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const classId = String(formData.get('subject_class_id') ?? '').trim();
  const subjectCodes = stringList(formData, 'kod_subjek').filter(Boolean);
  const userIds = stringList(formData, 'subject_teacher_id');

  if (!classId || subjectCodes.length === 0) {
    return { ok: false, message: 'Pilih kelas dan subjek untuk dikemaskini.' };
  }

  let updated = 0;
  for (const [index, kodSubjek] of subjectCodes.entries()) {
    const userId = userIds[index] ?? '';
    const { error: deleteError } = await supabase
      .from('teacher_subject_assignments')
      .delete()
      .eq('class_id', classId)
      .eq('kod_subjek', kodSubjek);

    if (deleteError) {
      return { ok: false, message: `Gagal kemaskini guru subjek: ${deleteError.message}` };
    }

    if (userId) {
      const { error: insertError } = await supabase.from('teacher_subject_assignments').insert({
        class_id: classId,
        kod_subjek: kodSubjek,
        user_id: userId,
      });
      if (insertError) {
        return { ok: false, message: `Gagal simpan guru subjek: ${insertError.message}` };
      }
      updated += 1;
    }
  }

  revalidatePath('/guru-subjek');
  revalidatePath(`/guru-subjek/${classId}`);
  revalidatePath('/jadual-waktu');
  revalidatePath('/');
  return { ok: true, message: `${updated} guru mata pelajaran berjaya dikemaskini.` };
}
