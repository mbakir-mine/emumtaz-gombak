'use client';

import { useFormStatus } from 'react-dom';
import { deleteUserProfile } from './actions';
import { useAccessToken } from '../ui/useAccessToken';

function SubmitButton({ userName }: { userName: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="danger-button"
      type="submit"
      disabled={pending}
      onClick={(event) => {
        const confirmed = window.confirm(`Padam profil akses untuk ${userName}?`);
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      {pending ? 'Memadam...' : 'Padam Pengguna'}
    </button>
  );
}

export default function DeleteUserButton({
  userId,
  userName,
  locked = false,
}: {
  userId: string;
  userName: string;
  locked?: boolean;
}) {
  const accessToken = useAccessToken();

  if (locked) {
    return <span className="table-note">Akaun Pentadbir Utama tidak boleh dipadam.</span>;
  }

  return (
    <form action={deleteUserProfile}>
      <input name="id" type="hidden" value={userId} />
      <input name="access_token" type="hidden" value={accessToken} />
      <SubmitButton userName={userName} />
    </form>
  );
}
