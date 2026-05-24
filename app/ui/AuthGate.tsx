'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { canAccessPath, choosePrimaryProfile, uniqueAccessProfiles, type AccessProfile } from '@/lib/access';

const selectedProfileKey = 'emumtaz_selected_profile_id';
const publicPaths = ['/login', '/daftar', '/akses'];
const AccessProfileContext = createContext<AccessProfile | null>(null);

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 20000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error('Semakan akses mengambil masa terlalu lama.')), timeoutMs);
    }),
  ]);
}

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
    let cancelled = false;

    async function checkAccess() {
      try {
        setReady(false);
        setMessage('');
        setProfile(null);

        if (publicPaths.includes(pathname)) {
          if (!cancelled) setReady(true);
          return;
        }

        if (!hasSupabaseEnv || !supabase) {
          if (!cancelled) setReady(true);
          return;
        }

        const { data: sessionData } = await withTimeout(supabase.auth.getSession());
        const email = sessionData.session?.user.email;

        if (!email) {
          router.replace('/login');
          return;
        }

        const profileResult = await withTimeout(
          Promise.resolve(supabase
            .from('app_users')
            .select('id,email,nama,role,kod_sekolah,zon,status,allowed_nav,must_change_password')
            .eq('email', email.toLowerCase())
            .eq('status', 'AKTIF')
            .limit(10)),
        );
        const { data, error } = profileResult as {
          data: unknown[] | null;
          error: { message: string } | null;
        };

        if (cancelled) return;

        if (error) {
          setMessage('Ralat menyemak akses pengguna. Sila log masuk semula.');
          setReady(true);
          return;
        }

        const profiles = uniqueAccessProfiles((data ?? []) as AccessProfile[]);
        const selectedProfileId = window.localStorage.getItem(selectedProfileKey);
        const selectedProfile = selectedProfileId
          ? profiles.find((item) => item.id === selectedProfileId) ?? null
          : null;
        const activeProfile = selectedProfile ?? (profiles.length === 1 ? profiles[0] : choosePrimaryProfile(profiles));

        if (!activeProfile) {
          setMessage('Akaun anda belum diaktifkan oleh Admin.');
          setReady(true);
          return;
        }

        if (profiles.length > 1 && !selectedProfile) {
          router.replace('/akses');
          return;
        }

        if (activeProfile.must_change_password && pathname !== '/tukar-password') {
          router.replace('/tukar-password');
          return;
        }

        if (!canAccessPath(activeProfile.role, pathname, activeProfile.allowed_nav)) {
          setMessage('Anda tidak mempunyai akses kepada modul ini.');
          setReady(true);
          return;
        }

        setProfile(activeProfile);
        setReady(true);
      } catch {
        if (cancelled) return;
        setMessage('Semakan akses terganggu. Sila log masuk semula.');
        setReady(true);
      }
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
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
