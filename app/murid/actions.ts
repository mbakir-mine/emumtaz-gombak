'use server';

import { revalidatePath } from 'next/cache';
import { parseCsv, pickValue } from '@/lib/csv';
import { supabase } from '@/lib/supabase';

export type StudentActionState = {
  ok: boolean;
  message: string;
  needsConfirmation?: boolean;
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
  const confirmTransfer = String(formData.get('confirm_transfer') ?? '') === 'YA';

  if (!mykid || !namaMurid || !jantina || !kodSekolah || !classId) {
    return { ok: false, message: 'Lengkapkan semua medan murid.' };
  }

  const { data: existingStudent, error: lookupError } = await supabase
    .from('students')
    .select('id,mykid,nama_murid,jantina,kod_sekolah,class_id,status')
    .eq('mykid', mykid)
    .maybeSingle();

  if (lookupError) {
    return { ok: false, message: `Gagal semak MyKid: ${lookupError.message}` };
  }

  if (existingStudent) {
    const isTransfer = existingStudent.kod_sekolah !== kodSekolah || existingStudent.class_id !== classId;

    if (isTransfer && !confirmTransfer) {
      return {
        ok: false,
        needsConfirmation: true,
        message:
          `MyKid ini telah didaftarkan kepada ${existingStudent.nama_murid} ` +
          `di sekolah ${existingStudent.kod_sekolah}. ` +
          `Jika benar murid ini berpindah dalam Daerah Gombak, klik SAHKAN PINDAH untuk pindahkan ke ${kodSekolah}.`,
      };
    }

    const { error } = await supabase
      .from('students')
      .update({
        nama_murid: namaMurid,
        jantina,
        kod_sekolah: kodSekolah,
        class_id: classId,
        status: 'AKTIF',
      })
      .eq('id', existingStudent.id);

    if (error) {
      return { ok: false, message: `Gagal simpan murid: ${error.message}` };
    }

    if (isTransfer) {
      await supabase.from('student_transfer_logs').insert({
        student_id: existingStudent.id,
        mykid,
        nama_murid: namaMurid,
        from_kod_sekolah: existingStudent.kod_sekolah,
        to_kod_sekolah: kodSekolah,
        from_class_id: existingStudent.class_id,
        to_class_id: classId,
        transfer_type: 'DALAM_DAERAH',
      });
    }

    revalidatePath('/murid');
    revalidatePath('/');
    return {
      ok: true,
      message: isTransfer
        ? `${namaMurid} berjaya dipindahkan ke ${kodSekolah}.`
        : `${namaMurid} berjaya dikemaskini.`,
    };
  }

  const { error } = await supabase.from('students').insert({
    mykid,
    nama_murid: namaMurid,
    jantina,
    kod_sekolah: kodSekolah,
    class_id: classId,
    status: 'AKTIF',
  });

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

  const uniqueMykids = [...new Set(rows.map((row) => row.mykid))];
  const { data: existingRows, error: existingError } = await supabase
    .from('students')
    .select('mykid,nama_murid,kod_sekolah,class_id')
    .in('mykid', uniqueMykids);

  if (existingError) {
    return { ok: false, message: `Gagal semak MyKid sedia ada: ${existingError.message}` };
  }

  const incomingByMykid = new Map(rows.map((row) => [row.mykid, row]));
  const transferConflicts = (existingRows ?? []).filter((existing) => {
    const incoming = incomingByMykid.get(existing.mykid);
    if (!incoming) return false;
    return existing.kod_sekolah !== incoming.kod_sekolah || existing.class_id !== incoming.class_id;
  });

  if (transferConflicts.length > 0) {
    const first = transferConflicts[0];
    return {
      ok: false,
      message:
        `${transferConflicts.length} MyKid sudah wujud di sekolah/kelas lain. ` +
        `Contoh: ${first.mykid} - ${first.nama_murid} di ${first.kod_sekolah}. ` +
        'Sila pindahkan murid tersebut melalui borang Tambah Murid supaya admin boleh sahkan pemilik MyKid.',
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
