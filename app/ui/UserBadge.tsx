'use client';

import Link from 'next/link';
import { roleLabel } from '@/lib/access';
import { useAccessProfile } from './AuthGate';

export default function UserBadge() {
  const profile = useAccessProfile();

  return (
    <div className="user-badge">
      <div className="user-badge-info">
        <strong>{profile ? roleLabel(profile.role) : 'Pengguna'}</strong>
        {profile?.nama && <small>{profile.nama}</small>}
        <Link className="user-profile-link" href="/profil">
          Kemaskini Profil
        </Link>
      </div>
      <div className="user-badge-actions">
        <Link className="user-switch-link" href="/akses">
          Tukar Akses
        </Link>
      </div>
    </div>
  );
}
