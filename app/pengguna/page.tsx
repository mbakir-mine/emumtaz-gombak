import AppFrame from '../ui/AppFrame';
import { getAllAppUsers, getSchools, type UserRecord } from '@/lib/data';
import UserStatusForm from './UserStatusForm';

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN_DAERAH: 'Admin Daerah',
    ADMIN_ZON: 'Pentadbir Zon',
    ADMIN_SEKOLAH: 'Admin Sekolah',
    GURU_KELAS: 'Guru Kelas',
    GURU_SUBJEK: 'Guru Subjek',
  };

  return labels[role] ?? role;
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    AKTIF: 'Aktif',
    MENUNGGU: 'Menunggu',
    DIGANTUNG: 'Digantung',
  };

  return labels[status] ?? status;
}

function UserTable({
  users,
  schoolNames,
  emptyText,
}: {
  users: UserRecord[];
  schoolNames: Map<string, string>;
  emptyText: string;
}) {
  if (users.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Nama</th>
            <th>Email</th>
            <th>Role</th>
            <th>Akses</th>
            <th>Status</th>
            <th>Tindakan</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.nama}</td>
              <td>{user.email}</td>
              <td>{roleLabel(user.role)}</td>
              <td>
                {user.kod_sekolah
                  ? `${user.kod_sekolah} - ${schoolNames.get(user.kod_sekolah) ?? 'Sekolah'}`
                  : user.zon
                    ? `Zon ${user.zon.charAt(0) + user.zon.slice(1).toLowerCase()}`
                    : 'Semua sekolah'}
              </td>
              <td>
                <span className={`status-badge status-${user.status.toLowerCase()}`}>{statusLabel(user.status)}</span>
              </td>
              <td>
                <UserStatusForm userId={user.id} currentStatus={user.status} locked={user.role === 'OWNER'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function PenggunaPage() {
  const [users, schools] = await Promise.all([getAllAppUsers(), getSchools()]);
  const schoolNames = new Map(schools.map((school) => [school.kod_sekolah, school.nama_sekolah]));
  const pendingUsers = users.filter((user) => user.status === 'MENUNGGU');
  const activeUsers = users.filter((user) => user.status === 'AKTIF');
  const suspendedUsers = users.filter((user) => user.status === 'DIGANTUNG');

  return (
    <AppFrame title="Pengesahan Pengguna" active="users">
      <section className="metric-grid">
        <div className="metric">
          <span>Menunggu</span>
          <strong>{pendingUsers.length}</strong>
          <small>Akaun baru perlu disemak</small>
        </div>
        <div className="metric">
          <span>Aktif</span>
          <strong>{activeUsers.length}</strong>
          <small>Boleh akses sistem</small>
        </div>
        <div className="metric">
          <span>Digantung</span>
          <strong>{suspendedUsers.length}</strong>
          <small>Akses disekat sementara</small>
        </div>
        <div className="metric">
          <span>Jumlah</span>
          <strong>{users.length}</strong>
          <small>Semua profil app_users</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Permohonan Menunggu</h2>
          <span>{pendingUsers.length} rekod</span>
        </div>
        <UserTable users={pendingUsers} schoolNames={schoolNames} emptyText="Tiada permohonan baru." />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Pengguna Aktif</h2>
          <span>{activeUsers.length} rekod</span>
        </div>
        <UserTable users={activeUsers} schoolNames={schoolNames} emptyText="Belum ada pengguna aktif." />
      </section>

      {suspendedUsers.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Pengguna Digantung</h2>
            <span>{suspendedUsers.length} rekod</span>
          </div>
          <UserTable users={suspendedUsers} schoolNames={schoolNames} emptyText="Tiada pengguna digantung." />
        </section>
      )}
    </AppFrame>
  );
}
