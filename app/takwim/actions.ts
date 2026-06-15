'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TakwimActionState = {
  ok: boolean;
  message: string;
};

function toText(value: FormDataEntryValue | null) {
  return String(value ?? '').trim();
}

export async function saveTakwimEvent(
  _previousState: TakwimActionState,
  formData: FormData,
): Promise<TakwimActionState> {
  if (!supabase) {
    return { ok: false, message: 'Supabase belum disambungkan.' };
  }

  const tahunAkademik = Number(toText(formData.get('tahun_akademik')));
  const kodSekolah = toText(formData.get('kod_sekolah'));
  const kategori = toText(formData.get('kategori'));
  const tajuk = toText(formData.get('tajuk'));
  const tarikhMula = toText(formData.get('tarikh_mula'));
  const tarikhTamat = toText(formData.get('tarikh_tamat'));
  const keterangan = toText(formData.get('keterangan'));
  const warna = toText(formData.get('warna')) || '#08703a';

  if (!tahunAkademik || !kategori || !tajuk || !tarikhMula || !tarikhTamat) {
    return { ok: false, message: 'Lengkapkan tahun, kategori, tajuk dan tarikh takwim.' };
  }

  if (tarikhTamat < tarikhMula) {
    return { ok: false, message: 'Tarikh tamat tidak boleh lebih awal daripada tarikh mula.' };
  }

  const { error } = await supabase.from('takwim_events').insert({
    tahun_akademik: tahunAkademik,
    kod_sekolah: kodSekolah || null,
    scope: kodSekolah ? 'SEKOLAH' : 'DAERAH',
    kategori,
    tajuk,
    tarikh_mula: tarikhMula,
    tarikh_tamat: tarikhTamat,
    keterangan: keterangan || null,
    warna,
    status: 'AKTIF',
  });

  if (error) {
    if (error.message.includes('takwim_events') || error.message.includes('school_module_access_module_key_check')) {
      return {
        ok: false,
        message: 'Jadual Takwim belum tersedia. Jalankan SQL supabase/028_takwim_core.sql di Supabase dahulu.',
      };
    }

    return { ok: false, message: `Gagal simpan takwim: ${error.message}` };
  }

  revalidatePath('/takwim');
  revalidatePath('/kehadiran');
  revalidatePath('/jadual-waktu');
  revalidatePath('/rph');

  return { ok: true, message: 'Rekod takwim berjaya disimpan.' };
}
