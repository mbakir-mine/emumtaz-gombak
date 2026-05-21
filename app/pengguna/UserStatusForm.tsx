'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateUserStatus } from './actions';

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
  locked = false,
}: {
  userId: string;
  currentRole: string;
  currentZon?: string | null;
  currentStatus: string;
  locked?: boolean;
}) {
  const [role, setRole] = useState(currentRole);
  const [zone, setZone] = useState(currentZon ?? '');

  if (locked) {
    return <span className="table-note">Dikunci</span>;
  }

  return (
    <form action={updateUserStatus} className="status-form">
      <input name="id" type="hidden" value={userId} />
      <select name="role" value={role} onChange={(event) => setRole(event.target.value)} aria-label="Role pengguna">
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
      <select name="status" defaultValue={currentStatus} aria-label="Status pengguna">
        {statusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <SubmitButton />
    </form>
  );
}
