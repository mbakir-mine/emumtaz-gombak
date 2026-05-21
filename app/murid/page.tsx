import AppFrame from '../ui/AppFrame';
import StudentForm from './StudentForm';
import { getClasses, getSchools, getStudents } from '@/lib/data';
import StudentList from './StudentList';

export default async function MuridPage() {
  const [schools, classes, students] = await Promise.all([getSchools(), getClasses(), getStudents()]);

  return (
    <AppFrame title="Murid" subtitle="Daftar dan semak murid." active="students">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Murid</h2>
          <span>Murid mesti diikat kepada kelas</span>
        </div>
        {classes.length === 0 ? (
          <p className="notice">Sila daftar kelas dahulu sebelum memasukkan murid.</p>
        ) : (
          <StudentForm schools={schools} classes={classes} />
        )}
      </section>

      <section className="panel">
        {students.length === 0 ? (
          <p className="empty">Belum ada murid. Tambah murid pertama menggunakan borang di atas.</p>
        ) : (
          <StudentList students={students} classes={classes} />
        )}
      </section>
    </AppFrame>
  );
}
