'use client';

import { useEffect, useState } from 'react';
import { roleLabel, type AccessProfile } from '@/lib/access';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import { useAccessProfile } from '../ui/AuthGate';

function accessText(profile: AccessProfile) {
  if (profile.role === 'OWNER' || profile.role === 'ADMIN_DAERAH') {
    return 'Semua sekolah';
  }

  if (profile.role === 'ADMIN_ZON') {
    return profile.zon ? `Zon ${profile.zon}` : 'Zon belum ditetapkan';
  }

  return profile.kod_sekolah ?? 'Sekolah belum ditetapkan';
}

export default function ProfileForm() {
  const profile = useAccessProfile();
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setNama(profile?.nama ?? '');
  }, [profile?.nama]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    const cleanName = nama.trim().replace(/\s+/g, ' ');
    if (!cleanName) {
      setMessage('Nama tidak boleh kosong.');
      return;
    }

    if (!profile) {
      setMessage('Profil pengguna tidak dijumpai. Sila login semula.');
      return;
    }

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap.');
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('app_users')
      .update({ nama: cleanName.toUpperCase() })
      .eq('id', profile.id)
      .eq('email', profile.email);
    setLoading(false);

    if (error) {
      setMessage(`Profil gagal dikemaskini: ${error.message}`);
      return;
    }

    setNama(cleanName.toUpperCase());
    setSuccess(true);
    setMessage('Profil berjaya dikemaskini. Paparan akan dimuat semula sebentar lagi.');
    window.setTimeout(() => window.location.reload(), 800);
  }

  if (!profile) {
    return <p className="empty">Profil sedang dimuatkan.</p>;
  }

  return (
    <div className="profile-form-wrap">
      <div className="profile-summary">
        <div>
          <span>Peranan</span>
          <strong>{roleLabel(profile.role)}</strong>
        </div>
        <div>
          <span>Akses</span>
          <strong>{accessText(profile)}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>{profile.status}</strong>
        </div>
      </div>

      <form className="form-grid profile-self-form" onSubmit={handleSubmit}>
        <label>
          Nama Paparan
          <input
            value={nama}
            onChange={(event) => setNama(event.target.value)}
            placeholder="Nama penuh pengguna"
            required
          />
        </label>

        <label>
          Email Login
          <input value={profile.email} disabled />
        </label>

        <label>
          Peranan Semasa
          <input value={roleLabel(profile.role)} disabled />
        </label>

        <label>
          Capaian Semasa
          <input value={accessText(profile)} disabled />
        </label>

        <div className="form-actions">
          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan Profil'}
          </button>
          {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}
        </div>
      </form>

      <p className="table-note profile-note">
        Email login, role, sekolah dan zon dikawal oleh Admin supaya akses sistem kekal teratur.
      </p>
    </div>
  );
}
