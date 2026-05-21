import AppFrame from '../ui/AppFrame';
import ClassForm from './ClassForm';
import { getClasses, getSchools } from '@/lib/data';
import ClassList from './ClassList';

export default async function KelasPage() {
  const [schools, classes] = await Promise.all([getSchools(), getClasses()]);

  return (
    <AppFrame title="Daftar Kelas" active="classes">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Kelas</h2>
          <span>Tahun murid menentukan set subjek</span>
        </div>
        <ClassForm schools={schools} />
      </section>

      <section className="panel">
        {classes.length === 0 ? (
          <p className="empty">Belum ada kelas. Tambah kelas pertama menggunakan borang di atas.</p>
        ) : (
          <ClassList classes={classes} />
        )}
      </section>
    </AppFrame>
  );
}
