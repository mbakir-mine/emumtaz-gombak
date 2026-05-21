'use client';

import { useFormStatus } from 'react-dom';
import { updateUserStatus } from './actions';

const statusOptions = [
  { value: 'MENUNGGU', label: 'Menunggu' },
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'DIGANTUNG', label: 'Digantung' },
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
  currentStatus,
  locked = false,
}: {
  userId: string;
  currentStatus: string;
  locked?: boolean;
}) {
  if (locked) {
    return <span className="table-note">Dikunci</span>;
  }

  return (
    <form action={updateUserStatus} className="status-form">
      <input name="id" type="hidden" value={userId} />
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
