'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type TeacherClassActionState = {
  ok: boolean;
  message: string;
};

export async function assignTeacherClass(
  _previousState: TeacherClassActionState,
  formData: FormData,
): Promise<TeacherClassActionState> {
  const userId = String(formData.get('user_id') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();

  if (!userId || !classId) {
    return { ok: false, message: 'Pilih guru dan kelas.' };
  }

  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const response = await fetch(`${selfHostedUrl}/api/assignments/class-teacher`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ user_id: userId, class_id: classId }), cache: 'no-store' });
  if (!response.ok) return { ok: false, message: `Gagal tetapkan guru kelas (${response.status}).` };

  revalidatePath('/guru-kelas');
  return { ok: true, message: 'Guru kelas berjaya ditetapkan.' };
}
