'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()

  const [role, setRole] = useState('')
  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadDashboard() {
      const savedRole = localStorage.getItem('role') || ''
      const savedKodSekolah = localStorage.getItem('kod_sekolah') || ''

      if (!savedRole || !savedKodSekolah) {
        router.push('/akses')
        return
      }

      setRole(savedRole)
      setKodSekolah(savedKodSekolah)

      if (savedKodSekolah !== 'SEMUA') {
        const { data: sekolah } = await supabase
          .from('schools')
          .select('nama_sekolah')
          .eq('kod_sekolah', savedKodSekolah)
          .single()

        if (sekolah?.nama_sekolah) setNamaSekolah(sekolah.nama_sekolah)

        const { data: analisis } = await supabase
          .from('analisis_sekolah')
          .select('*')
          .eq('kod_sekolah', savedKodSekolah)
          .single()

        setData(analisis)
      }
    }

    loadDashboard()
  }, [router])

  async function logout() {
    localStorage.removeItem('role')
    localStorage.removeItem('kod_sekolah')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main style={page}>
      <section style={hero}>
        <div>
          <h1 style={{ margin: 0, fontSize: 34 }}>e-Mumtaz Gombak</h1>
          <p style={{ marginTop: 8, fontSize: 16 }}>
            Sistem Analisis Prestasi Murid SRA & KAFAI Daerah Gombak
          </p>
          <p>
            Role: <b>{role}</b> | Kod Sekolah: <b>{kodSekolah}</b>
            {namaSekolah && <> | <b>{namaSekolah}</b></>}
          </p>
        </div>

        <div>
          <button onClick={() => router.push('/akses')} style={heroButton}>
            Tukar Akses
          </button>
          <button onClick={logout} style={logoutButton}>
            Logout
          </button>
        </div>
      </section>

      {kodSekolah !== 'SEMUA' && data && (
        <section style={summaryGrid}>
          <Summary title="Jumlah Murid" value={data.jumlah_murid} color="#16a34a" />
          <Summary title="Purata Sekolah" value={data.purata_sekolah} color="#2563eb" />
          <Summary title="% Mumtaz" value={`${data.peratus_mumtaz}%`} color="#ca8a04" />
          <Summary title="% Lulus" value={`${data.peratus_lulus}%`} color="#7c3aed" />
        </section>
      )}

      <h2 style={{ marginTop: 25 }}>Menu Sistem</h2>

      <section style={menuGrid}>
        <MenuCard
          title="Input Markah Kelas"
          desc="Guru mengisi markah mengikut kelas dan subjek."
          icon="📝"
          color="#ecfdf5"
          onClick={() => router.push('/input-kelas')}
        />

        <MenuCard
          title="Input Satu Murid"
          desc="Kemaskini markah individu murid."
          icon="👤"
          color="#eff6ff"
          onClick={() => router.push('/input')}
        />

        <MenuCard
          title="Progress Markah"
          desc="Pantau status pengisian markah setiap kelas dan subjek."
          icon="✅"
          color="#fef3c7"
          onClick={() => router.push('/progress')}
        />

        <MenuCard
          title="Analisis Sekolah"
          desc="Paparan graf, purata dan ringkasan prestasi sekolah."
          icon="📊"
          color="#ede9fe"
          onClick={() => router.push('/analisis')}
        />

        <MenuCard
          title="Ranking Daerah"
          desc="Kedudukan sekolah dalam daerah berdasarkan purata."
          icon="🏆"
          color="#fff7ed"
          onClick={() => router.push('/ranking-daerah')}
        />

        <MenuCard
          title="Laporan Kelas"
          desc="Laporan lengkap kelas bersama semua subjek dan ranking."
          icon="📋"
          color="#ecfeff"
          onClick={() => router.push('/laporan-kelas')}
        />

        <MenuCard
          title="Laporan Subjek"
          desc="Analisis prestasi subjek mengikut kelas."
          icon="📚"
          color="#f0fdf4"
          onClick={() => router.push('/laporan-subjek')}
        />

        <MenuCard
          title="Slip Murid"
          desc="Slip prestasi individu murid untuk cetakan."
          icon="🧾"
          color="#fdf2f8"
          onClick={() => router.push('/slip-murid')}
        />

        <MenuCard
          title="UPSA vs UASA"
          desc="Perbandingan prestasi pertengahan dan akhir sesi."
          icon="📈"
          color="#eef2ff"
          onClick={() => router.push('/perbandingan')}
        />

        <MenuCard
          title="Perbandingan Tahunan"
          desc="Rekod prestasi tahun ke tahun untuk tempoh panjang."
          icon="📆"
          color="#fefce8"
          onClick={() => router.push('/perbandingan-tahunan')}
        />

        <MenuCard
          title="PDF Report"
          desc="Laporan sekolah untuk print atau save PDF."
          icon="📄"
          color="#f1f5f9"
          onClick={() => router.push('/pdf-report')}
        />

        <MenuCard
          title="Tukar Akses"
          desc="Pilih semula role dan sekolah pengguna."
          icon="🔐"
          color="#e0f2fe"
          onClick={() => router.push('/akses')}
        />
      </section>
    </main>
  )
}

function Summary({ title, value, color }: any) {
  return (
    <div style={summaryCard}>
      <p style={{ margin: 0, color: '#64748b' }}>{title}</p>
      <p style={{
        margin: '8px 0 0',
        fontSize: 28,
        fontWeight: 'bold',
        color
      }}>
        {value}
      </p>
    </div>
  )
}

function MenuCard({ title, desc, icon, color, onClick }: any) {
  return (
    <button onClick={onClick} style={{ ...menuCard, background: color }}>
      <div style={{ fontSize: 34 }}>{icon}</div>
      <h3 style={{ margin: '10px 0 6px' }}>{title}</h3>
      <p style={{ margin: 0, color: '#475569', lineHeight: 1.4 }}>
        {desc}
      </p>
    </button>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: 30,
  fontFamily: 'Arial'
}

const hero = {
  background: 'linear-gradient(135deg, #065f46, #047857)',
  color: 'white',
  padding: 30,
  borderRadius: 22,
  display: 'flex',
  justifyContent: 'space-between',
  gap: 20,
  flexWrap: 'wrap' as const,
  boxShadow: '0 12px 30px rgba(15,23,42,0.15)'
}

const heroButton = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: '11px 16px',
  borderRadius: 10,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginRight: 10
}

const logoutButton = {
  background: '#dc2626',
  color: 'white',
  border: 'none',
  padding: '11px 16px',
  borderRadius: 10,
  fontWeight: 'bold',
  cursor: 'pointer'
}

const summaryGrid = {
  marginTop: 25,
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 16
}

const summaryCard = {
  background: 'white',
  padding: 20,
  borderRadius: 18,
  boxShadow: '0 8px 20px rgba(15,23,42,0.08)'
}

const menuGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 18
}

const menuCard = {
  border: '1px solid #e2e8f0',
  borderRadius: 20,
  padding: 22,
  textAlign: 'left' as const,
  cursor: 'pointer',
  boxShadow: '0 8px 20px rgba(15,23,42,0.06)',
  transition: '0.2s',
  minHeight: 160
}