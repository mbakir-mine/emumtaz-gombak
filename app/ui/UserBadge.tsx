'use client';

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
      <button type="button" onClick={logout}>
        Keluar
      </button>
    </div>
  );
}
