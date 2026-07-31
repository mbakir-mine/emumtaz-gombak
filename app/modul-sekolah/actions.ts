'use server';

import { revalidatePath } from 'next/cache';
import { optionalSchoolModules } from '@/lib/schoolModules';
import { supabase } from '@/lib/supabase';

export type SchoolModuleActionState = {
  ok: boolean;
  message: string;
};

const initialMessage = 'Akses modul sekolah berjaya dikemaskini.';

export async function updateSchoolModuleAccess(
  _previousState: SchoolModuleActionState,
  formData: FormData,
): Promise<SchoolModuleActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const selectedModules = new Set(formData.getAll('module_keys').map((value) => String(value).trim()));

  if (!kodSekolah) {
    return { ok: false, message: 'Kod sekolah tidak lengkap.' };
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
