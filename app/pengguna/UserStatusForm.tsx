'use client';

import { useFormStatus } from 'react-dom';
import { updateUserStatus } from './actions';

const statusOptions = [
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'DIGANTUNG', label: 'Digantung' },
];

const roleOptions = [
  { value: 'ADMIN_DAERAH', label: 'Admin Daerah' },
  { value: 'ADMIN_ZON', label: 'Pentadbir Zon' },
  { value: 'ADMIN_SEKOLAH', label: 'Admin Sekolah' },
  { value: 'GURU_KELAS', label: 'Guru Kelas' },
  { value: 'GURU_SUBJEK', label: 'Guru Subjek' },
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
  currentStatus,
  locked = false,
}: {
  userId: string;
  currentRole: string;
  currentStatus: string;
  locked?: boolean;
}) {
  if (locked) {
    return <span className="table-note">Dikunci</span>;
  }

  return (
    <form action={updateUserStatus} className="status-form">
      <input name="id" type="hidden" value={userId} />
      <select name="role" defaultValue={currentRole} aria-label="Role pengguna">
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
