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

function requirementMissingMessage() {
  return 'Tetapan automasi jadual waktu belum tersedia. Jalankan SQL 025_timetable_auto_requirements.sql di Supabase dahulu.';
}

async function ensureDefaultSlots(kodSekolah: string) {
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

  return supabase
    ?.from('timetable_slots')
    .upsert(rows, { onConflict: 'kod_sekolah,hari,waktu_mula,waktu_tamat' });
}

export async function generateDefaultTimetableSlots(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  if (!kodSekolah) return { ok: false, message: 'Pilih sekolah dahulu.' };

  const { error } = await ensureDefaultSlots(kodSekolah) ?? { error: null };

  if (error) {
    if (error.message.includes('timetable_slots')) {
      return { ok: false, message: tableMissingMessage('Jadual waktu') };
    }

    return { ok: false, message: `Gagal jana slot jadual waktu: ${error.message}` };
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: 'Slot asas jadual waktu berjaya dijana.' };
}

export async function saveTimetableRequirement(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const kodSubjek = String(formData.get('kod_subjek') ?? '').trim();
  const teacherId = String(formData.get('teacher_id') ?? '').trim();
  const bilSlot = Number(formData.get('bil_slot_seminggu') ?? 0);

  if (!kodSekolah || !classId || !kodSubjek || !teacherId || !Number.isFinite(bilSlot) || bilSlot <= 0) {
    return { ok: false, message: 'Pilih kelas, subjek, guru dan bilangan masa seminggu.' };
  }

  const { error } = await supabase.from('timetable_requirements').upsert(
    {
      kod_sekolah: kodSekolah,
      class_id: classId,
      kod_subjek: kodSubjek,
      teacher_id: teacherId,
      bil_slot_seminggu: bilSlot,
      status: 'AKTIF',
    },
    { onConflict: 'class_id,kod_subjek' },
  );

  if (error) {
    if (error.message.includes('timetable_requirements')) {
      return { ok: false, message: requirementMissingMessage() };
    }

    return { ok: false, message: `Gagal simpan tetapan subjek: ${error.message}` };
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: 'Tetapan subjek kelas berjaya disimpan.' };
}

type AutoSlot = {
  id: string;
  hari: string;
  waktu_mula: string;
  waktu_tamat: string;
  label: string | null;
  susunan: number;
};

type AutoClass = {
  id: string;
  tahun: number;
  nama_kelas: string;
};

type AutoRequirement = {
  class_id: string;
  kod_subjek: string;
  teacher_id: string | null;
  bil_slot_seminggu: number;
};

type TimetableUnit = {
  class_id: string;
  kod_subjek: string;
  teacher_id: string | null;
  unitIndex: number;
};

function isTeachingSlot(slot: AutoSlot) {
  const label = (slot.label ?? '').toUpperCase();
  return !label.includes('REHAT');
}

function pickBestSlot({
  slots,
  unit,
  classSlotUsage,
  teacherSlotUsage,
  classSubjectDayUsage,
  teacherDayUsage,
}: {
  slots: AutoSlot[];
  unit: TimetableUnit;
  classSlotUsage: Set<string>;
  teacherSlotUsage: Set<string>;
  classSubjectDayUsage: Map<string, number>;
  teacherDayUsage: Map<string, number>;
}): AutoSlot | null {
  let bestSlot: AutoSlot | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const slot of slots) {
    const classSlotKey = `${unit.class_id}|${slot.id}`;
    const teacherSlotKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.id}`;
    if (classSlotUsage.has(classSlotKey)) continue;
    if (unit.teacher_id && teacherSlotUsage.has(teacherSlotKey)) continue;

    const subjectDayKey = `${unit.class_id}|${unit.kod_subjek}|${slot.hari}`;
    const teacherDayKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.hari}`;
    const subjectDayCount = classSubjectDayUsage.get(subjectDayKey) ?? 0;
    const teacherDayCount = teacherDayUsage.get(teacherDayKey) ?? 0;
    const earlyPenalty = Math.max(0, slot.susunan - 1) * 0.01;
    const score = subjectDayCount * 10 + teacherDayCount * 2 + earlyPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestSlot = slot;
    }
  }

  return bestSlot;
}

