'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

type Profile = {
  nama: string;
  role: string;
};

function roleLabel(role: string) {
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN_DAERAH: 'Admin Daerah',
    ADMIN_SEKOLAH: 'Admin Sekolah',
    GURU_KELAS: 'Guru Kelas',
    GURU_SUBJEK: 'Guru Subjek',
  };

  return labels[role] ?? role;
}

export default function UserBadge() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!hasSupabaseEnv || !supabase) return;

      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user.email;
      if (!email) return;

      const { data } = await supabase
        .from('app_users')
        .select('nama,role,status')
        .eq('email', email.toLowerCase())
        .eq('status', 'AKTIF')
        .order('role')
        .limit(1);

      if (data?.[0]) {
        setProfile({
          nama: data[0].nama,
          role: data[0].role,
        });
      }
    }

    loadProfile();
  }, []);

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
