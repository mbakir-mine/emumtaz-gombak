'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

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
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

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

  const response = await fetch(`${selfHostedUrl}/api/takwim`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() },
    body: JSON.stringify({ tahun_akademik: tahunAkademik, kod_sekolah: kodSekolah || null, kategori, tajuk, tarikh_mula: tarikhMula, tarikh_tamat: tarikhTamat, keterangan: keterangan || null, warna }), cache: 'no-store',
  }).catch(() => null);
  if (!response?.ok) return { ok: false, message: 'Gagal simpan takwim pada backend self-hosted.' };

  revalidatePath('/takwim');
  revalidatePath('/kehadiran');
  revalidatePath('/jadual-waktu');
  revalidatePath('/rph');

  return { ok: true, message: 'Rekod takwim berjaya disimpan.' };
}
