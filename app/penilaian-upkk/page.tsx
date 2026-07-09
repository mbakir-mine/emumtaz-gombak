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

function loadUpkkData() {
  return Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getUpkkAmaliSolatMarks(),
    getUpkkPchiMarks(),
  ] as const);
}

export default async function PenilaianUpkkPage() {
  let data: Awaited<ReturnType<typeof loadUpkkData>>;

  try {
    data = await loadUpkkData();
  } catch (error) {
    console.error('Gagal memuatkan data Penilaian UPKK.', error);
    data = [[], [], [], [], [], []];
  }

  const [schools, moduleAccesses, classes, students, amaliRecords, pchiRecords] = data;

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
