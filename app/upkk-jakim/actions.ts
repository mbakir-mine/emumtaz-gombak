'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';
import {
  upkkComponentsByType,
  type UpkkJakimAssessmentType,
} from '@/lib/upkkJakim';
import { upkkScorableQuestionsByType } from '@/lib/upkkJakimQuestions';

export type UpkkJakimActionState = {
  ok: boolean;
  message: string;
};

function cleanNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

function isUpkkAssessmentType(value: string): value is UpkkJakimAssessmentType {
  return value === 'PCHI' || value === 'AMALI_SOLAT';
}

const UPKK_STUDENT_YEAR = 5;

export async function saveUpkkJakimMarks(
  _previousState: UpkkJakimActionState,
  formData: FormData,
): Promise<UpkkJakimActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik'));
  const assessmentType = String(formData.get('assessment_type') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim() || null;
  const studentId = String(formData.get('student_id') ?? '').trim();

  if (!kodSekolah || !classId || !Number.isFinite(tahunAkademik) || !isUpkkAssessmentType(assessmentType)) {
    return { ok: false, message: 'Pilih sekolah, tahun akademik, kelas dan jenis borang terlebih dahulu.' };
  }

  if (!studentId) {
    return { ok: false, message: 'Pilih nama murid untuk mengisi markah UPKK.' };
  }

  const { data: selectedClass, error: classError } = await supabase
    .from('classes')
    .select('id,tahun,kod_sekolah,tahun_akademik,status')
    .eq('id', classId)
    .eq('kod_sekolah', kodSekolah)
    .eq('tahun_akademik', tahunAkademik)
    .maybeSingle();

  if (classError) {
    return { ok: false, message: `Gagal semak kelas UPKK. Ralat: ${classError.message}` };
  }

  if (!selectedClass || selectedClass.status !== 'AKTIF' || selectedClass.tahun !== UPKK_STUDENT_YEAR) {
    return {
      ok: false,
      message: 'UPKK JAKIM hanya boleh disimpan untuk kelas Tahun 5 yang aktif.',
    };
  }

  const { data: selectedStudent, error: studentError } = await supabase
    .from('students')
    .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
    .eq('mykid', studentId)
    .eq('kod_sekolah', kodSekolah)
    .eq('class_id', classId)
    .maybeSingle();

  if (studentError) {
    return { ok: false, message: `Gagal semak murid UPKK. Ralat: ${studentError.message}` };
  }

  if (!selectedStudent || selectedStudent.status !== 'AKTIF') {
    return { ok: false, message: 'Murid yang dipilih tidak aktif dalam kelas ini.' };
  }

  const components = upkkComponentsByType(assessmentType);
  const questions = upkkScorableQuestionsByType(assessmentType);
  const itemRows = questions.map((question) => {
    const markah = cleanNumber(formData.get(`item_mark_${question.key}`));
    const catatan = String(formData.get(`item_note_${question.key}`) ?? '').trim();

    return {
      tahun_akademik: tahunAkademik,
      kod_sekolah: kodSekolah,
      class_id: classId,
      student_id: studentId,
      assessment_type: assessmentType,
      component_key: question.componentKey,
      component_title: question.componentTitle,
      item_key: question.key,
      item_number: question.number,
      item_title: question.title,
      max_mark: question.maxMark,
      markah,
      teacher_id: teacherId,
      catatan: catatan || null,
    };
  });

  const invalid = itemRows.find((row) => row.markah !== null && (row.markah < 0 || row.markah > row.max_mark));
  if (invalid) {
    return {
      ok: false,
      message: `${invalid.item_number} ${invalid.item_title} tidak boleh kurang 0 atau lebih ${invalid.max_mark}.`,
    };
  }

  const rowsByComponent = new Map<string, typeof itemRows>();
  itemRows.forEach((row) => {
    rowsByComponent.set(row.component_key, [...(rowsByComponent.get(row.component_key) ?? []), row]);
  });

  for (const component of components) {
    const subtotal = (rowsByComponent.get(component.key) ?? []).reduce((sum, row) => sum + (row.markah ?? 0), 0);
    if (subtotal > component.maxMark) {
      return {
        ok: false,
        message: `${component.section} ${component.title} melebihi markah maksimum ${component.maxMark}.`,
      };
    }
  }

  const { error: itemError } = await supabase.from('upkk_jakim_item_marks').upsert(itemRows, {
    onConflict: 'tahun_akademik,class_id,student_id,assessment_type,item_key',
  });

  if (itemError) {
    return {
      ok: false,
      message: `Gagal simpan item UPKK JAKIM. Jalankan SQL 035_upkk_jakim_module.sql dahulu. Ralat: ${itemError.message}`,
    };
  }

  const summaryRows = components.map((component) => {
    const componentRows = rowsByComponent.get(component.key) ?? [];
    const hasMark = componentRows.some((row) => row.markah !== null);
    const total = componentRows.reduce((sum, row) => sum + (row.markah ?? 0), 0);

    return {
      tahun_akademik: tahunAkademik,
      kod_sekolah: kodSekolah,
      class_id: classId,
      student_id: studentId,
      assessment_type: assessmentType,
      component_key: component.key,
      component_title: `${component.section}: ${component.title}`,
      max_mark: component.maxMark,
      markah: hasMark ? total : null,
      teacher_id: teacherId,
      catatan: null,
    };
  });

  const { error } = await supabase.from('upkk_jakim_marks').upsert(summaryRows, {
    onConflict: 'tahun_akademik,class_id,student_id,assessment_type,component_key',
  });

  if (error) {
    return {
      ok: false,
      message: `Gagal simpan markah UPKK JAKIM. Jalankan SQL 035_upkk_jakim_module.sql dahulu. Ralat: ${error.message}`,
    };
  }

  revalidatePath('/upkk-jakim');
  revalidatePath(`/upkk-jakim/murid/${encodeURIComponent(studentId)}`);
  return {
    ok: true,
    message: `Markah ${assessmentType === 'PCHI' ? 'PCHI' : 'Amali Solat'} untuk ${selectedStudent.nama_murid} berjaya disimpan.`,
  };
}
