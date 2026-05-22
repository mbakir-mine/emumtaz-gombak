import AppFrame from '../ui/AppFrame';
import TeacherForm from './TeacherForm';
import TeacherImportForm from './TeacherImportForm';
import { getSchoolUsers, getSchools } from '@/lib/data';
import TeacherList from './TeacherList';

export default async function GuruPage() {
  const [schools, users] = await Promise.all([getSchools(), getSchoolUsers()]);

  return (
    <AppFrame title="Guru & Pengguna" subtitle="Akaun, peranan dan sekolah." active="teachers">
      <section className="panel">
        <div className="panel-head">
          <h2>Tambah Guru</h2>
          <span>Profil akses sekolah</span>
        </div>
        <TeacherForm schools={schools} />
      </section>

      <section className="panel">
        <TeacherImportForm />
      </section>

      <section className="panel">
        {users.length === 0 ? (
          <p className="empty">Belum ada guru atau admin sekolah.</p>
        ) : (
          <TeacherList users={users} schools={schools} />
        )}
      </section>
    </AppFrame>
  );
}
