'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { roleLabel, type AccessProfile } from '@/lib/access';
import { getTrustedSelfHostedUrl } from '@/lib/trustedSelfHostedUrl';

const selectedProfileKey = 'emumtaz_selected_profile_id';

function accessText(profile: AccessProfile) {
  if (profile.role === 'ADMIN_DAERAH' || profile.role === 'OWNER') return 'Semua sekolah';
  if (profile.role === 'ADMIN_ZON') return profile.zon ? `Zon ${profile.zon}` : 'Zon belum ditetapkan';
  return profile.kod_sekolah ?? 'Sekolah belum ditetapkan';
}

export default function AksesPage() {
  const router = useRouter();
  const [profiles] = useState<AccessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    async function loadProfiles() {
      const selfHostedUrl = getTrustedSelfHostedUrl();
      if (!selfHostedUrl) {
        setMessage('Backend Laravel belum dikonfigurasi.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${selfHostedUrl}/api/auth/session`, { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => null) as { authenticated?: boolean } | null;
      if (!payload?.authenticated) {
        router.replace('/login');
        return;
      }
      router.replace('/');
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
            <strong>e-Mumtaz</strong>
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
            const selfHostedUrl = getTrustedSelfHostedUrl();
            if (selfHostedUrl) {
              await fetch(`${selfHostedUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' });
              router.replace('/login');
              return;
            }
            router.replace('/login');
          }}
        >
          Kembali ke Login
        </button>
      </section>
    </main>
  );
}
