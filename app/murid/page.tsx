import AppFrame from '../ui/AppFrame';
import { getClasses, getSchools, getStudents, getStudentSchoolSummaries } from '@/lib/data';
import StudentList from './StudentList';
import { getSelfHostedClasses } from '@/lib/selfHostedClasses';
import { getSelfHostedStudents } from '@/lib/selfHostedStudents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MuridPage() {
  const [selfHostedClasses, selfHostedStudents] = await Promise.all([getSelfHostedClasses(), getSelfHostedStudents()]);
  if (selfHostedClasses && selfHostedStudents) return <AppFrame title="Murid" subtitle="Daftar dan semak murid." active="students"><section className="panel"><StudentList students={selfHostedStudents.students} classes={selfHostedClasses.classes} schools={selfHostedClasses.schools} schoolSummaries={selfHostedStudents.schoolSummaries} /></section></AppFrame>;
  const [schools, classes, students, schoolSummaries] = await Promise.all([
    getSchools(),
    getClasses(),
    getStudents(),
    getStudentSchoolSummaries(),
  ]);

  return (
    <AppFrame title="Murid" subtitle="Daftar dan semak murid." active="students">
      <section className="panel">
        <StudentList students={students} classes={classes} schools={schools} schoolSummaries={schoolSummaries} />
      </section>
    </AppFrame>
  );
}
