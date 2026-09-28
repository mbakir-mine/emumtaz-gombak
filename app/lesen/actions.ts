'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type LicenseActionState = { ok: boolean; message: string };

const plans = new Set(['PERCUBAAN', 'ASAS', 'PRO', 'PREMIER']);
const statuses = new Set(['PERCUBAAN', 'AKTIF', 'DIGANTUNG', 'TAMAT']);

function positiveInteger(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) return null;
  const number = Number(text);
  return Number.isInteger(number) && number > 0 ? number : Number.NaN;
}

export async function saveSchoolLicense(
  _previousState: LicenseActionState,
  formData: FormData,
): Promise<LicenseActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim().toUpperCase();
  const planCode = String(formData.get('plan_code') ?? '').trim().toUpperCase();
  const status = String(formData.get('status') ?? '').trim().toUpperCase();
  const startsOn = String(formData.get('starts_on') ?? '').trim();
  const endsOn = String(formData.get('ends_on') ?? '').trim() || null;
  const maxStudents = positiveInteger(formData.get('max_students'));
  const maxUsers = positiveInteger(formData.get('max_users'));
  const notes = String(formData.get('notes') ?? '').trim().slice(0, 1000) || null;

  if (!kodSekolah || !plans.has(planCode) || !statuses.has(status) || !/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) {
    return { ok: false, message: 'Maklumat lesen tidak lengkap atau tidak sah.' };
  }
  if (endsOn && (!/^\d{4}-\d{2}-\d{2}$/.test(endsOn) || endsOn < startsOn)) {
    return { ok: false, message: 'Tarikh tamat mesti sama atau selepas tarikh mula.' };
  }
  if (Number.isNaN(maxStudents) || Number.isNaN(maxUsers)) {
    return { ok: false, message: 'Had murid dan pengguna mesti nombor bulat positif.' };
  }

  const response = await fetch(`${selfHostedUrl}/api/licenses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ kod_sekolah: kodSekolah, plan_code: planCode, status, starts_on: startsOn, ends_on: endsOn, max_students: maxStudents, max_users: maxUsers, notes }), cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { ok: false, message: 'Gagal menyimpan lesen pada backend self-hosted.' };
  revalidatePath('/lesen');
  return { ok: true, message: 'Lesen sekolah berjaya disimpan.' };
}
