'use client';

import { roleLabel } from '@/lib/access';
import { useAccessProfile } from './AuthGate';

export default function UserBadge() {
  const profile = useAccessProfile();

  return (
    <div className="user-badge">
      <div>
        <strong>{profile ? roleLabel(profile.role) : 'Pengguna'}</strong>
        {profile?.nama && <small>{profile.nama}</small>}
      </div>
    </div>
  );
}
