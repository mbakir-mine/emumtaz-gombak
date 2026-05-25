import AppFrame from '../ui/AppFrame';
import ClassForm from './ClassForm';
import ClassOverview from './ClassOverview';
import { getClasses, getSchools, getStudents } from '@/lib/data';

export default async function KelasPage() {
  const [schools, classes, students] = await Promise.all([getSchools(), getClasses(), getStudents()]);

  return (
    <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Kelas</h2>
          <span>Tahun murid menentukan set subjek</span>
        </div>
        <ClassForm schools={schools} />
      </section>

      <ClassOverview schools={schools} classes={classes} students={students} />
    </AppFrame>
  );
}
