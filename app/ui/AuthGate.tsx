'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { canAccessPath, choosePrimaryProfile, type AccessProfile } from '@/lib/access';

const publicPaths = ['/login', '/daftar'];
const AccessProfileContext = createContext<AccessProfile | null>(null);

export function useAccessProfile() {
  return useContext(AccessProfileContext);
}

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<AccessProfile | null>(null);

  useEffect(() => {
    async function checkAccess() {
      setReady(false);
      setMessage('');
      setProfile(null);

      if (publicPaths.includes(pathname)) {
        setReady(true);
        return;
      }

      if (!hasSupabaseEnv || !supabase) {
        setReady(true);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const email = sessionData.session?.user.email;

      if (!email) {
        router.replace('/login');
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('id,email,nama,role,kod_sekolah,status')
        .eq('email', email.toLowerCase())
        .eq('status', 'AKTIF');

      if (error) {
        setMessage('Ralat menyemak akses pengguna. Sila cuba semula.');
        setReady(true);
        return;
      }

      const activeProfile = choosePrimaryProfile((data ?? []) as AccessProfile[]);

      if (!activeProfile) {
        setMessage('Akaun anda belum diaktifkan oleh Pentadbir.');
        setReady(true);
        return;
      }

      if (!canAccessPath(activeProfile.role, pathname)) {
        setMessage('Anda tidak mempunyai akses kepada modul ini.');
        setReady(true);
        return;
      }

      setProfile(activeProfile);
      setReady(true);
    }

    checkAccess();
  }, [pathname, router]);

  if (!ready) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz Gombak</strong>
              <span>Menyemak akses pengguna</span>
            </div>
          </div>
          <p className="login-copy">Sila tunggu sebentar.</p>
        </section>
      </main>
    );
  }

  if (message) {
    return (
      <main className="login-page">
        <section className="login-card">
          <div className="login-brand">
            <div className="brand-mark">eM</div>
            <div>
              <strong>e-Mumtaz Gombak</strong>
              <span>Akses pengguna</span>
            </div>
          </div>
          <div className="notice">{message}</div>
          <button
            className="button login-register-link"
            type="button"
            onClick={async () => {
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

  return <AccessProfileContext.Provider value={profile}>{children}</AccessProfileContext.Provider>;
}
