'use client';

import Link from 'next/link';
import { useActionState, useMemo, useState } from 'react';
import type { School, UserRecord } from '@/lib/data';
import { bulkUpdateUserStatusOnly, ensureUserLogin, updateUserStatusOnly } from './actions';

const statusOptions = ['MENUNGGU', 'AKTIF', 'DIGANTUNG'];
const bulkStatusInitialState = {
  ok: false,
  message: '',
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN_DAERAH: 'Admin Daerah',
    ADMIN_ZON: 'Admin Zon',
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

function compactActionMessage(message: string) {
  if (message.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    return 'Gagal: tambah SUPABASE_SERVICE_ROLE_KEY di Vercel dan redeploy.';
  }

  if (message.includes('RESEND_API_KEY') || message.includes('EMUMTAZ_EMAIL_FROM')) {
    return 'Akaun siap. Email belum diset.';
  }

  return message.length > 120 ? `${message.slice(0, 117)}...` : message;
}

function UserStatusSelect({ user }: { user: UserRecord }) {
  const [state, action] = useActionState(updateUserStatusOnly, bulkStatusInitialState);

  return (
    <form action={action} className="status-select-form">
      <input type="hidden" name="id" value={user.id} />
      <select
        name="status"
        defaultValue={user.status}
        aria-label={`Status ${user.nama}`}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {statusOptions.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      {state.message && (
        <small className={state.ok ? 'form-success' : 'form-message'}>{compactActionMessage(state.message)}</small>
      )}
    </form>
  );
}

function EnsureLoginButton({ user }: { user: UserRecord }) {
  const [state, action] = useActionState(ensureUserLogin, bulkStatusInitialState);

  if (user.role === 'OWNER' || user.status !== 'AKTIF') return null;

  return (
    <form action={action} className="inline-action-form">
      <input type="hidden" name="id" value={user.id} />
      <button className="button secondary table-action" type="submit">
        Sedia Login
      </button>
      {state.message && (
        <small className={state.ok ? 'form-success' : 'form-message'}>{compactActionMessage(state.message)}</small>
      )}
    </form>
  );
}

function UserTable({
  users,
  schoolNames,
  emptyText,
  bulkLabel,
}: {
  users: UserRecord[];
  schoolNames: Map<string, string>;
  emptyText: string;
  bulkLabel: string;
}) {
  const [bulkStatusState, bulkStatusAction] = useActionState(bulkUpdateUserStatusOnly, bulkStatusInitialState);
  const editableUsers = users.filter((user) => user.role !== 'OWNER');

  if (users.length === 0) {
    return <p className="empty">{emptyText}</p>;
  }

  return (
    <>
      {editableUsers.length > 0 && (
        <form action={bulkStatusAction} className="teacher-status-toolbar user-status-toolbar">
          <label>
            <span>{bulkLabel}</span>
            <select
              name="status"
              defaultValue=""
              onChange={(event) => {
                if (event.currentTarget.value) event.currentTarget.form?.requestSubmit();
              }}
            >
              <option value="">Pilih status</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          {editableUsers.map((user) => (
            <input key={user.id} type="hidden" name="user_ids" value={user.id} />
          ))}
          {bulkStatusState.message && (
            <p className={bulkStatusState.ok ? 'form-success' : 'form-message'}>{bulkStatusState.message}</p>
          )}
        </form>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Bil</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Akses</th>
              <th>Status</th>
              <th>Tindakan</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>
                  <Link className="text-link" href={`/pengguna/${user.id}`}>
                    {user.nama}
                  </Link>
                </td>
                <td>{user.email}</td>
                <td>{roleLabel(user.role)}</td>
                <td>{accessLabel(user, schoolNames)}</td>
                <td>
                  {user.role === 'OWNER' ? (
                    <span className={`status-badge status-${user.status.toLowerCase()}`}>
                      {statusLabel(user.status)}
                    </span>
                  ) : (
                    <UserStatusSelect user={user} />
                  )}
                </td>
                <td>
                  <div className="table-actions-stack">
                    <Link className="button secondary table-action" href={`/pengguna/${user.id}`}>
                      Profil
                    </Link>
                    <EnsureLoginButton user={user} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
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
        <UserTable
          users={pendingUsers}
          schoolNames={schoolNames}
          emptyText="Tiada permohonan baru."
          bulkLabel="Status Semua"
        />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Pengguna Aktif</h2>
          <span>{activeUsers.length} rekod</span>
        </div>
        <UserTable
          users={activeUsers}
          schoolNames={schoolNames}
          emptyText="Belum ada pengguna aktif."
          bulkLabel="Status Semua"
        />
      </section>

      {suspendedUsers.length > 0 && (
        <section className="panel">
          <div className="panel-head">
            <h2>Pengguna Digantung</h2>
            <span>{suspendedUsers.length} rekod</span>
          </div>
          <UserTable
            users={suspendedUsers}
            schoolNames={schoolNames}
            emptyText="Tiada pengguna digantung."
            bulkLabel="Status Semua"
          />
        </section>
      )}
    </>
  );
}
