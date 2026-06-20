import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getUpkkJakimItemMarks,
  getUpkkJakimMarks,
} from '@/lib/data';
import UpkkJakimManager from './UpkkJakimManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UpkkJakimPage() {
  const [schools, classes, students, marks, itemMarks, moduleAccesses] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getUpkkJakimMarks(),
    getUpkkJakimItemMarks(),
    getSchoolModuleAccesses(),
  ]);

  return (
    <AppFrame
      title="UPKK JAKIM"
      subtitle="Pemarkahan PCHI dan Amali Solat UPKK."
      active="upkkJakim"
    >
      <UpkkJakimManager
        schools={schools}
        classes={classes}
        students={students}
        marks={marks}
        itemMarks={itemMarks}
        moduleAccesses={moduleAccesses}
      />
    </AppFrame>
  );
}
