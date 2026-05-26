'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type PromotionActionState = {
  ok: boolean;
  message: string;
};

type SourceEnrollment = {
  student_id: string;
  kod_sekolah: string;
  class_id: string | null;
  status: string;
  students?: {
    id: string;
    mykid: string;
    nama_murid: string;
    jantina: string | null;
  };
  classes?: {
    id: string;
    kod_sekolah: string;
    tahun_akademik: number;
    tahun: number;
    nama_kelas: string;
  } | null;
};

type TargetClass = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  tahun: number;
  nama_kelas: string;
};

function classStem(name: string) {
  return name.replace(/^\s*\d+\s*/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

function findTargetClass(sourceClass: SourceEnrollment['classes'], targetClasses: TargetClass[]) {
  if (!sourceClass || sourceClass.tahun >= 6) return null;

  const targetYear = sourceClass.tahun + 1;
  const sourceStem = classStem(sourceClass.nama_kelas);
  const sameSchoolAndYear = targetClasses.filter(
    (item) => item.kod_sekolah === sourceClass.kod_sekolah && item.tahun === targetYear,
  );

  return (
    sameSchoolAndYear.find((item) => classStem(item.nama_kelas) === sourceStem) ??
    sameSchoolAndYear[0] ??
    null
  );
}

function selectedTarget(formData: FormData, studentId: string, targetClasses: TargetClass[]) {
  const targetClassId = String(formData.get(`target_class_id__${studentId}`) ?? '').trim();
  if (!targetClassId) return null;
  return targetClasses.find((item) => item.id === targetClassId) ?? null;
}

export async function promoteStudents(
  _previousState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const sourceYear = Number(formData.get('source_year'));
  const targetYear = Number(formData.get('target_year'));
  const selectedStudentIds = new Set(formData.getAll('selected_student_ids').map((item) => String(item)));

  if (!sourceYear || !targetYear || targetYear <= sourceYear) {
    return { ok: false, message: 'Pilih tahun asal dan tahun baharu yang sah.' };
  }

  const { data: sourceRows, error: sourceError } = await supabase
    .from('student_enrollments')
    .select(
      `
      student_id,
      kod_sekolah,
      class_id,
      status,
      students(id,mykid,nama_murid,jantina),
      classes(id,kod_sekolah,tahun_akademik,tahun,nama_kelas)
    `,
    )
    .eq('tahun_akademik', sourceYear)
    .eq('status', 'AKTIF');

  if (sourceError) {
    return {
      ok: false,
      message: 'Sila jalankan SQL supabase/022_student_enrollments.sql dahulu sebelum proses naik tahun.',
    };
  }

  const { data: targetRows, error: targetError } = await supabase
    .from('classes')
    .select('id,kod_sekolah,tahun_akademik,tahun,nama_kelas')
    .eq('tahun_akademik', targetYear)
    .eq('status', 'AKTIF');

  if (targetError) {
    return { ok: false, message: `Gagal membaca kelas tahun ${targetYear}: ${targetError.message}` };
  }

  const sources = ((sourceRows ?? []) as any[]).map((item) => ({
    ...item,
    students: Array.isArray(item.students) ? item.students[0] : item.students,
    classes: Array.isArray(item.classes) ? item.classes[0] : item.classes,
  })) as SourceEnrollment[];
  const targetClasses = (targetRows ?? []) as TargetClass[];

  if (sources.length === 0) {
    return { ok: false, message: `Tiada rekod murid aktif untuk tahun ${sourceYear}.` };
  }

  const selectedSources = sources.filter((source) => selectedStudentIds.has(source.student_id));

  if (selectedSources.length === 0) {
    return { ok: false, message: 'Pilih sekurang-kurangnya seorang murid untuk diproses.' };
  }

  const planned = selectedSources.map((source) => ({
    source,
    targetClass: selectedTarget(formData, source.student_id, targetClasses) ?? findTargetClass(source.classes, targetClasses),
  }));

  const promotable = planned.filter(
    (item) => item.source.classes && item.source.classes.tahun < 6 && item.targetClass,
  );
  const graduates = selectedSources.filter((source) => source.classes?.tahun === 6);
  const needsReview = selectedSources.length - promotable.length - graduates.length;

  if (promotable.length === 0 && graduates.length === 0) {
    return {
      ok: false,
      message: 'Tiada murid boleh diproses. Semak dahulu kelas tahun baharu yang belum dipadankan.',
    };
  }

  const enrollmentRows = [
    ...promotable.map(({ source, targetClass }) => ({
      student_id: source.student_id,
      tahun_akademik: targetYear,
      kod_sekolah: targetClass!.kod_sekolah,
      class_id: targetClass!.id,
      status: 'AKTIF',
      catatan: `Naik tahun daripada ${sourceYear} ke ${targetYear}`,
    })),
    ...graduates.map((source) => ({
      student_id: source.student_id,
      tahun_akademik: targetYear,
      kod_sekolah: source.kod_sekolah,
      class_id: null,
      status: 'TAMAT',
      catatan: `Tamat Tahun 6 selepas ${sourceYear}`,
    })),
  ];

  const { error: upsertError } = await supabase.from('student_enrollments').upsert(enrollmentRows, {
    onConflict: 'student_id,tahun_akademik',
  });

  if (upsertError) {
    return { ok: false, message: `Gagal simpan rekod naik tahun: ${upsertError.message}` };
  }

  for (const { source, targetClass } of promotable) {
    await supabase
      .from('students')
      .update({
        kod_sekolah: targetClass!.kod_sekolah,
        class_id: targetClass!.id,
        status: 'AKTIF',
      })
      .eq('id', source.student_id);
  }

  for (const source of graduates) {
    await supabase.from('students').update({ class_id: null, status: 'TAMAT' }).eq('id', source.student_id);
  }

  revalidatePath('/murid/naik-tahun');
  revalidatePath('/murid');
  revalidatePath('/');

  return {
    ok: true,
    message: `${promotable.length} murid dinaikkan, ${graduates.length} murid Tahun 6 ditandakan TAMAT${
      needsReview > 0 ? `, ${needsReview} perlu semakan kelas` : ''
    }.`,
  };
}
