'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { roleLabel } from '@/lib/access';
import { supabase } from '@/lib/supabase';
import { useAccessProfile } from './AuthGate';

export default function UserBadge() {
  const router = useRouter();
  const profile = useAccessProfile();

  async function logout() {
    await supabase?.auth.signOut();
    router.replace('/login');
  }

  return (
    <div className="user-badge">
      <div>
        <strong>{profile ? roleLabel(profile.role) : 'Pengguna'}</strong>
        {profile?.nama && <small>{profile.nama}</small>}
      </div>
      <Link className="user-badge-link" href="/tukar-password">
        Tukar Password
      </Link>
      <button type="button" onClick={logout}>
        Keluar
      </button>
    </div>
  );
}
