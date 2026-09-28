import type { AttendanceRecord, ClassRecord, School, StudentRecord, TakwimEvent } from './data';
import { getTrustedSelfHostedUrl } from './trustedSelfHostedUrl';

type SelfHostedContext = {
  classes: Array<Omit<ClassRecord, 'sesi'>>;
  students: Array<{ id: string; class_id: string; kod_sekolah: string; mykid: string; nama: string; jantina: string | null; status: string }>;
  attendance: Array<Pick<AttendanceRecord, 'student_id' | 'class_id' | 'attendance_date' | 'status' | 'catatan'>>;
};

export async function getSelfHostedAttendanceContext(): Promise<{
  schools: School[];
  classes: ClassRecord[];
  students: StudentRecord[];
  records: AttendanceRecord[];
  takwimEvents: TakwimEvent[];
} | null> {
  const baseUrl = getTrustedSelfHostedUrl();
  if (!baseUrl) return null;
  const response = await fetch(`${baseUrl}/api/attendance/context`, { credentials: 'include', cache: 'no-store' });
  if (!response.ok) throw new Error(`Self-hosted attendance request failed (${response.status})`);
  const context = await response.json() as SelfHostedContext;
  const schoolCodes = [...new Set(context.classes.map((item) => item.kod_sekolah))];
  return {
    schools: schoolCodes.map((kod_sekolah) => ({ kod_sekolah, nama_sekolah: kod_sekolah, kategori: '', daerah: '', zon: null, status: 'AKTIF' })),
    classes: context.classes,
    students: context.students.map(({ nama, ...student }) => ({ ...student, nama_murid: nama })),
    records: context.attendance.map((record) => ({ ...record, id: `${record.student_id}:${record.attendance_date}`, kod_sekolah: context.classes.find((item) => item.id === record.class_id)?.kod_sekolah ?? '' })),
    takwimEvents: [],
  };
}
