'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

export type AttendanceActionState = { ok: boolean; message: string };
const allowedStatuses = ['HADIR', 'TIDAK_HADIR', 'SAKIT', 'CUTI', 'LEWAT', 'AKTIVITI'];

export async function saveDailyAttendance(_previousState: AttendanceActionState, formData: FormData): Promise<AttendanceActionState> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return { ok: false, message: 'Backend Laravel belum disambungkan.' };
  const attendanceDate = String(formData.get('attendance_date') ?? '').trim();
  const classId = String(formData.get('class_id') ?? '').trim();
  const studentIds = formData.getAll('student_id').map((value) => String(value).trim()).filter(Boolean);
  if (!attendanceDate || !classId || studentIds.length === 0) return { ok: false, message: 'Pilih tarikh, kelas dan murid terlebih dahulu.' };
  const [year, month, day] = attendanceDate.split('-').map(Number);
  if ([0, 6].includes(new Date(year, month - 1, day).getDay())) return { ok: false, message: 'Sabtu dan Ahad ialah hari cuti. Kehadiran tidak perlu direkod.' };
  const records = studentIds.map((studentId) => { const rawStatus = String(formData.get(`status_${studentId}`) ?? 'HADIR').trim().toUpperCase(); return { student_id: studentId, status: allowedStatuses.includes(rawStatus) ? rawStatus : 'HADIR', catatan: String(formData.get(`catatan_${studentId}`) ?? '').trim() || null }; });
  const response = await fetch(`${baseUrl}/api/attendance`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json', Cookie: (await cookies()).toString() }, body: JSON.stringify({ class_id: classId, attendance_date: attendanceDate, records }), cache: 'no-store' }).catch(() => null);
  if (!response?.ok) return { ok: false, message: `Gagal menyimpan kehadiran pada backend Laravel (${response?.status ?? 'rangkaian'}).` };
  revalidatePath('/kehadiran');
  return { ok: true, message: `${records.length} rekod kehadiran berjaya disimpan.` };
}
