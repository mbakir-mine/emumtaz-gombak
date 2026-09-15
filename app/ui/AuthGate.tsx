'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { hasSupabaseEnv, supabase, syncServerSession } from '@/lib/supabase';
import { canAccessPath, choosePrimaryProfile, uniqueAccessProfiles, type AccessProfile } from '@/lib/access';
import { optionalSchoolModules } from '@/lib/schoolModules';
import type { OptionalSchoolModuleKey } from '@/lib/schoolModules';
import { evaluateLicenseAccess, licenseAllowsAccess, modulesAllowedByLicense } from '@/lib/licensing';

const selectedProfileKey = 'emumtaz_selected_profile_id';
const serverSessionReadyKey = 'emumtaz_server_session_ready';
const publicPaths = ['/login', '/daftar', '/akses'];
const accessCacheTtlMs = 5 * 60 * 1000;
const AccessProfileContext = createContext<AccessProfile | null>(null);

type AccessCache = {
  profile: AccessProfile;
  selectedProfileId: string | null;
  cachedAt: number;
};

// AppFrame is recreated for each page, but this client module remains loaded during
// Next.js navigation. Reuse the verified snapshot so menu clicks do not blank the
// whole screen while repeating the same Supabase access and licence queries.
let accessCache: AccessCache | null = null;

function readAccessCache() {
  if (typeof window === 'undefined' || !accessCache) return null;

  try {
    const selectedProfileId = window.localStorage.getItem(selectedProfileKey);
    if (selectedProfileId === accessCache.selectedProfileId) return accessCache;
  } catch {
    // Discard the snapshot when browser storage is unavailable.
  }

  accessCache = null;
  return null;
}

function profileCanAccessPath(profile: AccessProfile, pathname: string) {
  if (profile.must_change_password && pathname !== '/tukar-password') return false;
  return canAccessPath(profile.role, pathname, profile.allowed_nav, profile.enabled_modules);
}

function hasConfirmedServerSession() {
  try {
    return window.sessionStorage.getItem(serverSessionReadyKey) === '1';
  } catch {
    return false;
  }
}

function confirmServerSession() {
  try {
    window.sessionStorage.setItem(serverSessionReadyKey, '1');
  } catch {
    // A reload still gives the server a chance to read the newly-set cookie.
  }
}

function clearConfirmedServerSession() {
  try {
    window.sessionStorage.removeItem(serverSessionReadyKey);
  } catch {
    // Storage may be disabled by the browser.
  }
}

