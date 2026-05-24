'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabel, uniqueAccessProfiles, type AccessProfile } from '@/lib/access';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

const selectedProfileKey = 'emumtaz_selected_profile_id';

function accessText(profile: AccessProfile) {
  if (profile.role === 'ADMIN_DAERAH' || profile.role === 'OWNER') return 'Semua sekolah';
  if (profile.role === 'ADMIN_ZON') return profile.zon ? `Zon ${profile.zon}` : 'Zon belum ditetapkan';
  return profile.kod_sekolah ?? 'Sekolah belum ditetapkan';
}

export default function AksesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfiles() {
      if (!hasSupabaseEnv || !supabase) {
        setMessage('Tetapan Supabase belum lengkap.');
        setLoading(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user.email?.toLowerCase();

      if (!email) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id,email,nama,role,kod_sekolah,zon,status,allowed_nav,must_change_password')
        .eq('email', email)
        .eq('status', 'AKTIF')
        .order('role');

      if (error) {
        setMessage('Ralat membaca profil akses.');
        setLoading(false);
        return;
      }

      const activeProfiles = uniqueAccessProfiles((data ?? []) as AccessProfile[]);
      if (activeProfiles.length === 0) {
        setMessage('Tiada profil aktif ditemui untuk email ini.');
        setLoading(false);
        return;
      }

      if (activeProfiles.length === 1) {
        window.localStorage.setItem(selectedProfileKey, activeProfiles[0].id);
        router.replace('/');
        return;
      }

      setProfiles(activeProfiles);
      setLoading(false);
    }

    loadProfiles();
  }, [router]);

  function chooseProfile(profile: AccessProfile) {
    window.localStorage.setItem(selectedProfileKey, profile.id);
    router.push('/');
  }

  return (
    <main className="login-page">
      <section className="login-card access-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>e-Mumtaz Gombak</strong>
            <span>Pilih akses pengguna</span>
          </div>
        </div>

        <h1>Pilih Akses</h1>
        <p className="login-copy">Pilih peranan yang ingin digunakan untuk sesi ini.</p>

        {loading ? <p className="login-copy">Sila tunggu sebentar.</p> : null}
        {message ? <div className="notice">{message}</div> : null}

        <div className="access-choice-grid">
          {profiles.map((profile) => (
            <button key={profile.id} type="button" className="access-choice-card" onClick={() => chooseProfile(profile)}>
              <span>{roleLabel(profile.role)}</span>
              <strong>{profile.nama}</strong>
              <small>{accessText(profile)}</small>
            </button>
          ))}
        </div>

        <button
          className="button secondary login-register-link"
          type="button"
          onClick={async () => {
            window.localStorage.removeItem(selectedProfileKey);
            await supabase?.auth.signOut();
            router.replace('/login');
          }}
        >
          Kembali ke Login
        </button>
      </section>
    </main>
  );
}
