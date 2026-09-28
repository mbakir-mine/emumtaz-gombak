'use server';

import { revalidatePath } from 'next/cache';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';
import { cookies } from 'next/headers';

export type ComponentMarkActionState = {
  ok: boolean;
  message: string;
};

function stringList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? '').trim());
}

export async function saveComponentMarkSettings(
  _previousState: ComponentMarkActionState,
  formData: FormData,
): Promise<ComponentMarkActionState> {
  const selfHostedUrl = getTrustedSelfHostedUrl();
  if (!selfHostedUrl) return { ok: false, message: 'Backend Laravel belum dikonfigurasi.' };

  const tahunAkademik = Number(formData.get('tahun_akademik') ?? 0);
  const kodPeperiksaan = String(formData.get('kod_peperiksaan') ?? '').trim();
  const tahun = Number(formData.get('tahun') ?? 0);
  const subjectCodes = stringList(formData, 'kod_subjek');
  const subjectNames = stringList(formData, 'nama_subjek');
  const componentCodes = stringList(formData, 'kod_komponen');
  const markValues = stringList(formData, 'markah_penuh');

  if (!tahunAkademik || !kodPeperiksaan || !tahun || componentCodes.length === 0) {
    return { ok: false, message: 'Pilihan tahun akademik, peperiksaan atau tahun murid tidak lengkap.' };
  }

  const rows = componentCodes.map((kodKomponen, index) => {
    const kodSubjek = subjectCodes[index] ?? '';
    const rawMark = markValues[index] ?? '';
    const markahPenuh = Number(rawMark);

    return {
      tahun_akademik: tahunAkademik,
      kod_peperiksaan: kodPeperiksaan,
      tahun,
      kod_subjek: kodSubjek,
      kod_komponen: kodKomponen,
      markah_penuh: markahPenuh,
      status: 'AKTIF',
    };
  });

  const invalid = rows.find(
    (row) =>
      !row.kod_subjek ||
      !row.kod_komponen ||
      !Number.isFinite(row.markah_penuh) ||
      row.markah_penuh < 0 ||
      row.markah_penuh > 100,
  );

  if (invalid) {
    return { ok: false, message: 'Setiap komponen mesti mempunyai markah antara 0 hingga 100.' };
  }

  const totals = new Map<string, { total: number; name: string }>();
  rows.forEach((row, index) => {
    const current = totals.get(row.kod_subjek) ?? { total: 0, name: subjectNames[index] || row.kod_subjek };
    current.total += row.markah_penuh;
    totals.set(row.kod_subjek, current);
  });

  const wrongTotal = [...totals.values()].find((item) => Math.abs(item.total - 100) > 0.001);
  if (wrongTotal) {
    return {
      ok: false,
      message: `Jumlah markah ${wrongTotal.name} mesti tepat 100. Jumlah sekarang ialah ${wrongTotal.total}.`,
    };
  }

  const response = await fetch(`${selfHostedUrl}/api/mark-settings/components`, { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ tahun_akademik: tahunAkademik, kod_peperiksaan: kodPeperiksaan, tahun, rows: rows.map((row) => ({ kod_subjek: row.kod_subjek, kod_komponen: row.kod_komponen, markah_penuh: row.markah_penuh })) }), cache: 'no-store' });
  if (!response.ok) return { ok: false, message: 'Gagal simpan tetapan komponen markah pada backend Laravel.' };

  revalidatePath('/komponen-markah');
  revalidatePath('/markah');
  return { ok: true, message: 'Tetapan komponen markah berjaya disimpan.' };
}
