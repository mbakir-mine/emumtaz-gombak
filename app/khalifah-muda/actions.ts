'use server';

import { revalidatePath } from 'next/cache';
import { KHALIFAH_MUDA_MODULE_KEY, findKhalifahMudaIndicator } from '@/lib/khalifahMuda';
import { supabase } from '@/lib/supabase';

export type KhalifahMudaActionState = {
  ok: boolean;
  message: string;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

async function ensureModuleAccess(kodSekolah: string) {
  if (!supabase) return false;
  const { data, error } = await supabase
    .from('school_module_access')
    .select('id')
    .eq('kod_sekolah', kodSekolah)
    .eq('module_key', KHALIFAH_MUDA_MODULE_KEY)
    .eq('enabled', true)
    .maybeSingle();

  return !error && Boolean(data);
}

async function ensureYearSixClass(classId: string, kodSekolah: string) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('classes')
    .select('id,kod_sekolah,tahun,tahun_akademik,status')
    .eq('id', classId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.kod_sekolah !== kodSekolah || Number(data.tahun) !== 6 || data.status !== 'AKTIF') return null;
  return data;
}

export async function createKhalifahMudaClassRecord(
  _previousState: KhalifahMudaActionState,
  formData: FormData,
): Promise<KhalifahMudaActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = readText(formData, 'kod_sekolah');
  const classId = readText(formData, 'class_id');
  const indicatorKey = readText(formData, 'indicator_key');
  const recordDate = readText(formData, 'record_date') || new Date().toISOString().slice(0, 10);
  const catatan = readText(formData, 'catatan');
  const indicator = findKhalifahMudaIndicator(indicatorKey);

  if (!kodSekolah || !classId || !indicator || indicator.kind !== 'AKTIVITI_KELAS') {
    return { ok: false, message: 'Lengkapkan sekolah, kelas Tahun 6 dan aktiviti kelas.' };
  }

  if (!(await ensureModuleAccess(kodSekolah))) {
    return { ok: false, message: 'Sekolah ini belum diberi akses Modul Khalifah Muda.' };
  }

  const classRecord = await ensureYearSixClass(classId, kodSekolah);
  if (!classRecord) {
    return { ok: false, message: 'Modul Khalifah Muda hanya untuk kelas Tahun 6 aktif.' };
  }

  const { error } = await supabase.from('khalifah_muda_records').insert({
    kod_sekolah: kodSekolah,
    class_id: classId,
    student_id: null,
    record_date: recordDate,
    record_scope: 'KELAS',
    record_kind: indicator.kind,
    domain: indicator.domain,
    indicator_key: indicator.key,
    indicator_label: indicator.label,
    points: indicator.points,
    catatan: catatan || null,
  });

  if (error) {
    return { ok: false, message: `Gagal simpan rekod kelas: ${error.message}` };
  }

  revalidatePath('/khalifah-muda');
  return { ok: true, message: 'Rekod aktiviti kelas berjaya disimpan.' };
}

export async function createKhalifahMudaStudentRecord(
  _previousState: KhalifahMudaActionState,
  formData: FormData,
): Promise<KhalifahMudaActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = readText(formData, 'kod_sekolah');
  const classId = readText(formData, 'class_id');
  const studentId = readText(formData, 'student_id');
  const indicatorKey = readText(formData, 'indicator_key');
  const recordDate = readText(formData, 'record_date') || new Date().toISOString().slice(0, 10);
  const catatan = readText(formData, 'catatan');
  const indicator = findKhalifahMudaIndicator(indicatorKey);

  if (!kodSekolah || !classId || !studentId || !indicator || indicator.kind === 'AKTIVITI_KELAS') {
    return { ok: false, message: 'Pilih murid Tahun 6 dan indikator peristiwa.' };
  }

  if (!(await ensureModuleAccess(kodSekolah))) {
    return { ok: false, message: 'Sekolah ini belum diberi akses Modul Khalifah Muda.' };
  }

  const classRecord = await ensureYearSixClass(classId, kodSekolah);
  if (!classRecord) {
    return { ok: false, message: 'Modul Khalifah Muda hanya untuk kelas Tahun 6 aktif.' };
  }

  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id,kod_sekolah,class_id,nama_murid,status')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !student || student.kod_sekolah !== kodSekolah || student.class_id !== classId) {
    return { ok: false, message: 'Murid tidak berada dalam kelas Tahun 6 pilihan.' };
  }

  const { error } = await supabase.from('khalifah_muda_records').insert({
    kod_sekolah: kodSekolah,
    class_id: classId,
    student_id: student.id,
    record_date: recordDate,
    record_scope: 'INDIVIDU',
    record_kind: indicator.kind,
    domain: indicator.domain,
    indicator_key: indicator.key,
    indicator_label: indicator.label,
    points: indicator.points,
    catatan: catatan || null,
  });

  if (error) {
    return { ok: false, message: `Gagal simpan rekod murid: ${error.message}` };
  }

  revalidatePath('/khalifah-muda');
  return { ok: true, message: `Rekod ${student.nama_murid} berjaya disimpan.` };
}
