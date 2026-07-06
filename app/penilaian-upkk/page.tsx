import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getUpkkAmaliSolatMarks,
} from '@/lib/data';
import UpkkAmaliSolatManager from './UpkkAmaliSolatManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PenilaianUpkkPage() {
  const [schools, moduleAccesses, classes, students, records] = await Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getUpkkAmaliSolatMarks(),
  ]);

  return (
    <AppFrame title="Penilaian UPKK" subtitle="UPKK - Amali Solat Tahun 5." active="upkkAssessment">
      <UpkkAmaliSolatManager
        schools={schools}
        moduleAccesses={moduleAccesses}
        classes={classes}
        students={students}
        records={records}
      />
    </AppFrame>
  );
}
