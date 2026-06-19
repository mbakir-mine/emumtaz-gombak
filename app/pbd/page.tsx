import AppFrame from '../ui/AppFrame';
import {
  getClasses,
  getPbdMarkDetails,
  getSchoolModuleAccesses,
  getSchools,
  getStudents,
  getSubjects,
  getTeacherSubjectAssignments,
  getTeacherSubjectComponentAssignments,
} from '@/lib/data';
import PbdEntryManager from './PbdEntryManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PbdPage() {
  const [schools, classes, students, subjects, subjectAssignments, componentAssignments, pbdMarks, moduleAccesses] =
    await Promise.all([
      getSchools(),
      getClasses(),
      getStudents(),
      getSubjects(),
      getTeacherSubjectAssignments(),
      getTeacherSubjectComponentAssignments(),
      getPbdMarkDetails(),
      getSchoolModuleAccesses(),
    ]);

  return (
    <AppFrame title="PBD" subtitle="Pentaksiran Bilik Darjah berasingan daripada UPSA dan UASA." active="pbd">
      <PbdEntryManager
        schools={schools}
        classes={classes}
        students={students}
        subjects={subjects}
        subjectAssignments={subjectAssignments}
        componentAssignments={componentAssignments}
        pbdMarks={pbdMarks}
        moduleAccesses={moduleAccesses}
      />
    </AppFrame>
  );
}
