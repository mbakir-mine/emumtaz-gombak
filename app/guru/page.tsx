import AppFrame from '../ui/AppFrame';
import TeacherForm from './TeacherForm';
import { getSchoolUsers, getSchools } from '@/lib/data';

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
        <div className="panel-head">
          <h2>Senarai Pengguna Sekolah</h2>
          <span>{users.length} rekod</span>
        </div>
        {users.length === 0 ? (
          <p className="empty">Belum ada guru atau admin sekolah.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sekolah</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.kod_sekolah}</td>
                  <td>{user.nama}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </AppFrame>
  );
}

