'use server';

import { revalidatePath } from 'next/cache';
import { calculateSahsiahIhab, parseSahsiahIhabInput } from '@/lib/sahsiahIhab';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type SahsiahIhabActionState = { ok: boolean; message: string };

const text = (formData: FormData, key: string) => String(formData.get(key) ?? '').trim();

export async function saveSahsiahIhabAssessment(
  _previousState: SahsiahIhabActionState,
  formData: FormData,
): Promise<SahsiahIhabActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const kodSekolah = text(formData, 'kod_sekolah');
  const classId = text(formData, 'class_id');
  const studentId = text(formData, 'student_id');
  const tahunAkademik = Number(formData.get('tahun_akademik') ?? new Date().getFullYear());
  const bulan = Number(formData.get('bulan') ?? new Date().getMonth() + 1);

  if (!kodSekolah || !classId || !studentId || !Number.isInteger(tahunAkademik) || !Number.isInteger(bulan) || bulan < 1 || bulan > 12) {
    return { ok: false, message: 'Sekolah, kelas, murid, tahun dan bulan diperlukan.' };
  }

  let input;
  try {
    input = parseSahsiahIhabInput({
      m3Raw: formData.get('m3_raw'),
      m4: formData.get('m4'),
      m5: formData.get('m5'),
      m6: formData.get('m6'),
    });
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'Markah M1-M6 tidak sah.' };
  }

  const result = calculateSahsiahIhab(input);
  if (selfHostedUrl) {
    const response = await fetch(`${selfHostedUrl}/api/character/sahsiah-ihab`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() },
      body: JSON.stringify({
        kod_sekolah: kodSekolah, tahun_akademik: tahunAkademik, bulan, class_id: classId, student_id: studentId,
        m1_confirmed: formData.get('m1_confirmed') === 'on', m2_confirmed: formData.get('m2_confirmed') === 'on',
        m3_raw: input.m3Raw, m3_percent: result.m3Percent, m4: input.m4, m5: input.m5, m6: input.m6,
        total_score: result.totalScore, grade: result.grade, band: result.band, status: 'DRAF', catatan: text(formData, 'catatan') || null,
      }),
      cache: 'no-store',
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { message?: string } | null;
      return { ok: false, message: payload?.message ?? 'Gagal menyimpan pentaksiran.' };
    }
    revalidatePath('/sahsiah-ihab');
    revalidatePath('/khalifah-muda');
    return { ok: true, message: `Pentaksiran disimpan: ${result.grade} (Band ${result.band}), skor ${result.totalScore}.` };
  }
  revalidatePath('/sahsiah-ihab');
  revalidatePath('/khalifah-muda');
  return { ok: true, message: `Pentaksiran disimpan: ${result.grade} (Band ${result.band}), skor ${result.totalScore}.` };
}
