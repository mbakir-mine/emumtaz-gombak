'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseEnv, supabase } from '@/lib/supabase';

type SchoolOption = {
  kod_sekolah: string;
  nama_sekolah: string;
};

const zoneOptions = ['BARAT', 'TIMUR', 'TENGAH'];

export default function DaftarPage() {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('GURU_SUBJEK');
  const [kodSekolah, setKodSekolah] = useState('');
  const [zon, setZon] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

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

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setSuccess(false);

    if (!hasSupabaseEnv || !supabase) {
      setMessage('Tetapan Supabase belum lengkap. Sila isi .env.local dahulu.');
      return;
    }

    if (password.length < 6) {
      setMessage('Password mesti sekurang-kurangnya 6 aksara.');
      return;
    }

    if (needsSchool && !kodSekolah) {
      setMessage('Sila pilih sekolah.');
      return;
    }

    if (needsZone && !zon) {
      setMessage('Sila pilih zon.');
      return;
    }

    setLoading(true);

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = nama.trim().toUpperCase();
    const userRole = role.trim();
    const schoolCode = needsSchool ? kodSekolah : null;
    const zoneCode = needsZone ? zon : null;

    const authResult = await supabase.auth.signUp({
      email: cleanEmail,
      password,
    });

    if (authResult.error) {
      setLoading(false);
      setMessage(`Pendaftaran auth gagal: ${authResult.error.message}`);
      return;
    }

    const { error } = await supabase.from('app_users').upsert(
      {
        email: cleanEmail,
        nama: cleanName,
        role: userRole,
        kod_sekolah: schoolCode,
        zon: zoneCode,
        status: 'MENUNGGU',
      },
      {
        onConflict: 'email,role,kod_sekolah',
      },
    );

    setLoading(false);

    if (error) {
      setMessage(`Akaun auth sudah dibuat, tetapi profil sistem gagal disimpan: ${error.message}`);
      return;
    }

    setSuccess(true);
    setMessage('Pendaftaran berjaya dihantar. Sila tunggu Pentadbir mengaktifkan akaun.');
    setNama('');
    setEmail('');
    setPassword('');
    setRole('GURU_SUBJEK');
    setKodSekolah('');
    setZon('');
  }

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
          Isi maklumat pengguna. Akaun akan direkod sebagai MENUNGGU sehingga disemak oleh Pentadbir.
        </p>

        {!hasSupabaseEnv && (
          <div className="notice">
            Supabase belum disambungkan. Isi fail <strong>.env.local</strong> dan restart server dahulu.
          </div>
        )}

        <form onSubmit={handleRegister} className="login-form">
          <label>
            Nama Penuh
            <input
              placeholder="Nama penuh pengguna"
              value={nama}
              onChange={(event) => setNama(event.target.value)}
              required
            />
          </label>

          <label>
            Email
            <input
              type="email"
              placeholder="contoh@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Minimum 6 aksara"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <label>
            Role
            <select
              value={role}
              onChange={(event) => {
                setRole(event.target.value);
                setKodSekolah('');
              }}
              required
            >
              <option value="GURU_SUBJEK">Guru Subjek</option>
              <option value="GURU_KELAS">Guru Kelas</option>
              <option value="ADMIN_SEKOLAH">Admin Sekolah</option>
              <option value="ADMIN_ZON">Pentadbir Zon</option>
              <option value="ADMIN_DAERAH">Admin Daerah</option>
            </select>
          </label>

          {needsZone && (
            <label>
              Zon
              <select value={zon} onChange={(event) => setZon(event.target.value)} required>
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
              <select value={kodSekolah} onChange={(event) => setKodSekolah(event.target.value)} required>
                <option value="">Pilih sekolah</option>
                {schools.map((school) => (
                  <option key={school.kod_sekolah} value={school.kod_sekolah}>
                    {school.kod_sekolah} - {school.nama_sekolah}
                  </option>
                ))}
              </select>
            </label>
          )}

          {message && <p className={success ? 'form-success' : 'form-message'}>{message}</p>}

          <button className="button" type="submit" disabled={loading}>
            {loading ? 'Menghantar...' : 'Hantar Pendaftaran'}
          </button>

          <Link className="button secondary login-register-link" href="/login">
            Kembali ke Login
          </Link>
        </form>
      </section>
    </main>
  );
}
