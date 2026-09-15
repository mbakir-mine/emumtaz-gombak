import AppFrame from '../ui/AppFrame';
import { getClasses, getSchoolModuleAccesses, getSchools, getStudents } from '@/lib/data';
import ParentAccessManager from './ParentAccessManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentAccessPage() {
  const [schools, classes, students, accesses] = await Promise.all([getSchools(), getClasses(), getStudents(), getSchoolModuleAccesses()]);
  return <AppFrame title="Akses Ibu Bapa" subtitle="Jana kod selamat untuk semakan prestasi murid oleh penjaga." active="parentAccess">
    <ParentAccessManager schools={schools} classes={classes} students={students} accesses={accesses} />
  </AppFrame>;
}
