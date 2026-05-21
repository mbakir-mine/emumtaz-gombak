'use client';

import { useMemo, useState } from 'react';
import type { School, UserRecord } from '@/lib/data';
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

function accessLabel(user: UserRecord, schoolNames: Map<string, string>) {
  if (user.kod_sekolah) {
    return `${user.kod_sekolah} - ${schoolNames.get(user.kod_sekolah) ?? 'Sekolah'}`;
  }

  if (user.zon) {
    return `Zon ${user.zon.charAt(0) + user.zon.slice(1).toLowerCase()}`;
  }

  return 'Semua sekolah';
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
              <td>{accessLabel(user, schoolNames)}</td>
              <td>
                <span className={`status-badge status-${user.status.toLowerCase()}`}>{statusLabel(user.status)}</span>
              </td>
              <td>
                <UserStatusForm
                  userId={user.id}
                  currentRole={user.role}
                  currentStatus={user.status}
                  locked={user.role === 'OWNER'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function UserApprovalList({ users, schools }: { users: UserRecord[]; schools: School[] }) {
  const [query, setQuery] = useState('');
  const schoolNames = useMemo(() => new Map(schools.map((school) => [school.kod_sekolah, school.nama_sekolah])), [schools]);
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [user.nama, user.email, roleLabel(user.role), user.role, accessLabel(user, schoolNames), statusLabel(user.status), user.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, schoolNames, users]);

  const pendingUsers = filteredUsers.filter((user) => user.status === 'MENUNGGU');
  const activeUsers = filteredUsers.filter((user) => user.status === 'AKTIF');
  const suspendedUsers = filteredUsers.filter((user) => user.status === 'DIGANTUNG');

  return (
    <>
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
          <strong>{filteredUsers.length}</strong>
          <small>Daripada {users.length} profil app_users</small>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Carian Pengguna</h2>
          <span>{filteredUsers.length} rekod ditemui</span>
        </div>
        <div className="search-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari nama, email, role, sekolah, zon atau status"
            aria-label="Cari pengguna"
          />
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
    </>
  );
}
