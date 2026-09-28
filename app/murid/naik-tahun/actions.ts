'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type PromotionActionState = { ok: boolean; message: string };

export async function promoteStudents(
  _previousState: PromotionActionState,
  formData: FormData,
): Promise<PromotionActionState> {
  const sourceYear = Number(formData.get('source_year'));
  const targetYear = Number(formData.get('target_year'));
  if (!sourceYear || !targetYear || targetYear <= sourceYear) {
    return { ok: false, message: 'Pilih tahun asal dan tahun baharu yang sah.' };
  }

  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend self-hosted belum dikonfigurasi.' };

  const studentIds = formData.getAll('selected_student_ids').map(String);
  if (studentIds.length === 0) return { ok: false, message: 'Pilih sekurang-kurangnya seorang murid untuk diproses.' };

  const targetClassIds = studentIds.map((studentId) => {
    const value = String(formData.get(`target_class_id__${studentId}`) ?? '').trim();
    return value && !value.startsWith('NEW__') ? value : null;
  });

  const response = await fetch(`${selfHostedUrl}/api/enrollments/promote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() },
    body: JSON.stringify({ source_year: sourceYear, target_year: targetYear, student_ids: studentIds, target_class_ids: targetClassIds }),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return { ok: false, message: result.message ?? `Gagal proses naik tahun (${response.status}).` };

  revalidatePath('/murid/naik-tahun');
  revalidatePath('/murid');
  revalidatePath('/');
  return {
    ok: true,
    message: `${result.promoted ?? 0} murid dinaikkan, ${result.graduates ?? 0} murid Tahun 6 ditandakan TAMAT${result.needs_review ? `, ${result.needs_review} perlu semakan kelas` : ''}.`,
  };
}
