import AppFrame from '../ui/AppFrame';
import ClassOverview from './ClassOverview';
import { getClasses, getSchools, getStudents } from '@/lib/data';

export default async function KelasPage() {
  const [schools, classes, students] = await Promise.all([getSchools(), getClasses(), getStudents()]);

  return (
    <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes">
      <ClassOverview schools={schools} classes={classes} students={students} />
    </AppFrame>
  );
}
