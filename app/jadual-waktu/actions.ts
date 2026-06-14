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
  if (!supabase) return { error: null };

  const { count, error: lookupError } = await supabase
    .from('timetable_slots')
    .select('id', { count: 'exact', head: true })
    .eq('kod_sekolah', kodSekolah)
    .eq('status', 'AKTIF');

  if (lookupError) return { error: lookupError };
  if ((count ?? 0) > 0) return { error: null };

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
    .from('timetable_slots')
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

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export async function saveTimetableSlotSettings(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const orders = stringList(formData, 'slot_susunan');
  const labels = stringList(formData, 'slot_label');
  const starts = stringList(formData, 'slot_waktu_mula');
  const ends = stringList(formData, 'slot_waktu_tamat');

  if (!kodSekolah) return { ok: false, message: 'Pilih sekolah dahulu.' };

  const rows = orders.map((order, index) => ({
    susunan: Number(order),
    label: labels[index] || `Masa ${index + 1}`,
    waktu_mula: starts[index],
    waktu_tamat: ends[index],
  }));

  if (rows.length === 0) return { ok: false, message: 'Tiada slot masa untuk dikemaskini.' };

  const invalid = rows.find(
    (row) =>
      !Number.isInteger(row.susunan) ||
      row.susunan <= 0 ||
      !isValidTime(row.waktu_mula) ||
      !isValidTime(row.waktu_tamat) ||
      row.waktu_mula >= row.waktu_tamat,
  );

  if (invalid) {
    return { ok: false, message: 'Semak waktu slot. Waktu mula mesti lebih awal daripada waktu tamat.' };
  }

  const duplicateTime = new Set<string>();
  const hasDuplicate = rows.some((row) => {
    const key = `${row.waktu_mula}|${row.waktu_tamat}`;
    if (duplicateTime.has(key)) return true;
    duplicateTime.add(key);
    return false;
  });

  if (hasDuplicate) {
    return { ok: false, message: 'Ada slot masa yang bertindih atau berulang. Betulkan masa dahulu.' };
  }

  for (const row of rows) {
    const { error } = await supabase
      .from('timetable_slots')
      .update({
        label: row.label,
        waktu_mula: row.waktu_mula,
        waktu_tamat: row.waktu_tamat,
      })
      .eq('kod_sekolah', kodSekolah)
      .eq('susunan', row.susunan)
      .eq('status', 'AKTIF');

    if (error) {
      if (error.message.includes('timetable_slots')) {
        return { ok: false, message: tableMissingMessage('Jadual waktu') };
      }

      return { ok: false, message: `Gagal simpan tetapan slot masa: ${error.message}` };
    }
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: `${rows.length} tetapan slot masa berjaya dikemaskini.` };
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

function stringList(formData: FormData, key: string) {
  return formData.getAll(key).map((value) => String(value ?? '').trim());
}

export async function saveTimetableRequirements(
  _previousState: TimetableActionState,
  formData: FormData,
): Promise<TimetableActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const kodSekolah = String(formData.get('kod_sekolah') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const subjectCodes = stringList(formData, 'requirement_kod_subjek');
  const componentCodes = stringList(formData, 'requirement_kod_komponen');
  const displayNames = stringList(formData, 'requirement_nama_paparan');
  const teacherIds = stringList(formData, 'requirement_teacher_id');
  const slotCounts = stringList(formData, 'requirement_bil_slot');
  const doubleOptions = stringList(formData, 'requirement_boleh_gabung');

  if (!kodSekolah || !classId) {
    return { ok: false, message: 'Pilih sekolah dan kelas dahulu.' };
  }

  const rows = subjectCodes
    .map((kodSubjek, index) => {
      const bilSlot = Number(slotCounts[index] ?? 0);
      return {
        kod_sekolah: kodSekolah,
        class_id: classId,
        kod_subjek: kodSubjek,
        kod_komponen: componentCodes[index] || null,
        nama_paparan: displayNames[index] || null,
        teacher_id: teacherIds[index] || null,
        bil_slot_seminggu: Number.isFinite(bilSlot) ? bilSlot : 0,
        boleh_gabung: doubleOptions[index] === 'YA',
        status: 'AKTIF',
      };
    })
    .filter((row) => row.kod_subjek && row.teacher_id && row.bil_slot_seminggu > 0);

  const invalid = rows.find((row) => row.bil_slot_seminggu < 0 || row.bil_slot_seminggu > 40);
  if (invalid) {
    return { ok: false, message: 'Bilangan masa mesti antara 0 hingga 40.' };
  }

  const { error: deleteError } = await supabase
    .from('timetable_requirements')
    .delete()
    .eq('kod_sekolah', kodSekolah)
    .eq('class_id', classId);

  if (deleteError) {
    if (deleteError.message.includes('timetable_requirements')) {
      return { ok: false, message: requirementMissingMessage() };
    }

    return { ok: false, message: `Gagal kosongkan tetapan lama: ${deleteError.message}` };
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('timetable_requirements').insert(rows);
    if (insertError) {
      if (insertError.message.includes('timetable_requirements') || insertError.message.includes('kod_komponen')) {
        return { ok: false, message: `${requirementMissingMessage()} Jika SQL sudah ada, jalankan semula fail 025 yang terkini.` };
      }

      return { ok: false, message: `Gagal simpan tetapan jadual: ${insertError.message}` };
    }
  }

  revalidatePath('/jadual-waktu');
  return { ok: true, message: `${rows.length} tetapan jadual kelas berjaya disimpan.` };
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
  kod_komponen: string | null;
  nama_paparan: string | null;
  teacher_id: string | null;
  bil_slot_seminggu: number;
  boleh_gabung: boolean;
};

type TimetableUnit = {
  class_id: string;
  kod_subjek: string;
  kod_komponen: string | null;
  nama_paparan: string | null;
  teacher_id: string | null;
  duration: 1 | 2;
  unitIndex: number;
};

function isTeachingSlot(slot: AutoSlot) {
  const label = (slot.label ?? '').toUpperCase();
  return !label.includes('REHAT');
}

function isConsecutiveSlot(first: AutoSlot, second: AutoSlot) {
  return first.hari === second.hari && first.waktu_tamat === second.waktu_mula;
}

function candidateSlotGroup(slots: AutoSlot[], startIndex: number, duration: 1 | 2) {
  const first = slots[startIndex];
  if (!first) return null;
  if (duration === 1) return [first];

  const second = slots[startIndex + 1];
  if (!second || !isConsecutiveSlot(first, second)) return null;
  return [first, second];
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
}): AutoSlot[] | null {
  let bestSlots: AutoSlot[] | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (let index = 0; index < slots.length; index += 1) {
    const slotGroup = candidateSlotGroup(slots, index, unit.duration);
    if (!slotGroup) continue;

    const hasConflict = slotGroup.some((slot) => {
      const classSlotKey = `${unit.class_id}|${slot.id}`;
      const teacherSlotKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.id}`;
      return classSlotUsage.has(classSlotKey) || Boolean(unit.teacher_id && teacherSlotUsage.has(teacherSlotKey));
    });

    if (hasConflict) continue;

    const slot = slotGroup[0];
    const subjectDayKey = `${unit.class_id}|${unit.kod_subjek}|${slot.hari}`;
    const teacherDayKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.hari}`;
    const subjectDayCount = classSubjectDayUsage.get(subjectDayKey) ?? 0;
    const teacherDayCount = teacherDayUsage.get(teacherDayKey) ?? 0;
    const earlyPenalty = Math.max(0, slot.susunan - 1) * 0.01;
    const score = subjectDayCount * 10 + teacherDayCount * 2 + earlyPenalty;

    if (score < bestScore) {
      bestScore = score;
      bestSlots = slotGroup;
    }
  }

  return bestSlots;
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
    .select('class_id,kod_subjek,kod_komponen,nama_paparan,teacher_id,bil_slot_seminggu,boleh_gabung,status')
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
        const doubleUnits = requirement.boleh_gabung ? Math.floor(requirement.bil_slot_seminggu / 2) : 0;
        const singleUnits = requirement.bil_slot_seminggu - doubleUnits * 2;

        for (let index = 0; index < doubleUnits; index += 1) {
          units.push({
            class_id: requirement.class_id,
            kod_subjek: requirement.kod_subjek,
            kod_komponen: requirement.kod_komponen,
            nama_paparan: requirement.nama_paparan,
            teacher_id: requirement.teacher_id,
            duration: 2,
            unitIndex: index,
          });
        }

        for (let index = 0; index < singleUnits; index += 1) {
          units.push({
            class_id: requirement.class_id,
            kod_subjek: requirement.kod_subjek,
            kod_komponen: requirement.kod_komponen,
            nama_paparan: requirement.nama_paparan,
            teacher_id: requirement.teacher_id,
            duration: 1,
            unitIndex: doubleUnits + index,
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
    kod_komponen: string | null;
    nama_paparan: string | null;
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
    const slotGroup = pickBestSlot({
      slots: teachingSlots,
      unit,
      classSlotUsage,
      teacherSlotUsage,
      classSubjectDayUsage,
      teacherDayUsage,
    });

    if (!slotGroup) {
      unassigned += 1;
      return;
    }

    slotGroup.forEach((slot) => {
      classSlotUsage.add(`${unit.class_id}|${slot.id}`);
      if (unit.teacher_id) teacherSlotUsage.add(`${unit.teacher_id}|${slot.id}`);
    });

    const slot = slotGroup[0];
    const subjectDayKey = `${unit.class_id}|${unit.kod_subjek}|${slot.hari}`;
    const teacherDayKey = `${unit.teacher_id ?? 'NO_TEACHER'}|${slot.hari}`;
    classSubjectDayUsage.set(subjectDayKey, (classSubjectDayUsage.get(subjectDayKey) ?? 0) + unit.duration);
    teacherDayUsage.set(teacherDayKey, (teacherDayUsage.get(teacherDayKey) ?? 0) + unit.duration);

    slotGroup.forEach((assignedSlot) => {
      generatedRows.push({
        slot_id: assignedSlot.id,
        class_id: unit.class_id,
        kod_sekolah: kodSekolah,
        kod_subjek: unit.kod_subjek,
        kod_komponen: unit.kod_komponen,
        nama_paparan: unit.nama_paparan,
        teacher_id: unit.teacher_id,
        bilik: null,
        status: 'AKTIF',
      });
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
