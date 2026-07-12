'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type KhalifahComponentActionState = {
  ok: boolean;
  message: string;
};

const adminRoles = new Set(['OWNER', 'ADMIN_DAERAH', 'ADMIN_SEKOLAH']);

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function safeKey(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function validateAdmin(accessRole: string) {
  return adminRoles.has(accessRole);
}

function componentPayload(formData: FormData) {
  const kind = readText(formData, 'kind') as 'AKTIVITI_KELAS' | 'POSITIF' | 'BIMBINGAN';
  const label = readText(formData, 'label');
  const domain = readText(formData, 'domain') || (kind === 'BIMBINGAN' ? 'Bimbingan' : 'Umum');
  const key = safeKey(readText(formData, 'key') || label);
  const points = Number(formData.get('points') ?? 0);
  const sortOrder = Number(formData.get('sort_order') ?? 0);
  const status = readText(formData, 'status') || 'AKTIF';

  return { kind, label, domain, key, points, sort_order: sortOrder, status };
}

export async function addKhalifahMudaComponent(
  _previousState: KhalifahComponentActionState,
  formData: FormData,
): Promise<KhalifahComponentActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };
  if (!validateAdmin(readText(formData, 'access_role'))) {
    return { ok: false, message: 'Hanya admin sahaja boleh menambah Komponen IHAB.' };
  }

  const row = componentPayload(formData);
  if (!row.label || !row.key || !['AKTIVITI_KELAS', 'POSITIF', 'BIMBINGAN'].includes(row.kind)) {
    return { ok: false, message: 'Lengkapkan jenis komponen dan nama item.' };
  }
  if (!Number.isFinite(row.points) || row.points < 0 || row.points > 100) {
    return { ok: false, message: 'Mata mesti antara 0 hingga 100.' };
  }
  if (!Number.isFinite(row.sort_order)) row.sort_order = 0;

  const { error } = await supabase.from('khalifah_muda_components').insert(row);
  if (error) {
    if (error.message.includes('khalifah_muda_components')) {
      return { ok: false, message: 'Jadual khalifah_muda_components belum wujud. Jalankan SQL 038 dahulu.' };
    }
    return { ok: false, message: `Gagal tambah komponen: ${error.message}` };
  }

  revalidatePath('/komponen-khalifah-muda');
  revalidatePath('/khalifah-muda');
  return { ok: true, message: 'Komponen IHAB berjaya ditambah.' };
}

export async function updateKhalifahMudaComponent(
  _previousState: KhalifahComponentActionState,
  formData: FormData,
): Promise<KhalifahComponentActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };
  if (!validateAdmin(readText(formData, 'access_role'))) {
    return { ok: false, message: 'Hanya admin sahaja boleh mengubah Komponen IHAB.' };
  }

  const id = readText(formData, 'id');
  const row = componentPayload(formData);
  if (!id || !row.label || !row.key || !['AKTIVITI_KELAS', 'POSITIF', 'BIMBINGAN'].includes(row.kind)) {
    return { ok: false, message: 'Data komponen tidak lengkap.' };
  }
  if (!Number.isFinite(row.points) || row.points < 0 || row.points > 100) {
    return { ok: false, message: 'Mata mesti antara 0 hingga 100.' };
  }
  if (!Number.isFinite(row.sort_order)) row.sort_order = 0;

  const { error } = await supabase.from('khalifah_muda_components').update(row).eq('id', id);
  if (error) return { ok: false, message: `Gagal kemas kini komponen: ${error.message}` };

  revalidatePath('/komponen-khalifah-muda');
  revalidatePath('/khalifah-muda');
  return { ok: true, message: 'Komponen IHAB berjaya dikemas kini.' };
}
