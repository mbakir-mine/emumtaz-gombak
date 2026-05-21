import AppFrame from '../ui/AppFrame';
import TeacherClassForm from './TeacherClassForm';
import {
  getClasses,
  getSchoolUsers,
  getSchools,
  getTeacherClassAssignments,
} from '@/lib/data';

export default async function GuruKelasPage() {
  const [schools, classes, users, assignments] = await Promise.all([
    getSchools(),
    getClasses(),
    getSchoolUsers(),
    getTeacherClassAssignments(),
  ]);

  return (
    <AppFrame title="Tetapan Guru Kelas" active="teacherClasses">
      <section className="panel">
        <div className="panel-head">
          <h2>Tetapkan Guru Kelas</h2>
          <span>Guru kepada kelas</span>
        </div>
        <TeacherClassForm schools={schools} classes={classes} users={users} />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Senarai Guru Kelas</h2>
          <span>{assignments.length} rekod</span>
        </div>
        {assignments.length === 0 ? (
          <p className="empty">Belum ada tetapan guru kelas.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Kelas</th>
                <th>Guru</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {assignments.map((item) => (
                <tr key={item.id}>
                  <td>{item.classes?.kod_sekolah}</td>
                  <td>
                    Tahun {item.classes?.tahun} - {item.classes?.nama_kelas}
                  </td>
                  <td>{item.users?.nama}</td>
                  <td>{item.users?.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

