'use client';

import { useMemo, useState } from 'react';
import type { UserRecord } from '@/lib/data';

export default function TeacherList({ users }: { users: UserRecord[] }) {
  const [query, setQuery] = useState('');
  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [user.kod_sekolah, user.nama, user.email, user.role, user.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [query, users]);

  return (
    <>
      <div className="panel-head">
        <h2>Senarai Pengguna Sekolah</h2>
        <span>
          {filteredUsers.length} / {users.length} rekod
        </span>
      </div>
      <div className="search-row">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cari sekolah, nama guru, email, role atau status"
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
                <th>Sekolah</th>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
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
        </div>
      )}
    </>
  );
}
