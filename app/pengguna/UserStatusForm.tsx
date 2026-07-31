'use client';

import { useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { defaultAllowedNavForRole, navItems, type UserRole } from '@/lib/access';
import { updateUserStatus } from './actions';

const initialState = {
  ok: false,
  message: '',
};

const statusOptions = [
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'DIGANTUNG', label: 'Digantung' },
];

const roleOptions = [
  { value: 'ADMIN_DAERAH', label: 'Admin Daerah' },
  { value: 'ADMIN_ZON', label: 'Admin Zon' },
  { value: 'ADMIN_SEKOLAH', label: 'Admin Sekolah' },
  { value: 'GURU_KELAS', label: 'Guru Kelas' },
  { value: 'GURU_SUBJEK', label: 'Guru Subjek' },
];

const zoneOptions = [
  { value: 'BARAT', label: 'Zon Barat' },
  { value: 'TIMUR', label: 'Zon Timur' },
  { value: 'TENGAH', label: 'Zon Tengah' },
];

const accessOptions = navItems.filter((item) => !item.hidden && item.key !== 'dashboard');

function getRoleAccess(role: string) {
  return defaultAllowedNavForRole(role as UserRole);
}

function getSavedAccess(role: string, allowedNav?: string[] | null) {
  return Array.isArray(allowedNav) ? allowedNav : getRoleAccess(role);
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="button" type="submit" disabled={pending}>
      {pending ? 'Simpan...' : 'Simpan'}
    </button>
  );
}

export default function UserStatusForm({
  userId,
  currentRole,
  currentZon,
  currentStatus,
  currentAllowedNav,
  locked = false,
}: {
  userId: string;
  currentRole: string;
  currentZon?: string | null;
  currentStatus: string;
  currentAllowedNav?: string[] | null;
  locked?: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [zone, setZone] = useState(currentZon ?? '');
  const [status, setStatus] = useState(currentStatus);
  const [selectedAccess, setSelectedAccess] = useState<string[]>(getSavedAccess(currentRole, currentAllowedNav));
  const [state, action] = useActionState(updateUserStatus, initialState);

  function handleRoleChange(nextRole: string) {
    setRole(nextRole);
    setSelectedAccess(getRoleAccess(nextRole));
    if (nextRole !== 'ADMIN_ZON') {
      setZone('');
    }
  }

  function toggleAccess(key: string, checked: boolean) {
    setSelectedAccess((current) => {
      if (checked) {
        return current.includes(key) ? current : [...current, key];
      }

      return current.filter((item) => item !== key);
    });
  }

  if (locked) {
    return <span className="table-note">Dikunci</span>;
  }

  return (
    <form action={action} className="status-form">
      <input name="id" type="hidden" value={userId} />
      <select name="role" value={role} onChange={(event) => handleRoleChange(event.target.value)} aria-label="Role pengguna">
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {role === 'ADMIN_ZON' ? (
        <select
          name="zon"
          value={zone}
          onChange={(event) => setZone(event.target.value)}
          aria-label="Zon admin"
          required
        >
          <option value="">Pilih zon</option>
          {zoneOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input name="zon" type="hidden" value="" />
      )}
      <select
        name="status"
        value={status}
        onChange={(event) => setStatus(event.target.value)}
        aria-label="Status pengguna"
      >
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <fieldset className="access-checks">
        <legend>Akses Modul</legend>
        <div className="access-checks-toolbar">
          <span>{selectedAccess.length} akses dipilih</span>
          <button type="button" onClick={() => setSelectedAccess(getRoleAccess(role))}>
            Auto pilih ikut role
          </button>
        </div>
        {accessOptions.map((item) => (
          <label key={item.key}>
            <input
              name="allowed_nav"
              type="checkbox"
              value={item.key}
              checked={selectedAccess.includes(item.key)}
              onChange={(event) => toggleAccess(item.key, event.target.checked)}
            />
            {item.label}
          </label>
        ))}
        <small>Sistem auto pilih akses berdasarkan role. Pilihan ini masih boleh diubah secara manual jika perlu.</small>
      </fieldset>
      <SubmitButton />
      {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}
    </form>
  );
}
