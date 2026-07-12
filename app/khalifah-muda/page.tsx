import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getKhalifahMudaComponents,
  getKhalifahMudaRecords,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
} from '@/lib/data';
import KhalifahMudaManager from './KhalifahMudaManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KhalifahMudaPage() {
  const [schools, moduleAccesses, classes, students, records, components] = await Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getKhalifahMudaRecords(),
    getKhalifahMudaComponents(),
  ]);

  return (
    <AppFrame
      title="IHAB"
      subtitle="Rekod tarbiah dan pemerhatian sahsiah murid Tahun 6."
      active="khalifahMuda"
    >
      <KhalifahMudaManager
        schools={schools}
        moduleAccesses={moduleAccesses}
        classes={classes}
        students={students}
        records={records}
        components={components}
      />
    </AppFrame>
  );
}
