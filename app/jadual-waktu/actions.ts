'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type TimetableActionState = {
  ok: boolean;
  message: string;
};

const defaultDays = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT'];
const defaultSlots = [
  { mula: '07:30', tamat: '08:00', label: 'Masa 1', susunan: 1 },
  { mula: '08:00', tamat: '08:30', label: 'Masa 2', susunan: 2 },
  { mula: '08:30', tamat: '09:00', label: 'Masa 3', susunan: 3 },
  { mula: '09:00', tamat: '09:30', label: 'Masa 4', susunan: 4 },
  { mula: '09:30', tamat: '10:00', label: 'Masa 5', susunan: 5 },
  { mula: '10:00', tamat: '10:30', label: 'Rehat', susunan: 6 },
  { mula: '10:30', tamat: '11:00', label: 'Masa 6', susunan: 7 },
  { mula: '11:00', tamat: '11:30', label: 'Masa 7', susunan: 8 },
  { mula: '11:30', tamat: '12:00', label: 'Masa 8', susunan: 9 },
  { mula: '12:00', tamat: '12:30', label: 'Masa 9', susunan: 10 },
];

function tableMissingMessage(moduleName: string) {
  return `${moduleName} belum tersedia. Jalankan SQL 024_optional_school_modules_core.sql di Supabase dahulu.`;
}

export async function generateDefaultTimetableSlots(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  if (!kodSekolah) return { ok: false, message: 'Pilih sekolah dahulu.' };

  const rows = defaultDays.flatMap((hari) =>
    defaultSlots.map((slot) => ({
      kod_sekolah: kodSekolah,
      hari,
      waktu_mula: slot.mula,
      waktu_tamat: slot.tamat,
      label: slot.label,
      susunan: slot.susunan,
      status: 'AKTIF',
    })),
  );

  const { error } = await supabase
    .from('timetable_slots')
    .upsert(rows, { onConflict: 'kod_sekolah,hari,waktu_mula,waktu_tamat' });

  if (error) {
    if (error.message.includes('timetable_slots')) {
      return { ok: false, message: tableMissingMessage('Jadual waktu') };
    }

    return { ok: false, message: `Gagal jana slot jadual waktu: ${error.message}` };
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: 'Slot asas jadual waktu berjaya dijana.' };
}

export async function saveTimetableEntry(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const slotId = String(formData.get('slot_id') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim();
  const bilik = String(formData.get('bilik') ?? '').trim();

  if (!kodSekolah || !classId || !slotId || !kodSubjek) {
    return { ok: false, message: 'Pilih kelas, slot masa dan subjek.' };
  }

  const { error } = await supabase.from('timetable_entries').upsert(
    {
      kod_sekolah: kodSekolah,
      class_id: classId,
      slot_id: slotId,
      kod_subjek: kodSubjek,
      teacher_id: teacherId || null,
      bilik: bilik || null,
      status: 'AKTIF',
    },
    { onConflict: 'slot_id,class_id' },
  );

  if (error) {
    if (error.message.includes('timetable_entries')) {
      return { ok: false, message: tableMissingMessage('Jadual waktu') };
    }

    return { ok: false, message: `Gagal simpan jadual waktu: ${error.message}` };
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: 'Jadual waktu kelas berjaya dikemaskini.' };
}
