import AppFrame from '../ui/AppFrame';
import TeacherForm from './TeacherForm';
import { getSchoolUsers, getSchools } from '@/lib/data';
import TeacherList from './TeacherList';

export default async function GuruPage() {
  const [schools, users] = await Promise.all([getSchools(), getSchoolUsers()]);

  return (
    <AppFrame title="Daftar Guru" active="teachers">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Guru</h2>
          <span>Profil akses sekolah</span>
        </div>
        <TeacherForm schools={schools} />
      </section>

      <section className="panel">
        {users.length === 0 ? (
          <p className="empty">Belum ada guru atau admin sekolah.</p>
        ) : (
          <TeacherList users={users} />
        )}
      </section>
    </AppFrame>
  );
}
