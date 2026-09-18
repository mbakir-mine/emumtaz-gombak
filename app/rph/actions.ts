'use server';

import { revalidatePath } from 'next/cache';
import { generateRphContent, isRphPedagogy, isRphStatus, reviewRphQuality, type RphDraftContent } from '@/lib/rph';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export type RphActionState = { ok: boolean; message: string };
export type AiRphActionState = RphActionState & Partial<RphDraftContent> & {
  qualityScore?: number;
  qualityNotes?: string[];
  source?: 'AI' | 'TEMPLATE';
};

const MAX_TEXT = 8000;

function readText(formData: FormData, key: string, maxLength = MAX_TEXT) {
  return String(formData.get(key) ?? '').trim().slice(0, maxLength);
}

function fail(message: string): RphActionState {
  return { ok: false, message };
}

function cleanGeneratedText(value: unknown, maxLength = MAX_TEXT) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function parseAiContent(value: unknown, fallback: RphDraftContent): RphDraftContent {
  const source = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
  return {
    objektif: cleanGeneratedText(source.objektif) || fallback.objektif,
    aktiviti: cleanGeneratedText(source.aktiviti) || fallback.aktiviti,
    bbm: cleanGeneratedText(source.bbm, 3000) || fallback.bbm,
    pentaksiran: cleanGeneratedText(source.pentaksiran, 3000) || fallback.pentaksiran,
    refleksi: cleanGeneratedText(source.refleksi, 3000) || fallback.refleksi,
  };
}

type OpenAiOutputContent = { type?: string; text?: string };
type OpenAiOutputItem = { content?: OpenAiOutputContent[] };
type OpenAiResponsePayload = {
  output_text?: string;
  output?: OpenAiOutputItem[];
};

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

export async function generateAiRphDraft(formData: FormData): Promise<AiRphActionState> {
  const kodSekolah = readText(formData, 'kod_sekolah', 32);
  const classId = readText(formData, 'class_id', 64);
  const teacherId = readText(formData, 'teacher_id', 64);
  const kodSubjek = readText(formData, 'kod_subjek', 32);
  const tajuk = readText(formData, 'tajuk', 200);
  const standard = readText(formData, 'standard_pembelajaran', 3000);
  const pedagogiInput = readText(formData, 'pedagogi', 24);
  const pedagogi = isRphPedagogy(pedagogiInput) ? pedagogiInput : 'KOLABORATIF';
  const tempoh = Math.min(120, Math.max(20, Number(readText(formData, 'tempoh', 3)) || 60));
  const tahapMurid = readText(formData, 'tahap_murid', 300);
  const emk = readText(formData, 'emk', 500);

  if (!kodSekolah || !classId || !kodSubjek || !tajuk) {
    return { ok: false, message: 'Pilih sekolah, kelas, subjek dan tajuk sebelum menjana RPH AI.' };
  }

  const reference = await validateReferences({ classId, kodSekolah, kodSubjek, teacherId });
  if (!reference.ok) return { ok: false, message: reference.message };

  const input = {
    tajuk,
    standard,
    namaKelas: reference.namaKelas,
    namaSubjek: reference.namaSubjek,
    tempoh,
    pedagogi,
    tahapMurid,
    emk,
  };
  const fallback = generateRphContent(input);
  const fallbackReview = reviewRphQuality(input, fallback);
  const aiProvider = process.env.OPENAI_RPH_PROVIDER?.trim().toLowerCase();
  const apiKey = aiProvider === 'openai' ? process.env.OPENAI_API_KEY?.trim() : '';
  const model = process.env.OPENAI_RPH_MODEL?.trim() || 'gpt-5';

  if (!apiKey) {
    return {
      ok: true,
      ...fallback,
      qualityScore: fallbackReview.score,
      qualityNotes: fallbackReview.notes,
      source: 'TEMPLATE',
      message: `Mod 0 kos aktif. Sistem menjana RPH pintar tempatan tanpa caj API. Skor semakan: ${fallbackReview.score}%.`,
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: [
                  'Anda ialah pembantu akademik e-RPH JAIS untuk guru Sekolah Rendah Agama.',
                  'Hasilkan RPH praktikal, ringkas, boleh terus disunting, dan selari dengan standard DSKP yang diberi.',
                  'Jangan cipta standard baharu. Jika standard ringkas, kekalkan fokus pada tajuk dan nyatakan aktiviti yang boleh ditaksir.',
                  'Gunakan Bahasa Melayu profesional. Jangan masukkan data peribadi murid.',
                ].join(' '),
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: [
                  `Kelas: ${reference.namaKelas}`,
                  `Subjek: ${reference.namaSubjek}`,
                  `Tajuk: ${tajuk}`,
                  `Standard DSKP: ${standard || 'Tiada standard khusus diberi; bina berdasarkan tajuk sahaja.'}`,
                  `Tempoh: ${tempoh} minit`,
                  `Pedagogi pilihan: ${pedagogi}`,
                  `Tahap/keperluan murid: ${tahapMurid || 'pelbagai tahap penguasaan'}`,
                  `EMK/nilai/PAK21: ${emk || 'Nilai murni, komunikasi dan kreativiti'}`,
                  'Syarat kualiti: objektif mesti boleh diukur, aktiviti perlu ada agihan minit, pentaksiran perlu ada evidens, dan mesti ada pembezaan/pemulihan/pengayaan.',
                ].join('\n'),
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'erph_jais_draft',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              properties: {
                objektif: { type: 'string' },
                kriteria_kejayaan: { type: 'string' },
                aktiviti: { type: 'string' },
                bbm: { type: 'string' },
                pentaksiran: { type: 'string' },
                refleksi: { type: 'string' },
              },
              required: ['objektif', 'kriteria_kejayaan', 'aktiviti', 'bbm', 'pentaksiran', 'refleksi'],
            },
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API ${response.status}`);
    }

    const result = await response.json() as OpenAiResponsePayload;
    const outputText = typeof result.output_text === 'string'
      ? result.output_text
      : result.output?.flatMap((item) => item.content ?? []).find((item) => item.type === 'output_text')?.text;

    if (!outputText) throw new Error('Respons AI kosong.');
    const parsed = parseAiContent(JSON.parse(outputText), fallback);
    const review = reviewRphQuality(input, parsed);

    return {
      ok: true,
      ...parsed,
      qualityScore: review.score,
      qualityNotes: review.notes,
      source: 'AI',
      message: review.score >= 80
        ? `RPH AI berjaya dijana dan lulus semakan kualiti (${review.score}%).`
        : `RPH AI berjaya dijana. Sila semak nota kualiti sebelum simpan (${review.score}%). ${review.notes.join(' ')}`,
    };
  } catch {
    return {
      ok: true,
      ...fallback,
      qualityScore: fallbackReview.score,
      qualityNotes: fallbackReview.notes,
      source: 'TEMPLATE',
      message: `AI luaran tidak dapat digunakan buat masa ini. Sistem menjana template sandaran. Skor semakan: ${fallbackReview.score}%.`,
    };
  }
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
