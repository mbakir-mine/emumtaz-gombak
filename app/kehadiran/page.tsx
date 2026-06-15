import AppFrame from '../ui/AppFrame';
import { getAttendanceRecords, getClasses, getSchools, getStudents, getTakwimEvents } from '@/lib/data';
import AttendanceManager from './AttendanceManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KehadiranPage() {
  const [schools, classes, students, attendance, takwimEvents] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getAttendanceRecords(),
    getTakwimEvents(),
  ]);

  return (
    <AppFrame title="Kehadiran Harian" subtitle="Rekod kehadiran murid mengikut kelas." active="attendance">
      <AttendanceManager schools={schools} classes={classes} students={students} records={attendance} takwimEvents={takwimEvents} />
    </AppFrame>
  );
}
