import AppFrame from '../ui/AppFrame';
import ClassForm from './ClassForm';
import ClassOverview from './ClassOverview';
import { getClasses, getSchools } from '@/lib/data';

export default async function KelasPage() {
  const [schools, classes] = await Promise.all([getSchools(), getClasses()]);

  return (
    <AppFrame title="Kelas" subtitle="Senarai kelas mengikut sekolah." active="classes">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Kelas</h2>
          <span>Tahun murid menentukan set subjek</span>
        </div>
        <ClassForm schools={schools} />
      </section>

      <ClassOverview schools={schools} classes={classes} />
    </AppFrame>
  );
}
