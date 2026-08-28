'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { examAccessStatus } from '@/lib/examAccess';
import { isPsraExamCode } from '@/lib/examOrdering';
import { defaultComponentsForSubject } from '@/lib/subjectComponents';

export type MarkActionState = {
  ok: boolean;
  message: string;
};

function positiveNumber(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveInteger(value: FormDataEntryValue | null, fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function saveMarks(
  _previousState: MarkActionState,
  formData: FormData,
): Promise<MarkActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const examId = String(formData.get('exam_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const studentIds = formData.getAll('student_id').map((value) => String(value));
  const componentCodes = [...new Set(formData.getAll('component_code').map((value) => String(value ?? '').trim()).filter(Boolean))];

  if (!examId || !classId || !kodSekolah || !kodSubjek || studentIds.length === 0) {
    return { ok: false, message: 'Pilihan peperiksaan, kelas, subjek atau murid tidak lengkap.' };
  }

  const { data: exam, error: examError } = await supabase.from('exams').select('*').eq('id', examId).maybeSingle();

  if (examError) {
    return { ok: false, message: `Gagal semak tempoh akses markah: ${examError.message}` };
  }

  const access = examAccessStatus(exam);

  if (!access.open) {
    return { ok: false, message: access.label };
  }

  if (isPsraExamCode(exam?.kod_peperiksaan)) {
    const { data: moduleAccess, error: moduleAccessError } = await supabase
      .from('school_module_access')
      .select('id')
      .eq('kod_sekolah', kodSekolah)
      .eq('module_key', 'PERCUBAAN_PSRA')
      .eq('enabled', true)
      .maybeSingle();

    if (moduleAccessError) {
      return { ok: false, message: `Gagal semak akses PSRA sekolah: ${moduleAccessError.message}` };
    }

    if (!moduleAccess) {
      return { ok: false, message: 'Sekolah ini belum dibenarkan akses Percubaan PSRA.' };
    }
  }

  if (componentCodes.length > 0) {
    const defaultComponentByCode = new Map(
      defaultComponentsForSubject(kodSubjek).map((component) => [component.kod_komponen, component]),
    );
    const componentDefinitions = componentCodes.map((componentCode, index) => {
      const defaultComponent = defaultComponentByCode.get(componentCode);
      const componentName = String(
        formData.get(`component_name_${componentCode}`) ?? defaultComponent?.nama_komponen ?? componentCode,
      ).trim();

      return {
        kod_subjek: kodSubjek,
        kod_komponen: componentCode,
        nama_komponen: componentName || componentCode,
        markah_penuh: positiveNumber(
          formData.get(`component_max_${componentCode}`),
          defaultComponent?.markah_penuh ?? 100,
        ),
        susunan: positiveInteger(
          formData.get(`component_order_${componentCode}`),
          defaultComponent?.susunan ?? index + 1,
        ),
        status: 'AKTIF',
      };
    });
    const componentMaxByCode = new Map(
      componentDefinitions.map((component) => [component.kod_komponen, component.markah_penuh]),
    );

    const { error: definitionError } = await supabase.from('subject_components').upsert(componentDefinitions, {
      onConflict: 'kod_subjek,kod_komponen',
      ignoreDuplicates: true,
    });

    if (definitionError) {
      return {
        ok: false,
        message: `Tetapan komponen markah belum lengkap. Jalankan SQL 026_subject_mark_components.sql dan 029_year3_imlak_khat_components.sql dahulu. Ralat: ${definitionError.message}`,
      };
    }

    const componentRows = studentIds.flatMap((studentId) =>
      componentCodes.map((componentCode) => {
        const raw = String(formData.get(`component_markah_${studentId}_${componentCode}`) ?? '').trim();
        const markah = raw === '' ? null : Number(raw);
        return {
          exam_id: examId,
          student_id: studentId,
          kod_sekolah: kodSekolah,
          class_id: classId,
          kod_subjek: kodSubjek,
          kod_komponen: componentCode,
          markah,
        };
      }),
    );

    const invalidComponent = componentRows.find((row) => {
      const maxMark = componentMaxByCode.get(row.kod_komponen) ?? 100;
      return row.markah !== null && (!Number.isFinite(row.markah) || row.markah < 0 || row.markah > maxMark);
    });

    if (invalidComponent) {
      const maxMark = componentMaxByCode.get(invalidComponent.kod_komponen) ?? 100;
      return { ok: false, message: `Markah ${invalidComponent.kod_komponen} mesti antara 0 hingga ${maxMark}.` };
    }

    const { error: componentError } = await supabase.from('mark_components').upsert(componentRows, {
      onConflict: 'exam_id,student_id,kod_subjek,kod_komponen',
    });

    if (componentError) {
      return {
        ok: false,
        message: `Gagal simpan komponen markah. Jalankan SQL 026_subject_mark_components.sql dahulu. Ralat: ${componentError.message}`,
      };
    }

    const rows = studentIds.map((studentId) => {
      const values = componentCodes.map((componentCode) => {
        const raw = String(formData.get(`component_markah_${studentId}_${componentCode}`) ?? '').trim();
        return raw === '' ? null : Number(raw);
      });
      const numericValues = values.filter((value): value is number => value !== null && Number.isFinite(value));
      const complete = numericValues.length === componentCodes.length;
      const markah = complete ? Number(numericValues.reduce((sum, value) => sum + value, 0).toFixed(2)) : null;
      return {
        exam_id: examId,
        student_id: studentId,
        kod_sekolah: kodSekolah,
        class_id: classId,
        kod_subjek: kodSubjek,
        markah,
      };
    });

    const { error } = await supabase.from('marks').upsert(rows, {
      onConflict: 'exam_id,student_id,kod_subjek',
    });

    if (error) {
      return { ok: false, message: `Komponen berjaya disimpan, tetapi jumlah induk gagal dikemaskini: ${error.message}` };
    }

    revalidatePath('/markah');
    revalidatePath('/analisis');
    revalidatePath('/laporan');
    return { ok: true, message: 'Markah komponen dan jumlah rasmi berjaya disimpan.' };
  }

  const rows = studentIds.map((studentId) => {
    const raw = String(formData.get(`markah_${studentId}`) ?? '').trim();
    const markah = raw === '' ? null : Number(raw);
    return {
      exam_id: examId,
      student_id: studentId,
      kod_sekolah: kodSekolah,
      class_id: classId,
      kod_subjek: kodSubjek,
      markah,
    };
  });

  const invalid = rows.find(
    (row) => row.markah !== null && (!Number.isFinite(row.markah) || row.markah < 0 || row.markah > 100),
  );
  if (invalid) {
    return { ok: false, message: 'Markah mesti antara 0 hingga 100.' };
  }

  const { error } = await supabase.from('marks').upsert(rows, {
    onConflict: 'exam_id,student_id,kod_subjek',
  });

  if (error) {
    return { ok: false, message: `Gagal simpan markah: ${error.message}` };
  }

  revalidatePath('/markah');
  revalidatePath('/analisis');
  revalidatePath('/laporan');
  return { ok: true, message: 'Markah berjaya disimpan.' };
}
