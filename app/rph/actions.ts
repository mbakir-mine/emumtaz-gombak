'use server';

import { revalidatePath } from 'next/cache';
import { generateRphContent, isRphPedagogy, isRphStatus, reviewRphQuality, type RphDraftContent } from '@/lib/rph';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

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
}: {
  classId: string;
  kodSekolah: string;
  kodSubjek: string;
}) {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (selfHostedUrl) {
    const cookieHeader = (await cookies()).toString();
    const [classesResponse, subjectsResponse] = await Promise.all([
      fetch(`${selfHostedUrl}/api/classes`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
      fetch(`${selfHostedUrl}/api/subjects`, { headers: { Cookie: cookieHeader }, cache: 'no-store' }),
    ]);
    const classesPayload = await classesResponse.json().catch(() => null) as { data?: Array<Record<string, unknown>> } | null;
    const subjectsPayload = await subjectsResponse.json().catch(() => null) as { data?: Array<Record<string, unknown>> } | null;
    const classRow = classesPayload?.data?.find((row) => String(row.id) === classId);
    const subjectRow = subjectsPayload?.data?.find((row) => String(row.kod_subjek) === kodSubjek);
    if (!classesResponse.ok || !classRow || String(classRow.kod_sekolah) !== kodSekolah || String(classRow.status) !== 'AKTIF') return { ok: false as const, message: 'Kelas tidak sah atau anda tiada akses untuk kelas ini.' };
    if (!subjectsResponse.ok || !subjectRow || String(subjectRow.status) !== 'AKTIF') return { ok: false as const, message: 'Mata pelajaran tidak sah atau tidak aktif.' };
    return { ok: true as const, selfHostedUrl, namaKelas: `Tahun ${classRow.tahun} - ${classRow.nama_kelas}`, namaSubjek: String(subjectRow.nama_subjek ?? kodSubjek) };
  }
  return { ok: false as const, message: 'Backend Laravel belum disambungkan.' };
}

export async function generateAiRphDraft(formData: FormData): Promise<AiRphActionState> {
  const kodSekolah = readText(formData, 'kod_sekolah', 32);
  const classId = readText(formData, 'class_id', 64);
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

  const reference = await validateReferences({ classId, kodSekolah, kodSubjek });
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
      message: `RPH pintar berjaya dijana. Skor semakan kualiti: ${fallbackReview.score}%.`,
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

  const reference = await validateReferences({ classId, kodSekolah, kodSubjek });
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

  if ('selfHostedUrl' in reference) {
    const response = await fetch(`${reference.selfHostedUrl}/api/rph`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ ...payload, id: recordId || undefined }), cache: 'no-store' });
    if (!response.ok) return fail('Gagal simpan RPH pada backend Laravel.');
    revalidatePath('/rph');
    return { ok: true, message: recordId ? 'RPH berjaya dikemas kini.' : 'RPH berjaya disimpan dalam koleksi.' };
  }

  return fail('Backend Laravel belum disambungkan.');
}

export async function updateRphStatus(recordId: string, status: string): Promise<RphActionState> {
  if (!recordId || !isRphStatus(status)) return fail('Permintaan status tidak sah.');
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (selfHostedUrl) {
    const response = await fetch(`${selfHostedUrl}/api/rph/${recordId}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ status }), cache: 'no-store' });
    if (!response.ok) return fail('Gagal mengemas kini status RPH.');
    revalidatePath('/rph');
    return { ok: true, message: status === 'SELESAI' ? 'RPH ditandakan selesai.' : 'Status RPH berjaya dikemas kini.' };
  }
  return fail('Backend Laravel belum disambungkan.');
}

export async function deleteRphDraft(recordId: string): Promise<RphActionState> {
  if (!recordId) return fail('RPH tidak sah.');
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (selfHostedUrl) {
    const response = await fetch(`${selfHostedUrl}/api/rph/${recordId}`, { method: 'DELETE', headers: { Cookie: (await cookies()).toString() }, cache: 'no-store' });
    if (!response.ok) return fail('RPH tidak dapat dipadam.');
    revalidatePath('/rph');
    return { ok: true, message: 'RPH telah dipadam.' };
  }
  return fail('Backend Laravel belum disambungkan.');
}

export const createRphDraft = saveRphDraft;
