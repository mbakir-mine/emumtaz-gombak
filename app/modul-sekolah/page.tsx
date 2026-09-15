import AppFrame from '../ui/AppFrame';
import { getSchoolLicenses, getSchoolModuleAccesses, getSchools } from '@/lib/data';
import SchoolModuleAccessManager from './SchoolModuleAccessManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ModulSekolahPage() {
  const [schools, accesses, licenses] = await Promise.all([getSchools(), getSchoolModuleAccesses(), getSchoolLicenses()]);

  return (
    <AppFrame title="Akses Modul Sekolah" subtitle="Kawalan modul pilihan mengikut permohonan sekolah." active="schoolModules">
      <SchoolModuleAccessManager schools={schools} accesses={accesses} licenses={licenses} />
    </AppFrame>
  );
}
