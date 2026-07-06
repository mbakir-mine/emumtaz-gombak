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

const clearTeacherValue = '__CLEAR__';

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

    if (!userId) {
      continue;
    }

    const { error: deleteError } = await supabase.from('teacher_class_assignments').delete().eq('class_id', classId);
    if (deleteError) {
      return { ok: false, message: `Gagal kemaskini guru kelas: ${deleteError.message}` };
    }

    if (userId !== clearTeacherValue) {
      const { error: insertError } = await supabase.from('teacher_class_assignments').insert({
        class_id: classId,
        user_id: userId,
      });
      if (insertError) {
        return { ok: false, message: `Gagal simpan guru kelas: ${insertError.message}` };
      }
    }

    updated += 1;
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
  const kodSekolah = String(formData.get('subject_kod_sekolah') ?? '').trim();
  const subjectCodes = stringList(formData, 'kod_subjek').filter(Boolean);
  const userIds = stringList(formData, 'subject_teacher_id');
  const componentParentSubjectCodes = [
    ...new Set(stringList(formData, 'component_parent_kod_subjek').filter(Boolean)),
  ];
  const componentSubjectCodes = stringList(formData, 'component_kod_subjek');
  const componentCodes = stringList(formData, 'component_kod_komponen');
  const componentUserIds = stringList(formData, 'component_teacher_id');
  const timetableSubjectCodes = stringList(formData, 'timetable_kod_subjek');
  const timetableComponentCodes = stringList(formData, 'timetable_kod_komponen');
  const timetableDisplayNames = stringList(formData, 'timetable_nama_paparan');
  const timetableTeacherIds = stringList(formData, 'timetable_teacher_id');
  const timetableSlotCounts = stringList(formData, 'timetable_bil_slot');

  const timetableRows = timetableSubjectCodes
    .map((kodSubjek, index) => {
      const rawSlot = timetableSlotCounts[index] ?? '';
      const bilSlot = rawSlot === '' ? 0 : Number(rawSlot);
      return {
        kodSubjek,
        kodKomponen: timetableComponentCodes[index] ?? '',
        namaPaparan: timetableDisplayNames[index] ?? '',
        teacherId: timetableTeacherIds[index] ?? '',
        bilSlot,
      };
    })
    .filter((row) => row.kodSubjek);

  if (!classId || subjectCodes.length + componentSubjectCodes.length === 0) {
    return { ok: false, message: 'Pilih kelas dan subjek untuk dikemaskini.' };
  }

  const invalidRequirement = timetableRows.find(
    (row) => !Number.isFinite(row.bilSlot) || row.bilSlot < 0 || row.bilSlot > 40,
  );
  if (invalidRequirement) {
    return { ok: false, message: 'Bil. Masa mesti antara 0 hingga 40.' };
  }

  let updated = 0;
  let componentUpdated = 0;
  for (const [index, kodSubjek] of subjectCodes.entries()) {
    const userId = userIds[index] ?? '';

    if (!userId) {
      continue;
    }

    const { error: deleteError } = await supabase
      .from('teacher_subject_assignments')
      .delete()
      .eq('class_id', classId)
      .eq('kod_subjek', kodSubjek);

    if (deleteError) {
      return { ok: false, message: `Gagal kemaskini guru subjek: ${deleteError.message}` };
    }

    if (userId !== clearTeacherValue) {
      const { error: insertError } = await supabase.from('teacher_subject_assignments').insert({
        class_id: classId,
        kod_subjek: kodSubjek,
        user_id: userId,
      });
      if (insertError) {
        return { ok: false, message: `Gagal simpan guru subjek: ${insertError.message}` };
      }
    }

    updated += 1;
  }

  for (const kodSubjek of componentParentSubjectCodes) {
    const { error: deleteError } = await supabase
      .from('teacher_subject_assignments')
      .delete()
      .eq('class_id', classId)
      .eq('kod_subjek', kodSubjek);

    if (deleteError) {
      return { ok: false, message: `Gagal bersihkan tetapan guru subjek gabungan: ${deleteError.message}` };
    }
  }

  for (const [index, kodSubjek] of componentSubjectCodes.entries()) {
    const kodKomponen = componentCodes[index] ?? '';
    const userId = componentUserIds[index] ?? '';

    if (!kodSubjek || !kodKomponen || !userId) {
      continue;
    }

    const { error: deleteError } = await supabase
      .from('teacher_subject_component_assignments')
      .delete()
      .eq('class_id', classId)
      .eq('kod_subjek', kodSubjek)
      .eq('kod_komponen', kodKomponen);

    if (deleteError) {
      return {
        ok: false,
        message: `Gagal kemaskini guru komponen. Jalankan SQL 026_subject_mark_components.sql dahulu. Ralat: ${deleteError.message}`,
      };
    }

    if (userId !== clearTeacherValue) {
      const { error: insertError } = await supabase.from('teacher_subject_component_assignments').insert({
        class_id: classId,
        kod_subjek: kodSubjek,
        kod_komponen: kodKomponen,
        user_id: userId,
      });
      if (insertError) {
        return { ok: false, message: `Gagal simpan guru komponen subjek: ${insertError.message}` };
      }
    }

    componentUpdated += 1;
  }

  let requirementUpdated = 0;
  let requirementWarning = '';
  if (kodSekolah && timetableRows.length > 0) {
    const { data: existingRequirements, error: existingRequirementError } = await supabase
      .from('timetable_requirements')
      .select('kod_subjek,kod_komponen,boleh_gabung')
      .eq('class_id', classId);

    if (existingRequirementError) {
      requirementWarning =
        'Bil. Masa belum disimpan kerana jadual automatik belum tersedia. Jalankan SQL 025_timetable_auto_requirements.sql dahulu.';
    } else {
      const existingRequirementMap = new Map<string, boolean>();
      (existingRequirements ?? []).forEach((requirement) => {
        existingRequirementMap.set(
          `${requirement.kod_subjek}|${requirement.kod_komponen ?? ''}`,
          Boolean(requirement.boleh_gabung),
        );
      });

      for (const row of timetableRows) {
        let deleteQuery = supabase
          .from('timetable_requirements')
          .delete()
          .eq('class_id', classId)
          .eq('kod_subjek', row.kodSubjek);

        deleteQuery = row.kodKomponen ? deleteQuery.eq('kod_komponen', row.kodKomponen) : deleteQuery.is('kod_komponen', null);

        const { error: deleteRequirementError } = await deleteQuery;
        if (deleteRequirementError) {
          return {
            ok: false,
            message: `Guru subjek disimpan, tetapi Bil. Masa gagal dikemaskini: ${deleteRequirementError.message}`,
          };
        }

        const teacherId = row.teacherId && row.teacherId !== clearTeacherValue ? row.teacherId : '';
        if (!teacherId || row.bilSlot <= 0) {
          continue;
        }

        const requirementKey = `${row.kodSubjek}|${row.kodKomponen}`;
        const { error: insertRequirementError } = await supabase.from('timetable_requirements').insert({
          kod_sekolah: kodSekolah,
          class_id: classId,
          kod_subjek: row.kodSubjek,
          kod_komponen: row.kodKomponen || null,
          nama_paparan: row.namaPaparan || null,
          teacher_id: teacherId,
          bil_slot_seminggu: row.bilSlot,
          boleh_gabung: existingRequirementMap.get(requirementKey) ?? false,
          status: 'AKTIF',
        });

        if (insertRequirementError) {
          return {
            ok: false,
            message: `Guru subjek disimpan, tetapi Bil. Masa gagal disimpan: ${insertRequirementError.message}`,
          };
        }

        requirementUpdated += 1;
      }
    }
  }

  revalidatePath('/guru-subjek');
  revalidatePath(`/guru-subjek/${classId}`);
  revalidatePath('/jadual-waktu');
  revalidatePath('/');
  const totalUpdated = updated + componentUpdated;
  const requirementMessage =
    timetableRows.length > 0 && !requirementWarning ? ` ${requirementUpdated} Bil. Masa berjaya dikemaskini.` : '';
  return {
    ok: true,
    message: `${totalUpdated} tetapan guru subjek berjaya dikemaskini.${requirementMessage}${
      requirementWarning ? ` ${requirementWarning}` : ''
    }`,
  };
}
