import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getUpkkAmaliSolatMarks,
  getUpkkPchiMarks,
} from '@/lib/data';
import UpkkAssessmentTabs from './UpkkAssessmentTabs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PenilaianUpkkPage() {
  const [schools, moduleAccesses, classes, students, amaliRecords, pchiRecords] = await Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getUpkkAmaliSolatMarks(),
    getUpkkPchiMarks(),
  ]);

  return (
    <AppFrame
      title="Penilaian UPKK"
      subtitle="UPKK Tahun 5: Amali Solat, PCHI dan Al-Quran."
      active="upkkAssessment"
    >
      <UpkkAssessmentTabs
        schools={schools}
        moduleAccesses={moduleAccesses}
        classes={classes}
        students={students}
        amaliRecords={amaliRecords}
        pchiRecords={pchiRecords}
      />
    </AppFrame>
  );
}
