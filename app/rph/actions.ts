'use server';

import { revalidatePath } from 'next/cache';
import { generateRphContent, isRphPedagogy, isRphStatus } from '@/lib/rph';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export type RphActionState = { ok: boolean; message: string };

const MAX_TEXT = 8000;

function readText(formData: FormData, key: string, maxLength = MAX_TEXT) {
  return String(formData.get(key) ?? '').trim().slice(0, maxLength);
}

function fail(message: string): RphActionState {
  return { ok: false, message };
}

async function validateReferences({
  classId,
  kodSekolah,
  kodSubjek,
  teacherId,
}: {
  classId: string;
  kodSekolah: string;
  kodSubjek: string;
  teacherId: string;
}) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return { ok: false as const, message: 'Supabase belum disambungkan.' };

  const [classResult, subjectResult, teacherResult] = await Promise.all([
    supabase.from('classes').select('id,kod_sekolah,tahun,nama_kelas,status').eq('id', classId).maybeSingle(),
    supabase.from('subjects').select('kod_subjek,nama_subjek,status').eq('kod_subjek', kodSubjek).maybeSingle(),
    teacherId
      ? supabase.from('app_users').select('id,nama,kod_sekolah,status').eq('id', teacherId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (classResult.error || !classResult.data || classResult.data.kod_sekolah !== kodSekolah || classResult.data.status !== 'AKTIF') {
    return { ok: false as const, message: 'Kelas tidak sah atau anda tiada akses untuk kelas ini.' };
  }
  if (subjectResult.error || !subjectResult.data || subjectResult.data.status !== 'AKTIF') {
    return { ok: false as const, message: 'Mata pelajaran tidak sah atau tidak aktif.' };
  }
  if (teacherId && (teacherResult.error || !teacherResult.data || teacherResult.data.status !== 'AKTIF' || teacherResult.data.kod_sekolah !== kodSekolah)) {
    return { ok: false as const, message: 'Guru yang dipilih tidak sah untuk sekolah ini.' };
  }

  return {
    ok: true as const,
    supabase,
    namaKelas: `Tahun ${classResult.data.tahun} - ${classResult.data.nama_kelas}`,
    namaSubjek: subjectResult.data.nama_subjek,
  };
}

export async function saveRphDraft(_previousState: RphActionState, formData: FormData): Promise<RphActionState> {
  const recordId = readText(formData, 'record_id', 64);
  const kodSekolah = readText(formData, 'kod_sekolah', 32);
  const classId = readText(formData, 'class_id', 64);
  const teacherId = readText(formData, 'teacher_id', 64);
  const kodSubjek = readText(formData, 'kod_subjek', 32);
  const tarikh = readText(formData, 'tarikh', 10);
  const tajuk = readText(formData, 'tajuk', 200);
  const standard = readText(formData, 'standard_pembelajaran', 2000);
  const pedagogiInput = readText(formData, 'pedagogi', 24);
  const pedagogi = isRphPedagogy(pedagogiInput) ? pedagogiInput : 'KOLABORATIF';
  const tempoh = Math.min(120, Math.max(20, Number(readText(formData, 'tempoh', 3)) || 60));
  const tahapMurid = readText(formData, 'tahap_murid', 300);
  const emk = readText(formData, 'emk', 500);

  if (!kodSekolah || !classId || !kodSubjek || !/^\d{4}-\d{2}-\d{2}$/.test(tarikh) || !tajuk) {
    return fail('Lengkapkan sekolah, kelas, subjek, tarikh dan tajuk.');
  }

  const reference = await validateReferences({ classId, kodSekolah, kodSubjek, teacherId });
  if (!reference.ok) return fail(reference.message);

  const generated = generateRphContent({
    tajuk,
    standard,
    namaKelas: reference.namaKelas,
    namaSubjek: reference.namaSubjek,
    tempoh,
    pedagogi,
    tahapMurid,
    emk,
  });
  const payload = {
    kod_sekolah: kodSekolah,
    class_id: classId,
    teacher_id: teacherId || null,
    kod_subjek: kodSubjek,
    tarikh,
    tajuk,
    standard_pembelajaran: standard || null,
    objektif: readText(formData, 'objektif') || generated.objektif,
    aktiviti: readText(formData, 'aktiviti') || generated.aktiviti,
    bbm: readText(formData, 'bbm', 3000) || generated.bbm,
    pentaksiran: readText(formData, 'pentaksiran', 3000) || generated.pentaksiran,
    refleksi: readText(formData, 'refleksi', 3000) || generated.refleksi,
    ai_prompt: `${reference.namaSubjek} | ${reference.namaKelas} | ${tempoh} minit | ${pedagogi} | ${tajuk}`,
    status: readText(formData, 'status', 16) === 'SEDIA' ? 'SEDIA' : 'DRAF',
  };

  const query = recordId
    ? reference.supabase.from('rph_records').update(payload).eq('id', recordId).eq('kod_sekolah', kodSekolah).select('id').maybeSingle()
    : reference.supabase.from('rph_records').insert(payload).select('id').single();
  const { data: savedRecord, error } = await query;

  if (error) {
    if (error.message.includes('rph_records')) {
      return fail('Modul RPH belum tersedia. Jalankan migrasi pangkalan data modul sekolah dahulu.');
    }
    return fail(`Gagal simpan RPH: ${error.message}`);
  }
  if (!savedRecord) return fail('RPH tidak ditemui atau anda tiada kebenaran untuk mengemas kininya.');

  revalidatePath('/rph');
  return { ok: true, message: recordId ? 'RPH berjaya dikemas kini.' : 'RPH berjaya disimpan dalam koleksi.' };
}

export async function updateRphStatus(recordId: string, status: string): Promise<RphActionState> {
  if (!recordId || !isRphStatus(status)) return fail('Permintaan status tidak sah.');
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fail('Supabase belum disambungkan.');
  const { data: record, error: readError } = await supabase.from('rph_records').select('id').eq('id', recordId).maybeSingle();
  if (readError || !record) return fail('RPH tidak ditemui atau anda tiada akses.');
  const { data: updatedRecord, error } = await supabase.from('rph_records').update({ status }).eq('id', record.id).select('id').maybeSingle();
  if (error) return fail(`Gagal mengemas kini status: ${error.message}`);
  if (!updatedRecord) return fail('Status tidak berubah kerana anda tiada kebenaran mengemas kini RPH ini.');
  revalidatePath('/rph');
  return { ok: true, message: status === 'SELESAI' ? 'RPH ditandakan selesai.' : 'Status RPH berjaya dikemas kini.' };
}

export async function deleteRphDraft(recordId: string): Promise<RphActionState> {
  if (!recordId) return fail('RPH tidak sah.');
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fail('Supabase belum disambungkan.');
  const { data: record, error: readError } = await supabase.from('rph_records').select('id').eq('id', recordId).maybeSingle();
  if (readError || !record) return fail('RPH tidak ditemui atau anda tiada akses.');
  const { data: deletedRecord, error } = await supabase.from('rph_records').delete().eq('id', record.id).select('id').maybeSingle();
  if (error) return fail('RPH tidak dapat dipadam. Hanya pentadbir sekolah dibenarkan memadam rekod.');
  if (!deletedRecord) return fail('RPH tidak dipadam kerana anda tiada kebenaran pentadbir.');
  revalidatePath('/rph');
  return { ok: true, message: 'RPH telah dipadam.' };
}

export const createRphDraft = saveRphDraft;
