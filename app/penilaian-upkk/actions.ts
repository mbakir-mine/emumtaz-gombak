'use server';

import { supabase } from '@/lib/supabase';
import { calculateUpkkAmaliTotal, UPKK_AMALI_SOLAT_ITEMS } from '@/lib/upkkAmaliSolat';
import { calculateUpkkPchiTotal, UPKK_PCHI_ITEMS } from '@/lib/upkkPchi';

export type UpkkActionState = {
  ok: boolean;
  message: string;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function readScore(value: FormDataEntryValue | null, max: number) {
  const text = String(value ?? '').trim().replace(',', '.');
  if (!text) return 0;

  const score = Number(text);
  if (!Number.isFinite(score)) return null;

  return Math.min(max, Math.max(0, score));
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'Ralat tidak dijangka.';
}

type UpkkMarkPayload = {
  kod_sekolah: string;
  tahun_akademik: number;
  class_id: string;
  student_id: string;
  scores: Record<string, number>;
  jumlah: number;
  status: 'DRAF' | 'LENGKAP';
  updated_at: string;
};

async function saveUpkkMarkRecord(
  tableName: 'upkk_amali_solat_marks' | 'upkk_pchi_marks',
  payload: UpkkMarkPayload,
) {
  if (!supabase) {
    throw new Error('Supabase belum disambungkan.');
  }

  const { data: existingRecord, error: lookupError } = await supabase
    .from(tableName)
    .select('id')
    .eq('tahun_akademik', payload.tahun_akademik)
    .eq('student_id', payload.student_id)
    .maybeSingle();

  if (lookupError) {
    throw new Error(lookupError.message);
  }

  const query = existingRecord?.id
    ? supabase.from(tableName).update(payload).eq('id', existingRecord.id)
    : supabase.from(tableName).insert(payload);

  const { error } = await query;

  if (error) {
    throw new Error(error.message);
  }
}

export async function saveUpkkAmaliSolat(
  _previousState: UpkkActionState,
  formData: FormData,
): Promise<UpkkActionState> {
  try {
    return await saveUpkkAmaliSolatRecord(formData);
  } catch (error) {
    console.error('Gagal simpan UPKK Amali Solat.', error);
    return {
      ok: false,
      message: `Gagal simpan markah UPKK Amali Solat. Ralat: ${errorText(error)}`,
    };
  }
}

async function saveUpkkAmaliSolatRecord(formData: FormData): Promise<UpkkActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const kodSekolah = readText(formData, 'kod_sekolah');
  const tahunAkademik = Number(readText(formData, 'tahun_akademik'));
  const classId = readText(formData, 'class_id');
  const studentId = readText(formData, 'student_id');

  if (!kodSekolah || !tahunAkademik || !classId || !studentId) {
    return { ok: false, message: 'Lengkapkan sekolah, tahun, kelas dan murid.' };
  }

  const { data: classRow, error: classError } = await supabase
    .from('classes')
    .select('id,kod_sekolah,tahun_akademik,tahun')
    .eq('id', classId)
    .maybeSingle();

  if (classError || !classRow) {
    return { ok: false, message: 'Kelas tidak dijumpai.' };
  }

  if (classRow.kod_sekolah !== kodSekolah || Number(classRow.tahun_akademik) !== tahunAkademik) {
    return { ok: false, message: 'Maklumat kelas tidak sepadan dengan pilihan.' };
  }

  if (Number(classRow.tahun) !== 5) {
    return { ok: false, message: 'Penilaian UPKK hanya untuk murid Tahun 5.' };
  }

  const { data: studentRow, error: studentError } = await supabase
    .from('students')
    .select('mykid,kod_sekolah,class_id,status')
    .eq('mykid', studentId)
    .maybeSingle();

  if (studentError || !studentRow) {
    return { ok: false, message: 'Murid tidak dijumpai.' };
  }

  if (studentRow.kod_sekolah !== kodSekolah || studentRow.class_id !== classId) {
    return { ok: false, message: 'Murid tidak berada dalam kelas pilihan.' };
  }

  const scores: Record<string, number> = {};

  for (const item of UPKK_AMALI_SOLAT_ITEMS) {
    const score = readScore(formData.get(`score_${item.code}`), item.max);
    if (score === null) {
      return { ok: false, message: `Markah ${item.code} tidak sah.` };
    }
    scores[item.code] = score;
  }

  const jumlah = calculateUpkkAmaliTotal(scores);
  try {
    await saveUpkkMarkRecord('upkk_amali_solat_marks', {
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik,
      class_id: classId,
      student_id: studentId,
      scores,
      jumlah,
      status: jumlah > 0 ? 'LENGKAP' : 'DRAF',
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return {
      ok: false,
      message: `Gagal simpan markah UPKK Amali Solat. Ralat: ${errorText(error)}`,
    };
  }

  return { ok: true, message: 'Markah UPKK Amali Solat berjaya disimpan.' };
}

export async function saveUpkkPchi(
  _previousState: UpkkActionState,
  formData: FormData,
): Promise<UpkkActionState> {
  try {
    return await saveUpkkPchiRecord(formData);
  } catch (error) {
    console.error('Gagal simpan UPKK PCHI.', error);
    return {
      ok: false,
      message: `Gagal simpan markah UPKK PCHI. Ralat: ${errorText(error)}`,
    };
  }
}

async function saveUpkkPchiRecord(formData: FormData): Promise<UpkkActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const kodSekolah = readText(formData, 'kod_sekolah');
  const tahunAkademik = Number(readText(formData, 'tahun_akademik'));
  const classId = readText(formData, 'class_id');
  const studentId = readText(formData, 'student_id');

  if (!kodSekolah || !tahunAkademik || !classId || !studentId) {
    return { ok: false, message: 'Lengkapkan sekolah, tahun, kelas dan murid.' };
  }

  const { data: classRow, error: classError } = await supabase
    .from('classes')
    .select('id,kod_sekolah,tahun_akademik,tahun')
    .eq('id', classId)
    .maybeSingle();

  if (classError || !classRow) {
    return { ok: false, message: 'Kelas tidak dijumpai.' };
  }

  if (classRow.kod_sekolah !== kodSekolah || Number(classRow.tahun_akademik) !== tahunAkademik) {
    return { ok: false, message: 'Maklumat kelas tidak sepadan dengan pilihan.' };
  }

  if (Number(classRow.tahun) !== 5) {
    return { ok: false, message: 'Penilaian UPKK hanya untuk murid Tahun 5.' };
  }

  const { data: studentRow, error: studentError } = await supabase
    .from('students')
    .select('mykid,kod_sekolah,class_id,status')
    .eq('mykid', studentId)
    .maybeSingle();

  if (studentError || !studentRow) {
    return { ok: false, message: 'Murid tidak dijumpai.' };
  }

  if (studentRow.kod_sekolah !== kodSekolah || studentRow.class_id !== classId) {
    return { ok: false, message: 'Murid tidak berada dalam kelas pilihan.' };
  }

  const scores: Record<string, number> = {};

  for (const item of UPKK_PCHI_ITEMS) {
    const score = readScore(formData.get(`score_${item.code}`), item.max);
    if (score === null) {
      return { ok: false, message: `Markah ${item.code} tidak sah.` };
    }
    scores[item.code] = score;
  }

  const jumlah = calculateUpkkPchiTotal(scores);
  try {
    await saveUpkkMarkRecord('upkk_pchi_marks', {
      kod_sekolah: kodSekolah,
      tahun_akademik: tahunAkademik,
      class_id: classId,
      student_id: studentId,
      scores,
      jumlah,
      status: jumlah > 0 ? 'LENGKAP' : 'DRAF',
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    return {
      ok: false,
      message: `Gagal simpan markah UPKK PCHI. Ralat: ${errorText(error)}`,
    };
  }

  return { ok: true, message: 'Markah UPKK PCHI berjaya disimpan.' };
}
