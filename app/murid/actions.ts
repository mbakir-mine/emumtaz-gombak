'use server';

import { revalidatePath } from 'next/cache';
import { parseCsv, pickValue } from '@/lib/csv';
import { supabase } from '@/lib/supabase';

export type StudentActionState = {
  ok: boolean;
  message: string;
};

export async function createStudent(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const mykid = String(formData.get('mykid') ?? '').trim();
  const namaMurid = String(formData.get('nama_murid') ?? '').trim().toUpperCase();
  const jantina = String(formData.get('jantina') ?? '').trim();
  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();

  if (!mykid || !namaMurid || !jantina || !kodSekolah || !classId) {
    return { ok: false, message: 'Lengkapkan semua medan murid.' };
  }

  const { error } = await supabase.from('students').upsert(
    {
      mykid,
      nama_murid: namaMurid,
      jantina,
      kod_sekolah: kodSekolah,
      class_id: classId,
      status: 'AKTIF',
    },
    {
      onConflict: 'mykid',
    },
  );

  if (error) {
    return { ok: false, message: `Gagal simpan murid: ${error.message}` };
  }

  revalidatePath('/murid');
  revalidatePath('/');
  return { ok: true, message: `${namaMurid} berjaya disimpan.` };
}

export async function importStudents(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const file = formData.get('csv_file');
  const defaultSchool = String(formData.get('default_kod_sekolah') ?? '').trim().toUpperCase();
  const defaultStatus = String(formData.get('default_status') ?? 'AKTIF').trim().toUpperCase();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Sila pilih fail CSV murid.' };
  }

  const [{ data: classes }, parsed] = await Promise.all([
    supabase.from('classes').select('id,kod_sekolah,tahun_akademik,tahun,nama_kelas'),
    file.text().then(parseCsv),
  ]);

  const classLookup = new Map<string, string>();
  (classes ?? []).forEach((item: any) => {
    classLookup.set(`${item.kod_sekolah}|${item.tahun}|${item.nama_kelas}`.toUpperCase(), item.id);
    classLookup.set(`${item.kod_sekolah}|${item.tahun_akademik}|${item.tahun}|${item.nama_kelas}`.toUpperCase(), item.id);
  });

  const rows = parsed.rows
    .map((row) => {
      const kodSekolah = (pickValue(row, ['kod_sekolah', 'kod sekolah', 'sekolah']) || defaultSchool).toUpperCase();
      const classId = pickValue(row, ['class_id', 'id_kelas']);
      const tahun = pickValue(row, ['tahun']);
      const tahunAkademik = pickValue(row, ['tahun_akademik', 'tahun akademik']);
      const namaKelas = pickValue(row, ['nama_kelas', 'kelas']).toUpperCase();
      const matchedClassId =
        classId ||
        classLookup.get(`${kodSekolah}|${tahun}|${namaKelas}`.toUpperCase()) ||
        classLookup.get(`${kodSekolah}|${tahunAkademik}|${tahun}|${namaKelas}`.toUpperCase()) ||
        '';

      return {
        mykid: pickValue(row, ['mykid', 'my_kid', 'no_kp', 'nokp']),
        nama_murid: pickValue(row, ['nama_murid', 'nama', 'nama pelajar']).toUpperCase(),
        jantina: pickValue(row, ['jantina']).toUpperCase(),
        kod_sekolah: kodSekolah,
        class_id: matchedClassId,
        status: pickValue(row, ['status']).toUpperCase() || defaultStatus,
      };
    })
    .filter((row) => row.mykid && row.nama_murid);

  if (rows.length === 0) {
    return {
      ok: false,
      message: 'Tiada rekod sah ditemui. Pastikan header CSV ada mykid, nama_murid, jantina, kod_sekolah dan kelas.',
    };
  }

  const invalid = rows.find((row) => !row.jantina || !row.kod_sekolah || !row.class_id);
  if (invalid) {
    return {
      ok: false,
      message: `Rekod ${invalid.nama_murid || invalid.mykid} tidak lengkap. Semak jantina, kod_sekolah atau nama_kelas/tahun.`,
    };
  }

  const { error } = await supabase.from('students').upsert(rows, {
    onConflict: 'mykid',
  });

  if (error) {
    return { ok: false, message: `Import murid gagal: ${error.message}` };
  }

  revalidatePath('/murid');
  revalidatePath('/');
  return { ok: true, message: `${rows.length} murid berjaya diimport.` };
}
