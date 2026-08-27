'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';
import PasswordField from '../ui/PasswordField';
import { registerPendingUser } from './actions';

type SchoolOption = {
  kod_sekolah: string;
  nama_sekolah: string;
};

const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];
const initialState = { ok: false, message: '' };

export default function DaftarPage() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('GURU_SUBJEK');
  const [kodSekolah, setKodSekolah] = useState('');
  const [zon, setZon] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [state, formAction, pending] = useActionState(registerPendingUser, initialState);

  useEffect(() => {
    async function loadSchools() {
      if (!supabase) return;

      const { data } = await supabase
        .from('schools')
        .select('kod_sekolah,nama_sekolah')
        .eq('status', 'AKTIF')
        .order('kod_sekolah');

      setSchools(data ?? []);
    }

    loadSchools();
  }, []);

  const needsSchool = useMemo(() => !['ADMIN_DAERAH', 'ADMIN_ZON'].includes(role), [role]);
  const needsZone = role === 'ADMIN_ZON';

  return (
    <main className="login-page">
      <section className="login-card register-card">
        <div className="login-brand">
          <div className="brand-mark">eM</div>
          <div>
            <strong>Daftar e-Mumtaz Gombak</strong>
            <span>Permohonan akaun pengguna sekolah</span>
          </div>
        </div>

        <h1>Daftar Pengguna Baru</h1>
        <p className="login-copy">
          Tetapkan password semasa mendaftar. Admin perlu mengaktifkan akaun sebelum pengguna boleh masuk ke sistem.
        </p>

        {!hasSupabaseEnv && (
          <div className="notice">
            Supabase belum disambungkan. Isi fail <strong>.env.local</strong> dan restart server dahulu.
          </div>
        )}

        <form action={formAction} className="login-form">
          <label>
            Nama Penuh
            <input
              name="nama"
              placeholder="Nama penuh pengguna"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Role
            <select
              name="role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setKodSekolah('');
                setZon('');
              }}
              required
            >
              <option value="GURU_SUBJEK">Guru Subjek</option>
              <option value="GURU_KELAS">Guru Kelas</option>
              <option value="ADMIN_SEKOLAH">Admin Sekolah</option>
              <option value="ADMIN_ZON">Admin Zon</option>
              <option value="ADMIN_DAERAH">Admin Daerah</option>
            </select>
          </label>

          {needsZone && (
            <label>
              Zon
              <select name="zon" value={zon} onChange={(event) => setZon(event.target.value)} required>
                <option value="">Pilih zon</option>
                {zoneOptions.map((zone) => (
                  <option key={zone} value={zone}>
                    Zon {zone.charAt(0) + zone.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </label>
          )}

          {needsSchool && (
            <label>
              Sekolah
              <select name="kod_sekolah" value={kodSekolah} onChange={(event) => setKodSekolah(event.target.value)} required>
                <option value="">Pilih sekolah</option>
                {schools.map((school) => (
                  <option key={school.kod_sekolah} value={school.kod_sekolah}>
                    {school.kod_sekolah} - {school.nama_sekolah}
                  </option>
                ))}
              </select>
            </label>
          )}

          <PasswordField
            label="Password"
            name="password"
            placeholder="Tetapkan password"
            value={password}
            onChange={setPassword}
            required
            autoComplete="new-password"
          />

          <PasswordField
            label="Sahkan Password"
            name="confirm_password"
            placeholder="Masukkan semula password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            autoComplete="new-password"
          />

          {state.message && <p className={state.ok ? 'form-success' : 'form-message'}>{state.message}</p>}

          <button className="button" type="submit" disabled={pending}>
            {pending ? 'Menghantar...' : 'Hantar Pendaftaran'}
          </button>

          <Link className="button secondary login-register-link" href="/login">
            Kembali ke Login
          </Link>
        </form>
      </section>
    </main>
  );
}
