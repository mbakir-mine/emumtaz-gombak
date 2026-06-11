'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type RphActionState = {
  ok: boolean;
  message: string;
};

function buildDraft({
  tajuk,
  standard,
  namaKelas,
  namaSubjek,
}: {
  tajuk: string;
  standard: string;
  namaKelas: string;
  namaSubjek: string;
}) {
  const fokus = standard || `Kemahiran asas berkaitan ${tajuk}`;

  return {
    objektif: [
      `Murid dapat menerangkan isi utama ${tajuk} dengan bimbingan guru.`,
      `Murid dapat menyelesaikan aktiviti ${namaSubjek} berkaitan ${tajuk} secara individu atau berkumpulan.`,
      `Murid dapat menunjukkan adab, tumpuan dan kerjasama sepanjang pembelajaran ${namaKelas}.`,
    ].join('\n'),
    aktiviti: [
      `Set induksi: Guru mengaitkan pengalaman murid dengan tajuk ${tajuk}.`,
      `Penerangan: Guru membimbing murid memahami ${fokus}.`,
      'Aktiviti kumpulan: Murid menyelesaikan tugasan ringkas dan berkongsi dapatan.',
      'Penutup: Guru membuat rumusan dan menyemak kefahaman murid.',
    ].join('\n'),
    bbm: 'Buku teks, lembaran kerja, papan putih dan bahan sokongan guru.',
    pentaksiran: 'Pemerhatian, soal jawab, semakan latihan dan maklum balas murid.',
    refleksi: 'Refleksi akan dilengkapkan selepas pengajaran berdasarkan penguasaan murid.',
  };
}

export async function createRphDraft(
  _previousState: RphActionState,
  formData: FormData,
): Promise<RphActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const tarikh = String(formData.get('tarikh') ?? '').trim();
  const tajuk = String(formData.get('tajuk') ?? '').trim();
  const standard = String(formData.get('standard_pembelajaran') ?? '').trim();
  const namaKelas = String(formData.get('nama_kelas') ?? '').trim();
  const namaSubjek = String(formData.get('nama_subjek') ?? '').trim();

  if (!kodSekolah || !classId || !kodSubjek || !tarikh || !tajuk) {
    return { ok: false, message: 'Lengkapkan sekolah, kelas, subjek, tarikh dan tajuk.' };
  }

  const draft = buildDraft({
    tajuk,
    standard,
    namaKelas: namaKelas || 'kelas dipilih',
    namaSubjek: namaSubjek || kodSubjek,
  });

  const { error } = await supabase.from('rph_records').insert({
    kod_sekolah: kodSekolah,
    class_id: classId,
    teacher_id: teacherId || null,
    kod_subjek: kodSubjek,
    tarikh,
    tajuk,
    standard_pembelajaran: standard || null,
    objektif: draft.objektif,
    aktiviti: draft.aktiviti,
    bbm: draft.bbm,
    pentaksiran: draft.pentaksiran,
    refleksi: draft.refleksi,
    ai_prompt: `Draf RPH ${namaSubjek || kodSubjek} ${namaKelas || classId}: ${tajuk}`,
    status: 'DRAF',
  });

  if (error) {
    if (error.message.includes('rph_records')) {
      return { ok: false, message: 'RPH AI belum tersedia. Jalankan SQL 024_optional_school_modules_core.sql di Supabase dahulu.' };
    }

    return { ok: false, message: `Gagal jana RPH: ${error.message}` };
  }

  revalidatePath('/rph');
  return { ok: true, message: 'Draf RPH berjaya dijana.' };
}
