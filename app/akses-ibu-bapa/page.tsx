import AppFrame from '../ui/AppFrame';
import { getClasses, getSchoolModuleAccesses, getSchools, getStudents } from '@/lib/data';
import ParentAccessManager from './ParentAccessManager';
import { getSelfHostedClasses } from '@/lib/selfHostedClasses';
import { getSelfHostedSchoolModules } from '@/lib/selfHostedSchoolModules';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ParentAccessPage() {
  const selfHosted = await Promise.all([getSelfHostedClasses(), getSelfHostedSchoolModules()]);
  if (selfHosted[0] && selfHosted[1]) return <AppFrame title="Akses Ibu Bapa" subtitle="Jana kod selamat untuk semakan prestasi murid oleh penjaga." active="parentAccess"><ParentAccessManager schools={selfHosted[0].schools} classes={selfHosted[0].classes} students={selfHosted[0].students} accesses={selfHosted[1].accesses} /></AppFrame>;
  const [schools, classes, students, accesses] = await Promise.all([getSchools(), getClasses(), getStudents(), getSchoolModuleAccesses()]);
  return <AppFrame title="Akses Ibu Bapa" subtitle="Jana kod selamat untuk semakan prestasi murid oleh penjaga." active="parentAccess">
    <ParentAccessManager schools={schools} classes={classes} students={students} accesses={accesses} />
  </AppFrame>;
}
