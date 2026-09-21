import AppFrame from '../../ui/AppFrame';
import {
  getClasses,
  getExams,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getTeacherClassAssignments,
  getTeacherSubjectAssignments,
} from '@/lib/data';
import UpkkReportManager from './UpkkReportManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function UpkkReportPage() {
  const [schools, moduleAccesses, classes, students, classAssignments, subjectAssignments, exams] = await Promise.all([
    getSchools(),
    getSchoolModuleAccesses(),
    getClasses(),
    getStudents(),
    getTeacherClassAssignments(),
    getTeacherSubjectAssignments(),
    getExams(),
  ]);

  return (
    <AppFrame
      title="Laporan Percubaan UPKK"
      subtitle="Analisis tahun, kelas, individu, mata pelajaran dan bilangan gred."
      active="reportUpkk"
    >
      <UpkkReportManager
        schools={schools}
        moduleAccesses={moduleAccesses}
        classes={classes}
        students={students}
        classAssignments={classAssignments}
        subjectAssignments={subjectAssignments}
        exams={exams}
      />
    </AppFrame>
  );
}

