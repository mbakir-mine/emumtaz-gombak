'use server';

import { revalidatePath } from 'next/cache';
import { optionalSchoolModules } from '@/lib/schoolModules';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type SchoolModuleActionState = {
  ok: boolean;
  message: string;
};

const initialMessage = 'Akses modul sekolah berjaya dikemaskini.';

export async function updateSchoolModuleAccess(
  _previousState: SchoolModuleActionState,
  formData: FormData,
): Promise<SchoolModuleActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const selectedModules = new Set(formData.getAll('module_keys').map((value) => String(value).trim()));

  if (!kodSekolah) {
    return { ok: false, message: 'Kod sekolah tidak lengkap.' };
  }

  const cookie = (await cookies()).toString();
  for (const moduleItem of optionalSchoolModules) {
    const response = await fetch(`${selfHostedUrl}/api/school-modules`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: cookie }, body: JSON.stringify({ kod_sekolah: kodSekolah, module_key: moduleItem.key, enabled: selectedModules.has(moduleItem.key) }), cache: 'no-store' });
    if (!response.ok) return { ok: false, message: 'Gagal menyimpan akses modul pada backend Laravel.' };
  }

  revalidatePath('/modul-sekolah');
  return { ok: true, message: initialMessage };
}