export async function generateAutoTimetable(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const tahunAkademik = Number(formData.get('tahun_akademik') ?? 0);
  if (!kodSekolah || !tahunAkademik) return { ok: false, message: 'Pilih sekolah dan tahun akademik.' };

  const slotSeed = await ensureDefaultSlots(kodSekolah);
  if (slotSeed?.error) {
    if (slotSeed.error.message.includes('timetable_slots')) {
      return { ok: false, message: tableMissingMessage('Jadual waktu') };
    }

    return { ok: false, message: `Gagal sediakan slot asas: ${slotSeed.error.message}` };
  }

  const [{ data: classes, error: classError }, { data: slots, error: slotError }] = await Promise.all([
    supabase
      .from('classes')
      .select('id,tahun,nama_kelas')
      .eq('kod_sekolah', kodSekolah)
      .eq('tahun_akademik', tahunAkademik)
      .eq('status', 'AKTIF')
      .order('tahun')
      .order('nama_kelas'),
    supabase
      .from('timetable_slots')
      .select('id,hari,waktu_mula,waktu_tamat,label,susunan')
      .eq('kod_sekolah', kodSekolah)
      .eq('status', 'AKTIF')
      .order('susunan'),
  ]);

  if (classError) return { ok: false, message: `Gagal baca kelas: ${classError.message}` };
  if (slotError) return { ok: false, message: `Gagal baca slot masa: ${slotError.message}` };

  const yearClasses = (classes ?? []) as AutoClass[];
  const teachingSlots = ((slots ?? []) as AutoSlot[])
    .filter(isTeachingSlot)
    .sort((a, b) => defaultDays.indexOf(a.hari) - defaultDays.indexOf(b.hari) || a.susunan - b.susunan);

  if (yearClasses.length === 0) return { ok: false, message: 'Tiada kelas aktif untuk tahun akademik ini.' };
  if (teachingSlots.length === 0) return { ok: false, message: 'Tiada slot masa mengajar. Jana slot asas dahulu.' };

  const classIds = yearClasses.map((item) => item.id);
  const { data: requirements, error: requirementError } = await supabase
    .from('timetable_requirements')
    .select('class_id,kod_subjek,teacher_id,bil_slot_seminggu,status')
    .eq('kod_sekolah', kodSekolah)
    .eq('status', 'AKTIF')
    .in('class_id', classIds)
    .gt('bil_slot_seminggu', 0);

  if (requirementError) {
    if (requirementError.message.includes('timetable_requirements')) {
      return { ok: false, message: requirementMissingMessage() };
    }

    return { ok: false, message: `Gagal baca tetapan subjek: ${requirementError.message}` };
  }

  const activeRequirements = (requirements ?? []) as AutoRequirement[];
  if (activeRequirements.length === 0) {
    return { ok: false, message: 'Belum ada tetapan subjek kelas. Masukkan subjek, guru dan bilangan masa dahulu.' };
  }

  const classSlotCapacity = teachingSlots.length;
  const overloadedClass = yearClasses.find((classRecord) => {
    const total = activeRequirements
      .filter((item) => item.class_id === classRecord.id)
      .reduce((sum, item) => sum + item.bil_slot_seminggu, 0);
    return total > classSlotCapacity;
  });

  if (overloadedClass) {
    return {
      ok: false,
      message: `Beban ${overloadedClass.nama_kelas} melebihi ${classSlotCapacity} slot seminggu. Kurangkan bilangan masa subjek dahulu.`,
    };
  }

  const units: TimetableUnit[] = [];
  yearClasses.forEach((classRecord) => {
    activeRequirements
      .filter((item) => item.class_id === classRecord.id)
      .sort((a, b) => b.bil_slot_seminggu - a.bil_slot_seminggu || a.kod_subjek.localeCompare(b.kod_subjek))
      .forEach((requirement) => {
        for (let index = 0; index < requirement.bil_slot_seminggu; index += 1) {
          units.push({
            class_id: requirement.class_id,
            kod_subjek: requirement.kod_subjek,
            teacher_id: requirement.teacher_id,
            unitIndex: index,
          });
        }
      });
  });

  const classSlotUsage = new Set<string>();
  const teacherSlotUsage = new Set<string>();
  const classSubjectDayUsage = new Map<string, number>();
  const teacherDayUsage = new Map<string, number>();
  const generatedRows: Array<{
    slot_id: string;
    class_id: string;
    kod_sekolah: string;
    kod_subjek: string;
    teacher_id: string | null;
    bilik: string | null;
    status: string;
  }> = [];
  let unassigned = 0;

  const balancedUnits = [...units].sort((a, b) => {
    if (a.unitIndex !== b.unitIndex) return a.unitIndex - b.unitIndex;
    if ((a.teacher_id ?? '') !== (b.teacher_id ?? '')) return (a.teacher_id ?? '').localeCompare(b.teacher_id ?? '');
    return a.class_id.localeCompare(b.class_id) || a.kod_subjek.localeCompare(b.kod_subjek);
  });

  balancedUnits.forEach((unit) => {
    const slot = pickBestSlot({
      slots: teachingSlots,
      unit,
      classSlotUsage,
      teacherSlotUsage,
      classSubjectDayUsage,
      teacherDayUsage,
    });

    if (!slot) {
      unassigned += 1;
      return;
    }

    classSlotUsage.add(`${unit.class_id}|${slot.id}`);
    if (unit.teacher_id) teacherSlotUsage.add(`${unit.teacher_id}|${slot.id}`);

    const subjectDayKey = `${unit.class_id}|${unit.kod_subjek}|${slot.hari}`;
    const teacherDayKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.hari}`;
    classSubjectDayUsage.set(subjectDayKey, (classSubjectDayUsage.get(subjectDayKey) ?? 0) + 1);
    teacherDayUsage.set(teacherDayKey, (teacherDayUsage.get(teacherDayKey) ?? 0) + 1);

    generatedRows.push({
      slot_id: slot.id,
      class_id: unit.class_id,
      kod_sekolah: kodSekolah,
      kod_subjek: unit.kod_subjek,
      teacher_id: unit.teacher_id,
      bilik: null,
      status: 'AKTIF',
    });
  });

  const { error: deleteError } = await supabase
    .from('timetable_entries')
    .delete()
    .eq('kod_sekolah', kodSekolah)
    .in('class_id', classIds);

  if (deleteError) return { ok: false, message: `Gagal kosongkan jadual lama: ${deleteError.message}` };

  if (generatedRows.length > 0) {
    const { error: insertError } = await supabase.from('timetable_entries').insert(generatedRows);
    if (insertError) return { ok: false, message: `Gagal simpan jadual automatik: ${insertError.message}` };
  }

  revalidatePath('/jadual-waktu');
  return {
    ok: unassigned === 0,
    message:
      unassigned === 0
        ? `Jadual automatik berjaya dijana untuk ${yearClasses.length} kelas (${generatedRows.length} slot).`
        : `Jadual dijana ${generatedRows.length} slot, tetapi ${unassigned} slot belum dapat disusun kerana kekangan guru/masa.`,
  };
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
