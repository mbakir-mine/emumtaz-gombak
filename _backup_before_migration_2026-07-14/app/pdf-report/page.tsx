'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function PdfReportPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [data, setData] = useState<any>(null)
  const [progress, setProgress] = useState<any[]>([])
  const [ranking, setRanking] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const ks = localStorage.getItem('kod_sekolah') || ''

      if (!ks || ks === 'SEMUA') {
        router.push('/akses')
        return
      }

      setKodSekolah(ks)

      const { data: sekolah } = await supabase
        .from('schools')
        .select('nama_sekolah')
        .eq('kod_sekolah', ks)
        .single()

      if (sekolah?.nama_sekolah) setNamaSekolah(sekolah.nama_sekolah)

      const { data: analisis } = await supabase
        .from('analisis_sekolah')
        .select('*')
        .eq('kod_sekolah', ks)
        .single()

      setData(analisis)

      const { data: progressData } = await supabase
        .from('progress_markah_sekolah')
        .select('*')
        .eq('kod_sekolah', ks)
        .order('darjah', { ascending: true })
        .order('kelas', { ascending: true })
        .order('nama_subjek', { ascending: true })

      setProgress(progressData || [])

      const { data: rankingData } = await supabase
        .from('ranking_daerah')
        .select('*')
        .eq('kod_sekolah', ks)
        .single()

      setRanking(rankingData)
    }

    load()
  }, [router])

  function statusSekolah() {
    if (!data) return '-'
    if (Number(data.peratus_lulus) >= 95 && Number(data.peratus_mumtaz) >= 60) return 'CEMERLANG'
    if (Number(data.peratus_lulus) >= 85) return 'BAIK'
    return 'PERLU INTERVENSI'
  }

  if (!data) {
    return <main style={{ padding: 30 }}>Loading...</main>
  }

  return (
    <main style={page}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            main { padding: 0 !important; background: white !important; }
            .print-card {
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <section className="no-print" style={header}>
        <h1 style={{ margin: 0 }}>PDF Report Sekolah</h1>
        <p>Jana laporan sekolah untuk dicetak atau disimpan sebagai PDF.</p>

        <button onClick={() => router.push('/')} style={buttonWhite}>
          Dashboard
        </button>

        <button onClick={() => window.print()} style={buttonWhite}>
          Print / Save PDF
        </button>
      </section>

      <section className="print-card" style={card}>
        <div style={{ textAlign: 'center', marginBottom: 25 }}>
          <h2 style={{ margin: 0 }}>LAPORAN ANALISIS PRESTASI SEKOLAH</h2>
          <p style={{ margin: '8px 0 0' }}>
            <b>{namaSekolah || kodSekolah}</b>
          </p>
          <p style={{ margin: 0 }}>UPSA 2026</p>
        </div>

        <table style={{ width: '100%', marginBottom: 20 }}>
          <tbody>
            <tr>
              <td><b>Kod Sekolah</b></td>
              <td>: {kodSekolah}</td>
              <td><b>Ranking Daerah</b></td>
              <td>: {ranking?.ranking_daerah ? `Ke-${ranking.ranking_daerah}` : '-'}</td>
            </tr>
            <tr>
              <td><b>Status Sekolah</b></td>
              <td>: {statusSekolah()}</td>
              <td><b>Jumlah Murid</b></td>
              <td>: {data.jumlah_murid}</td>
            </tr>
          </tbody>
        </table>

        <div style={summaryGrid}>
          <Summary title="Purata Sekolah" value={data.purata_sekolah} />
          <Summary title="% Mumtaz" value={`${data.peratus_mumtaz}%`} />
          <Summary title="% Lulus" value={`${data.peratus_lulus}%`} />
          <Summary title="Bilangan Mumtaz" value={data.bil_mumtaz} />
        </div>

        <h3>Progress Pengisian Markah</h3>

        <table style={table}>
          <thead>
            <tr>
              <th style={th}>Bil</th>
              <th style={th}>Darjah</th>
              <th style={th}>Kelas</th>
              <th style={th}>Subjek</th>
              <th style={th}>Murid</th>
              <th style={th}>Sudah Isi</th>
              <th style={th}>Belum Isi</th>
              <th style={th}>% Siap</th>
            </tr>
          </thead>

          <tbody>
            {progress.map((item, index) => (
              <tr key={index}>
                <td style={td}>{index + 1}</td>
                <td style={td}>Tahun {item.darjah}</td>
                <td style={td}>{item.kelas}</td>
                <td style={td}>{item.nama_subjek}</td>
                <td style={td}>{item.jumlah_murid}</td>
                <td style={td}>{item.jumlah_sudah_isi}</td>
                <td style={td}>{item.jumlah_belum_isi}</td>
                <td style={td}>{item.peratus_siap}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 35, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            Disediakan oleh:
            <br /><br /><br />
            ______________________
          </div>

          <div>
            Disemak oleh:
            <br /><br /><br />
            ______________________
          </div>
        </div>
      </section>
    </main>
  )
}

function Summary({ title, value }: any) {
  return (
    <div style={summaryBox}>
      <p style={{ margin: 0, color: '#64748b' }}>{title}</p>
      <p style={{ margin: '6px 0 0', fontSize: 24, fontWeight: 'bold' }}>{value}</p>
    </div>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f1f5f9',
  padding: 30,
  fontFamily: 'Arial'
}

const header = {
  background: 'linear-gradient(135deg, #065f46, #047857)',
  color: 'white',
  padding: 25,
  borderRadius: 18,
  marginBottom: 20
}

const card = {
  background: 'white',
  padding: 30,
  borderRadius: 18,
  boxShadow: '0 10px 25px rgba(15,23,42,0.08)'
}

const buttonWhite = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginRight: 10,
  marginTop: 10
}

const summaryGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: 12,
  marginBottom: 25
}

const summaryBox = {
  border: '1px solid #d1d5db',
  borderRadius: 12,
  padding: 15
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const
}

const th = {
  background: '#047857',
  color: 'white',
  padding: 10,
  border: '1px solid #d1d5db',
  textAlign: 'left' as const
}

const td = {
  padding: 8,
  border: '1px solid #d1d5db'
}