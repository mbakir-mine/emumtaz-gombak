import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getTeacherClassAssignments,
  getTeacherSubjectAssignments,
} from '@/lib/data';
import PsraTrialManager from './PsraTrialManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PercubaanPsraPage() {
  const [schools, moduleAccesses, classes, students, classAssignments, subjectAssignments] = await Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getTeacherClassAssignments(),
    getTeacherSubjectAssignments(),
  ]);

  return (
    <AppFrame
      title="Percubaan PSRA"
      subtitle="Peperiksaan Percubaan PSRA 1 dan 2 untuk murid Tahun 6."
      active="psraTrial"
    >
      <PsraTrialManager
        schools={schools}
        moduleAccesses={moduleAccesses}
        classes={classes}
        students={students}
        classAssignments={classAssignments}
        subjectAssignments={subjectAssignments}
      />
    </AppFrame>
  );
}
