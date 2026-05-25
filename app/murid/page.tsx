import AppFrame from '../ui/AppFrame';
import { getClasses, getSchools, getStudents } from '@/lib/data';
import StudentList from './StudentList';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MuridPage() {
  const [schools, classes, students] = await Promise.all([getSchools(), getClasses(), getStudents()]);

  return (
    <AppFrame title="Murid" subtitle="Daftar dan semak murid." active="students">
      <section className="panel">
        <StudentList students={students} classes={classes} schools={schools} />
      </section>
    </AppFrame>
  );
}