function clearAccessCache() {
  accessCache = null;
}

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
  const initialCachedProfile = readAccessCache()?.profile ?? null;
  const canUseInitialProfile = initialCachedProfile
    ? profileCanAccessPath(initialCachedProfile, pathname)
    : false;
  const [ready, setReady] = useState(publicPaths.includes(pathname) || canUseInitialProfile);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<AccessProfile | null>(canUseInitialProfile ? initialCachedProfile : null);

  useEffect(() => {
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Supabase may briefly emit a null session while initializing or refreshing.
      // Never clear the server cookie unless the user explicitly signed out.
      if (!session && event !== 'SIGNED_OUT') return;
      if (event === 'SIGNED_OUT') {
        clearConfirmedServerSession();
        clearAccessCache();
      }
      window.setTimeout(() => {
        void syncServerSession(session?.access_token ?? null)
          .then((changed) => {
            if (changed) {
              confirmServerSession();
              window.location.reload();
            }
          })
          .catch(() => undefined);
      }, 0);
    });

    return () => data.subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      const cached = readAccessCache();
      const cachedProfile = cached?.profile ?? null;
      const canUseCachedProfile = cachedProfile ? profileCanAccessPath(cachedProfile, pathname) : false;

      try {
        setMessage('');

        if (publicPaths.includes(pathname)) {
          if (!cancelled) setReady(true);
          return;
        }

        if (cachedProfile && !canUseCachedProfile) {
          if (cachedProfile.must_change_password && pathname !== '/tukar-password') {
            router.replace('/tukar-password');
          } else {
            router.replace('/');
          }
          return;
        }

        if (canUseCachedProfile) {
          setProfile(cachedProfile);
          setReady(true);

          // Refresh older permissions in the background. Fresh snapshots make the
          // normal menu path entirely local and immediately renderable.
          if (cached && Date.now() - cached.cachedAt < accessCacheTtlMs) return;
        } else {
          setReady(false);
          setProfile(null);
        }

        if (!hasSupabaseEnv || !supabase) {
          if (!cancelled) setReady(true);
          return;
        }

        const { data: sessionData } = await withTimeout(supabase.auth.getSession());
        const user = sessionData.session?.user;
        const email = user?.email;

        if (!email) {
          clearAccessCache();
          router.replace('/login');
          return;
        }
        const serverSessionChanged = await syncServerSession(sessionData.session?.access_token ?? null);
        // The page can be prefetched before the HttpOnly session cookie is available to server components.
        // Reload once per browser tab after the cookie is confirmed so protected data is not rendered as empty.
        if (serverSessionChanged || !hasConfirmedServerSession()) {
          confirmServerSession();
          window.location.reload();
          return;
        }
        const profileFilter = user?.id
          ? `auth_user_id.eq.${user.id},email.ilike.${email.toLowerCase()}`
          : `email.ilike.${email.toLowerCase()}`;

        const profileResult = await withTimeout(
          Promise.resolve(
            supabase
              .from('app_users')
              .select('id,email,nama,role,kod_sekolah,daerah,zon,status,allowed_nav,must_change_password')
              .or(profileFilter)
              .eq('status', 'AKTIF')
              .limit(10),
          ),
        );
        let { data, error } = profileResult as {
          data: unknown[] | null;
          error: { message: string } | null;
        };

        if (error?.message?.includes('must_change_password')) {
          const fallbackResult = await withTimeout(
            Promise.resolve(
              supabase
                .from('app_users')
                .select('id,email,nama,role,kod_sekolah,daerah,zon,status,allowed_nav')
                .or(profileFilter)
                .eq('status', 'AKTIF')
                .limit(10),
            ),
          );
          const fallback = fallbackResult as {
            data: unknown[] | null;
            error: { message: string } | null;
          };
          data = (fallback.data ?? []).map((item) => ({ ...(item as object), must_change_password: false }));
          error = fallback.error;
        }

        if (cancelled) return;

        if (error) {
          if (canUseCachedProfile) return;
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
          clearAccessCache();
          setMessage('Akaun anda belum diaktifkan oleh Admin.');
          setReady(true);
          return;
        }

        if (profiles.length > 1 && !selectedProfile) {
          clearAccessCache();
          router.replace('/akses');
          return;
        }

        let licensePlanCode: string | null = null;
        if (!['OWNER', 'ADMIN_DAERAH', 'ADMIN_ZON'].includes(activeProfile.role) && activeProfile.kod_sekolah) {
          const licenseResult = await withTimeout(
            Promise.resolve(
              supabase
                .from('school_licenses')
                .select('plan_code,status,starts_on,ends_on')
                .eq('kod_sekolah', activeProfile.kod_sekolah)
                .maybeSingle(),
            ),
          );
          const license = licenseResult as {
            data: { plan_code: string; status: string; starts_on: string; ends_on: string | null } | null;
            error: { message: string } | null;
          };

          if (license.error) {
            if (canUseCachedProfile) return;
            setMessage('Status lesen sekolah tidak dapat disahkan. Sila hubungi Pemilik Sistem.');
            setReady(true);
            return;
          }

          // No row means legacy access. Once a licence is assigned it is enforced fail-closed.
          if (license.data) {
            licensePlanCode = license.data.plan_code;
            const state = evaluateLicenseAccess(license.data, new Date().toISOString().slice(0, 10));
            if (!licenseAllowsAccess(state)) {
              clearAccessCache();
              setMessage('Lesen sekolah telah tamat, belum bermula atau digantung. Sila hubungi Pemilik Sistem.');
              setReady(true);
              return;
            }
          }
        }

        let enabledModules: OptionalSchoolModuleKey[] = [];
        if (activeProfile.role === 'OWNER') {
          enabledModules = optionalSchoolModules.map((module) => module.key);
        } else if (activeProfile.role === 'ADMIN_DAERAH') {
          enabledModules = ['PERCUBAAN_PSRA', 'PERCUBAAN_UPKK'];
        } else if (activeProfile.kod_sekolah) {
          const moduleResult = await withTimeout(
            Promise.resolve(
              supabase
                .from('school_module_access')
                .select('module_key')
                .eq('kod_sekolah', activeProfile.kod_sekolah)
                .eq('enabled', true),
            ),
          );
          const modules = moduleResult as {
            data: { module_key: OptionalSchoolModuleKey }[] | null;
            error: { message: string } | null;
          };

          const configuredModules = modules.error ? [] : (modules.data ?? []).map((item) => item.module_key);
          enabledModules = modulesAllowedByLicense(licensePlanCode, configuredModules);
        }

        const enrichedProfile: AccessProfile = {
          ...activeProfile,
          enabled_modules: enabledModules,
        };

        accessCache = {
          profile: enrichedProfile,
          selectedProfileId,
          cachedAt: Date.now(),
        };

        if (activeProfile.must_change_password && pathname !== '/tukar-password') {
          router.replace('/tukar-password');
          return;
        }

        if (!canAccessPath(enrichedProfile.role, pathname, enrichedProfile.allowed_nav, enrichedProfile.enabled_modules)) {
          router.replace('/');
          return;
        }

        setProfile(enrichedProfile);
        setReady(true);
      } catch {
        if (cancelled) return;
        if (canUseCachedProfile) return;
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
              <strong>e-Mumtaz</strong>
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
              <strong>e-Mumtaz</strong>
              <span>Akses pengguna</span>
            </div>
          </div>
          <div className="notice">{message}</div>
          <button
            className="button login-register-link"
            type="button"
            onClick={async () => {
              await supabase?.auth.signOut();
              await syncServerSession(null);
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
