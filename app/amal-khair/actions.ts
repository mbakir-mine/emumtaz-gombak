'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type AmalKhairActionState = {
  ok: boolean;
  message: string;
};

export async function createAmalKhairRecord(
  _previousState: AmalKhairActionState,
  formData: FormData,
): Promise<AmalKhairActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

  const studentId = String(formData.get('student_id') ?? '').trim();
  const categoryId = String(formData.get('category_id') ?? '').trim();
  const mata = Number(formData.get('mata') ?? 0);
  const catatan = String(formData.get('catatan') ?? '').trim();

  if (!studentId || !categoryId || !mata) {
    return { ok: false, message: 'Pilih murid, kategori dan mata Amal Khair.' };
  }

  const response = await fetch(`${selfHostedUrl}/api/amal-khair`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() },
    body: JSON.stringify({ student_id: studentId, category_id: categoryId, mata, catatan: catatan || null }), cache: 'no-store',
  });
  if (!response.ok) return { ok: false, message: 'Gagal simpan Amal Khair pada backend Laravel.' };
  revalidatePath('/amal-khair');
  return { ok: true, message: 'Rekod Amal Khair berjaya disimpan.' };
}
