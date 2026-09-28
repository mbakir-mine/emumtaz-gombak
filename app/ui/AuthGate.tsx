'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { canAccessPath, type AccessProfile } from '@/lib/access';
import { optionalSchoolModules, type OptionalSchoolModuleKey } from '@/lib/schoolModules';
import { evaluateLicenseAccess, licenseAllowsAccess } from '@/lib/licensing';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

const publicPaths = ['/login', '/daftar', '/akses'];
const selectedProfileKey = 'emumtaz_selected_profile_id';
const AccessProfileContext = createContext<AccessProfile | null>(null);
let accessCache: AccessProfile | null = null;

type SessionResponse = {
  authenticated?: boolean;
  user?: { id: string; email: string; name: string; role: string; status: string; kod_sekolah: string | null; zon: string | null; daerah?: string | null; allowed_nav?: string[] | null; must_change_password?: boolean };
  enabled_modules?: OptionalSchoolModuleKey[];
  license?: { plan_code: string; status: string; starts_on: string; ends_on: string | null } | null;
};

export function useAccessProfile() { return useContext(AccessProfileContext); }

function allowed(profile: AccessProfile, pathname: string) {
  if (profile.must_change_password && pathname !== '/tukar-password') return false;
  return canAccessPath(profile.role, pathname, profile.allowed_nav, profile.enabled_modules);
}

function clearCache() { accessCache = null; try { window.localStorage.removeItem(selectedProfileKey); } catch { /* storage unavailable */ } }

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [profile, setProfile] = useState<AccessProfile | null>(accessCache && allowed(accessCache, pathname) ? accessCache : null);
  const [ready, setReady] = useState(publicPaths.includes(pathname) || Boolean(profile));
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (publicPaths.includes(pathname)) { setReady(true); return; }
      const base = getTrustedSelfHostedUrl();
      if (!base) { setMessage('Backend self-hosted belum disambungkan.'); setReady(true); return; }
      setReady(false); setMessage('');
      try {
        const response = await fetch(`${base}/api/auth/session`, { credentials: 'include', cache: 'no-store' });
        const result = response.ok ? await response.json() as SessionResponse : null;
        if (cancelled) return;
        if (!result?.authenticated || !result.user || result.user.status !== 'AKTIF') { clearCache(); router.replace('/login'); return; }
        if (result.license && !licenseAllowsAccess(evaluateLicenseAccess(result.license, new Date().toISOString().slice(0, 10)))) {
          setMessage('Lesen sekolah telah tamat, belum bermula atau digantung. Sila hubungi Pemilik Sistem.'); setReady(true); return;
        }
        const enabledModules = result.user.role === 'OWNER' ? optionalSchoolModules.map((item) => item.key) : (result.enabled_modules ?? []);
        const next: AccessProfile = { id: result.user.id, email: result.user.email, nama: result.user.name, role: result.user.role as AccessProfile['role'], kod_sekolah: result.user.kod_sekolah, daerah: result.user.daerah ?? null, zon: result.user.zon, status: result.user.status, allowed_nav: result.user.allowed_nav ?? null, must_change_password: result.user.must_change_password ?? false, enabled_modules: enabledModules };
        accessCache = next; setProfile(next); setReady(true);
        if (next.must_change_password && pathname !== '/tukar-password') { router.replace('/tukar-password'); return; }
        if (!allowed(next, pathname)) router.replace('/');
      } catch {
        if (!cancelled) { setMessage('Semakan akses terganggu. Sila log masuk semula.'); setReady(true); }
      }
    }
    void check();
    return () => { cancelled = true; };
  }, [pathname, router]);

  if (!ready) return <main className="login-page"><section className="login-card"><div className="login-brand"><div className="brand-mark">eM</div><div><strong>e-Mumtaz</strong><span>Menyemak akses pengguna</span></div></div><p className="login-copy">Sila tunggu sebentar.</p></section></main>;
  if (message) return <main className="login-page"><section className="login-card"><div className="login-brand"><div className="brand-mark">eM</div><div><strong>e-Mumtaz</strong><span>Akses pengguna</span></div></div><div className="notice">{message}</div><button className="button login-register-link" type="button" onClick={() => router.replace('/login')}>Kembali ke Login</button></section></main>;
  return <AccessProfileContext.Provider value={profile}>{children}</AccessProfileContext.Provider>;
}
