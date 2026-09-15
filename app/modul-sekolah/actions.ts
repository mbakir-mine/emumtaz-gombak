'use server';

import { revalidatePath } from 'next/cache';
import { optionalSchoolModules } from '@/lib/schoolModules';
import { isLicensePlanCode, licensePlanModules } from '@/lib/licensing';
import { getSupabaseServerClient, isVerifiedOwner } from '@/lib/supabase-server';

export type SchoolModuleActionState = {
  ok: boolean;
  message: string;
};

const initialMessage = 'Akses modul sekolah berjaya dikemaskini.';

export async function updateSchoolModuleAccess(
  _previousState: SchoolModuleActionState,
  formData: FormData,
): Promise<SchoolModuleActionState> {
  if (!(await isVerifiedOwner())) {
    return { ok: false, message: 'Akses Pemilik Sistem diperlukan.' };
  }
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const selectedModules = new Set(formData.getAll('module_keys').map((value) => String(value).trim()));

  if (!kodSekolah) {
    return { ok: false, message: 'Kod sekolah tidak lengkap.' };
  }

  const { data: license, error: licenseError } = await supabase
    .from('school_licenses')
    .select('plan_code')
    .eq('kod_sekolah', kodSekolah)
    .maybeSingle();
  if (licenseError) return { ok: false, message: `Gagal menyemak pakej lesen: ${licenseError.message}` };
  if (license?.plan_code && isLicensePlanCode(license.plan_code)) {
    const allowed = new Set<string>(licensePlanModules[license.plan_code]);
    const blocked = [...selectedModules].filter((module) => !allowed.has(module));
    if (blocked.length > 0) {
      return { ok: false, message: `Modul ${blocked.join(', ')} tidak termasuk dalam pakej ${license.plan_code}.` };
    }
  }

  const rows = optionalSchoolModules
    .map((module) => {
      const enabled = selectedModules.has(module.key);

      return {
        kod_sekolah: kodSekolah,
        module_key: module.key,
        enabled,
        enabled_at: enabled ? new Date().toISOString() : null,
      };
    });

  const { error } = await supabase.from('school_module_access').upsert(rows, {
    onConflict: 'kod_sekolah,module_key',
  });

  if (error) {
    if (error.message.includes('school_module_access') || error.message.includes('module_key')) {
      return {
        ok: false,
        message:
          'Jadual/constraint modul sekolah belum dikemaskini. Jalankan SQL 040_percubaan_psra.sql di Supabase dahulu.',
      };
    }

    return { ok: false, message: `Gagal simpan akses modul: ${error.message}` };
  }

  revalidatePath('/modul-sekolah');
  return { ok: true, message: initialMessage };
}
