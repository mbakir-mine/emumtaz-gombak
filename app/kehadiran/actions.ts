'use server';

import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export type AttendanceActionState = {
  ok: boolean;
  message: string;
};

const allowedStatuses = ['HADIR', 'TIDAK_HADIR', 'SAKIT', 'CUTI', 'LEWAT', 'AKTIVITI'];

export async function saveDailyAttendance(
  _previousState: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  if (!supabase) return { ok: false, message: 'Supabase belum disambungkan.' };

  const attendanceDate = String(formData.get('attendance_date') ?? '').trim();
  const studentIds = formData
    .getAll('student_id')
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!attendanceDate || studentIds.length === 0) {
    return { ok: false, message: 'Pilih tarikh dan kelas yang mempunyai murid.' };
  }

  const { data: students, error: studentError } = await supabase
    .from('students')
    .select('id,kod_sekolah,class_id')
    .in('id', studentIds);

  if (studentError) {
    return { ok: false, message: `Gagal semak murid: ${studentError.message}` };
  }

  const rows = (students ?? []).map((student) => {
    const rawStatus = String(formData.get(`status_${student.id}`) ?? 'HADIR').trim().toUpperCase();
    const status = allowedStatuses.includes(rawStatus) ? rawStatus : 'HADIR';
    const catatan = String(formData.get(`catatan_${student.id}`) ?? '').trim();

    return {
      attendance_date: attendanceDate,
      student_id: student.id,
      kod_sekolah: student.kod_sekolah,
      class_id: student.class_id,
      status,
      catatan: catatan || null,
    };
  });

  const { error } = await supabase.from('daily_attendance').upsert(rows, {
    onConflict: 'attendance_date,student_id',
  });

  if (error) {
    if (error.message.includes('daily_attendance')) {
      return {
        ok: false,
        message: 'Jadual daily_attendance belum wujud. Jalankan SQL 024_optional_school_modules_core.sql di Supabase.',
      };
    }

    return { ok: false, message: `Gagal simpan kehadiran: ${error.message}` };
  }

  revalidatePath('/kehadiran');
  return { ok: true, message: `${rows.length} rekod kehadiran berjaya disimpan.` };
}
