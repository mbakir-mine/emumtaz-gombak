import AppFrame from '../ui/AppFrame';
import ClassOverview from './ClassOverview';
import { getClasses, getSchools, getStudents, getTeacherClassAssignments } from '@/lib/data';
import { getSelfHostedClasses } from '@/lib/selfHostedClasses';

export default async function KelasPage() {
  const selfHosted = await getSelfHostedClasses();
  if (selfHosted) return <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes"><ClassOverview {...selfHosted} teacherClassAssignments={[]} /></AppFrame>;
  const [schools, classes, students, teacherClassAssignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getTeacherClassAssignments(),
  ]);

  return (
    <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes">
      <ClassOverview
        schools={schools}
        classes={classes}
        students={students}
        teacherClassAssignments={teacherClassAssignments}
      />
    </AppFrame>
  );
}
