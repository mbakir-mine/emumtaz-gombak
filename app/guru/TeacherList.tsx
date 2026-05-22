'use client';

import { useMemo, useState } from 'react';
import type { School, UserRecord } from '@/lib/data';
import { roleLabel } from '@/lib/access';
import { useAccessProfile } from '../ui/AuthGate';
import { scopeUsers } from '../ui/scopedData';

function accessLabel(user: UserRecord) {
  if (user.role === 'ADMIN_DAERAH') return 'Semua sekolah';
  if (user.role === 'ADMIN_ZON') {
    return user.zon ? `Zon ${user.zon.charAt(0) + user.zon.slice(1).toLowerCase()}` : 'Zon belum ditetapkan';
  }
  return user.kod_sekolah ?? '-';
}

export default function TeacherList({ users, schools }: { users: UserRecord[]; schools: School[] }) {
  const profile = useAccessProfile();
  const [query, setQuery] = useState('');
  const scopedUsers = useMemo(() => scopeUsers(profile, users, schools), [profile, schools, users]);
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return scopedUsers;

    return scopedUsers.filter((user) =>
      [accessLabel(user), user.nama, user.email, roleLabel(user.role), user.role, user.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, scopedUsers]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Pengguna Sekolah</h2>
        <span>
          {filteredUsers.length} / {scopedUsers.length} rekod
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari akses, nama guru, email, role atau status"
          aria-label="Cari guru"
        />
      </div>
      {filteredUsers.length === 0 ? (
        <p className="empty">Tiada pengguna sekolah sepadan dengan carian.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Akses</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{accessLabel(user)}</td>
                  <td>{user.nama}</td>
                  <td>{user.email}</td>
                  <td>{roleLabel(user.role)}</td>
                  <td>{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
