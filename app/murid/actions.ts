'use server';

import { revalidatePath } from 'next/cache';
import { parseCsv, pickValue } from '@/lib/csv';
import { supabase } from '@/lib/supabase';

export type StudentActionState = {
  ok: boolean;
  message: string;
  needsConfirmation?: boolean;
};

type ClassLookupRecord = {
  id: string;
  kod_sekolah: string;
  tahun_akademik: number;
  tahun: number;
  nama_kelas: string;
};

type ParsedStudentImportRow = {
  source_line: number;
  raw_mykid: string;
  mykid: string;
  nama_murid: string;
  jantina: string;
  kod_sekolah: string;
  class_id: string;
  tahun: number;
  tahun_akademik: number;
  nama_kelas: string;
  status: string;
};

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim().toUpperCase();
}

function normalizeGender(value: string) {
  const gender = normalizeText(value);

  if (['L', 'LELAKI', 'MALE', 'M'].includes(gender)) return 'L';
  if (['P', 'PEREMPUAN', 'FEMALE', 'F'].includes(gender)) return 'P';

  return gender;
}

function normalizeMykid(value: string) {
  const mykid = value.trim();
  if (!mykid) return '';

  if (/[eE][+-]?\d+|\./.test(mykid)) return mykid;
  return mykid.replace(/\D/g, '');
}

function parseYearLevel(value: string) {
  const match = value.match(/\d+/);
  const year = Number(match?.[0] ?? 0);
  return year >= 1 && year <= 6 ? year : 0;
}

function parseAcademicYear(value: string, fallback: number) {
  const match = value.match(/\d{4}/);
  const year = Number(match?.[0] ?? value);
  return Number.isFinite(year) && year > 0 ? year : fallback;
}

function classKey(kodSekolah: string, tahun: number, namaKelas: string) {
  return `${normalizeText(kodSekolah)}|${tahun}|${normalizeText(namaKelas)}`;
}

function classAcademicKey(kodSekolah: string, tahunAkademik: number, tahun: number, namaKelas: string) {
  return `${normalizeText(kodSekolah)}|${tahunAkademik}|${tahun}|${normalizeText(namaKelas)}`;
}

function buildClassLookup(classes: ClassLookupRecord[]) {
  const lookup = new Map<string, string>();

  classes.forEach((item) => {
    lookup.set(classKey(item.kod_sekolah, Number(item.tahun), item.nama_kelas), item.id);
    lookup.set(
      classAcademicKey(item.kod_sekolah, Number(item.tahun_akademik), Number(item.tahun), item.nama_kelas),
      item.id,
    );
  });

  return lookup;
}

export async function createStudent(
  _previousState: StudentActionState,
  formData: FormData,
): Promise<StudentActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const mykid = String(formData.get('mykid') ?? '').trim();
  const namaMurid = String(formData.get('nama_murid') ?? '').trim().toUpperCase();
  const jantina = normalizeGender(String(formData.get('jantina') ?? ''));
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
  const defaultSchool = normalizeText(String(formData.get('default_kod_sekolah') ?? ''));
  const defaultStatus = normalizeText(String(formData.get('default_status') ?? 'AKTIF')) || 'AKTIF';
  const currentAcademicYear = new Date().getFullYear();

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: 'Sila pilih fail CSV murid.' };
  }

  const [{ data: classRows, error: classError }, parsed] = await Promise.all([
    supabase.from('classes').select('id,kod_sekolah,tahun_akademik,tahun,nama_kelas'),
    file.text().then(parseCsv),
  ]);

  if (classError) {
    return { ok: false, message: `Gagal semak senarai kelas: ${classError.message}` };
  }

  let classes = ((classRows ?? []) as ClassLookupRecord[]).map((item) => ({
    ...item,
    kod_sekolah: normalizeText(item.kod_sekolah),
    nama_kelas: normalizeText(item.nama_kelas),
    tahun: Number(item.tahun),
    tahun_akademik: Number(item.tahun_akademik),
  }));
  let classLookup = buildClassLookup(classes);

  const rows: ParsedStudentImportRow[] = parsed.rows
    .map((row, index) => {
      const kodSekolah = normalizeText(pickValue(row, ['kod_sekolah', 'kod sekolah', 'sekolah']) || defaultSchool);
      const classId = pickValue(row, ['class_id', 'id_kelas']);
      const tahun = parseYearLevel(pickValue(row, ['tahun', 'tahun_murid', 'tahun murid', 'darjah']));
      const tahunAkademik = parseAcademicYear(
        pickValue(row, ['tahun_akademik', 'tahun akademik', 'sesi']),
        currentAcademicYear,
      );
      const namaKelas = normalizeText(pickValue(row, ['nama_kelas', 'nama kelas', 'kelas']));
      const rawMykid = pickValue(row, ['mykid', 'my_kid', 'no_kp', 'nokp']);
      const matchedClassId =
        classId ||
        classLookup.get(classAcademicKey(kodSekolah, tahunAkademik, tahun, namaKelas)) ||
        classLookup.get(classKey(kodSekolah, tahun, namaKelas)) ||
        '';

      return {
        source_line: index + 2,
        raw_mykid: rawMykid,
        mykid: normalizeMykid(rawMykid),
        nama_murid: pickValue(row, ['nama_murid', 'nama', 'nama pelajar']).toUpperCase(),
        jantina: normalizeGender(pickValue(row, ['jantina', 'gender'])),
        kod_sekolah: kodSekolah,
        class_id: matchedClassId,
        tahun,
        tahun_akademik: tahunAkademik,
        nama_kelas: namaKelas,
        status: normalizeText(pickValue(row, ['status'])) || defaultStatus,
      };
    })
    .filter((row) => row.mykid || row.nama_murid);

  if (rows.length === 0) {
    return {
      ok: false,
      message: 'Tiada rekod sah ditemui. Pastikan header CSV ada mykid, nama_murid, jantina, kod_sekolah dan kelas.',
    };
  }

  const invalidMykids = rows.filter((row) => row.nama_murid && !/^\d{12}$/.test(row.mykid));
  if (invalidMykids.length > 0) {
    const examples = invalidMykids
      .slice(0, 5)
      .map((row) => `baris ${row.source_line}: ${row.nama_murid} (${row.raw_mykid || 'kosong'})`)
      .join(', ');

    return {
      ok: false,
      message:
        `${invalidMykids.length} rekod mempunyai MyKid tidak sah. Contoh: ${examples}. ` +
        'Pastikan kolum mykid dalam CSV ialah 12 digit dan tidak disimpan dalam format saintifik seperti 1.90531E+11.',
    };
  }

  const duplicateMykids = rows.reduce<Map<string, ParsedStudentImportRow[]>>((accumulator, row) => {
    const existing = accumulator.get(row.mykid) ?? [];
    existing.push(row);
    accumulator.set(row.mykid, existing);
    return accumulator;
  }, new Map());
  const duplicateGroups = [...duplicateMykids.entries()].filter(([, duplicateRows]) => duplicateRows.length > 1);

  if (duplicateGroups.length > 0) {
    const examples = duplicateGroups
      .slice(0, 5)
      .map(([mykid, duplicateRows]) => `${mykid} (${duplicateRows.length} kali - ${duplicateRows[0].nama_murid})`)
      .join(', ');

    return {
      ok: false,
      message:
        `CSV mengandungi ${duplicateGroups.length} MyKid berulang. ` +
        `Contoh: ${examples}. ` +
        'Semak dan buang rekod pendua dahulu supaya murid tidak dimasukkan ke kelas yang salah.',
    };
  }

  const missingClassMap = new Map<
    string,
    { kod_sekolah: string; tahun_akademik: number; tahun: number; nama_kelas: string; status: string }
  >();

  rows.forEach((row) => {
    if (row.class_id || !row.kod_sekolah || !row.tahun || !row.nama_kelas) return;
    missingClassMap.set(classAcademicKey(row.kod_sekolah, row.tahun_akademik, row.tahun, row.nama_kelas), {
      kod_sekolah: row.kod_sekolah,
      tahun_akademik: row.tahun_akademik,
      tahun: row.tahun,
      nama_kelas: row.nama_kelas,
      status: 'AKTIF',
    });
  });

  let createdClassCount = 0;
  const missingClasses = [...missingClassMap.values()];
  if (missingClasses.length > 0) {
    const { data: upsertedClasses, error: upsertClassError } = await supabase
      .from('classes')
      .upsert(missingClasses, {
        onConflict: 'kod_sekolah,tahun_akademik,tahun,nama_kelas',
      })
      .select('id,kod_sekolah,tahun_akademik,tahun,nama_kelas');

    if (upsertClassError) {
      return {
        ok: false,
        message:
          `Gagal cipta kelas daripada CSV: ${upsertClassError.message}. ` +
          'Pastikan kod_sekolah dalam CSV sudah wujud di Tetapan Sekolah.',
      };
    }

    createdClassCount = upsertedClasses?.length ?? 0;
    classes = [
      ...classes,
      ...((upsertedClasses ?? []) as ClassLookupRecord[]).map((item) => ({
        ...item,
        kod_sekolah: normalizeText(item.kod_sekolah),
        nama_kelas: normalizeText(item.nama_kelas),
        tahun: Number(item.tahun),
        tahun_akademik: Number(item.tahun_akademik),
      })),
    ];
    classLookup = buildClassLookup(classes);
    rows.forEach((row) => {
      if (row.class_id) return;
      row.class_id =
        classLookup.get(classAcademicKey(row.kod_sekolah, row.tahun_akademik, row.tahun, row.nama_kelas)) ||
        classLookup.get(classKey(row.kod_sekolah, row.tahun, row.nama_kelas)) ||
        '';
    });
  }

  const invalid = rows.find((row) => !row.jantina || !row.kod_sekolah || !row.class_id);
  if (invalid) {
    const issues = [
      !invalid.jantina ? 'jantina' : '',
      !invalid.kod_sekolah ? 'kod_sekolah' : '',
      !invalid.class_id
        ? `kelas ${invalid.kod_sekolah || '-'} Tahun ${invalid.tahun || '-'} - ${invalid.nama_kelas || '-'}`
        : '',
    ].filter(Boolean);

    return {
      ok: false,
      message:
        `Rekod ${invalid.nama_murid || invalid.mykid} tidak lengkap: ${issues.join(', ')}. ` +
        'Semak jantina, kod_sekolah, tahun dan nama_kelas.',
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

  const studentRows = rows.map(({ mykid, nama_murid, jantina, kod_sekolah, class_id, status }) => ({
    mykid,
    nama_murid,
    jantina,
    kod_sekolah,
    class_id,
    status,
  }));

  const { error } = await supabase.from('students').upsert(studentRows, {
    onConflict: 'mykid',
  });

  if (error) {
    return { ok: false, message: `Import murid gagal: ${error.message}` };
  }

  let enrollmentMessage = '';
  const classById = new Map(classes.map((item) => [item.id, item]));
  const { data: importedStudents, error: importedLookupError } = await supabase
    .from('students')
    .select('id,mykid,kod_sekolah,class_id,status')
    .in('mykid', uniqueMykids);

  if (importedLookupError) {
    enrollmentMessage = ` Rekod murid berjaya, tetapi enrolmen tahunan tidak dapat disemak: ${importedLookupError.message}`;
  } else {
    const enrollmentRows = (importedStudents ?? [])
      .map((student) => {
        const incoming = incomingByMykid.get(student.mykid);
        if (!incoming) return null;
        const classInfo = classById.get(incoming.class_id);

        return {
          student_id: student.id,
          tahun_akademik: Number(classInfo?.tahun_akademik ?? incoming.tahun_akademik),
          kod_sekolah: incoming.kod_sekolah,
          class_id: incoming.class_id,
          status: incoming.status,
          catatan: 'Import murid pukal',
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    if (enrollmentRows.length > 0) {
      const { error: enrollmentError } = await supabase.from('student_enrollments').upsert(enrollmentRows, {
        onConflict: 'student_id,tahun_akademik',
      });

      if (enrollmentError) {
        enrollmentMessage = ` Rekod murid berjaya, tetapi enrolmen tahunan tidak dikemaskini: ${enrollmentError.message}`;
      }
    }
  }

  revalidatePath('/murid');
  revalidatePath('/');
  return {
    ok: true,
    message:
      `${rows.length} murid berjaya diimport.` +
      (createdClassCount > 0 ? ` ${createdClassCount} kelas disediakan daripada CSV.` : '') +
      enrollmentMessage,
  };
}
