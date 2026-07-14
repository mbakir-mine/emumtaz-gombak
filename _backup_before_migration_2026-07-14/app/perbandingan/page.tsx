'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function LaporanSubjekPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')

  const [darjah, setDarjah] = useState('')
  const [subjek, setSubjek] = useState('')
  const [exam, setExam] = useState('UPSA')

  const [subjects, setSubjects] = useState<any[]>([])
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    async function init() {
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
    }

    init()
  }, [router])

  useEffect(() => {
    async function loadSubjek() {
      if (!darjah) return

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .lte('darjah_min', Number(darjah))
        .gte('darjah_max', Number(darjah))
        .order('susunan', { ascending: true })

      setSubjects(data || [])
    }

    loadSubjek()
  }, [darjah])

  async function paparLaporan() {
    if (!kodSekolah || !darjah || !subjek) return

    const { data: muridData } = await supabase
      .from('students')
      .select('*')
      .eq('kod_sekolah', kodSekolah)
      .eq('darjah', Number(darjah))
      .eq('status', 'AKTIF')

    const mykids = (muridData || []).map((m: any) => m.mykid)

    const { data: markahData } = await supabase
      .from('marks')
      .select('*')
      .eq('tahun', 2026)
      .eq('kod_exam', exam)
      .eq('kod_sekolah', kodSekolah)
      .eq('kod_subjek', subjek)
      .in('mykid', mykids)

    const gabung = (muridData || []).map((m: any) => {
      const rekod = markahData?.find((x) => x.mykid === m.mykid)
      const markah = rekod?.markah ?? 0

      return {
        ...m,
        markah: Number(markah)
      }
    })

    const kelasGroup: any = {}

    gabung.forEach((m: any) => {
      const key = `${m.darjah}-${m.kelas}`

      if (!kelasGroup[key]) {
        kelasGroup[key] = {
          darjah: m.darjah,
          kelas: m.kelas,
          jumlah: 0,
          total: 0,
          mumtaz: 0,
          lulus: 0
        }
      }

      kelasGroup[key].jumlah++
      kelasGroup[key].total += m.markah

      if (m.markah >= 90) kelasGroup[key].mumtaz++
      if (m.markah >= 40) kelasGroup[key].lulus++
    })

    const result = Object.values(kelasGroup).map((k: any) => ({
      ...k,
      purata: (k.total / k.jumlah).toFixed(2)
    }))

    result.sort((a: any, b: any) => b.purata - a.purata)

    setData(result)
  }

  return (
    <main style={page}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
          }
        `}
      </style>

      <section className="no-print" style={header}>
        <h1>Laporan Subjek</h1>
        <p>Analisis prestasi setiap kelas bagi subjek dipilih.</p>

        <button onClick={() => router.push('/')} style={buttonWhite}>
          Dashboard
        </button>
      </section>

      <section className="no-print" style={card}>
        <div style={grid}>

          <div>
            <label>Peperiksaan</label>
            <select value={exam} onChange={(e) => setExam(e.target.value)} style={input}>
              <option value="UPSA">UPSA</option>
              <option value="UASA">UASA</option>
            </select>
          </div>

          <div>
            <label>Darjah</label>
            <select value={darjah} onChange={(e) => setDarjah(e.target.value)} style={input}>
              <option value="">-- Pilih Darjah --</option>
              <option value="1">Tahun 1</option>
              <option value="2">Tahun 2</option>
              <option value="3">Tahun 3</option>
              <option value="4">Tahun 4</option>
              <option value="5">Tahun 5</option>
              <option value="6">Tahun 6</option>
            </select>
          </div>

          <div>
            <label>Subjek</label>
            <select value={subjek} onChange={(e) => setSubjek(e.target.value)} style={input}>
              <option value="">-- Pilih Subjek --</option>
              {subjects.map((s) => (
                <option key={s.kod_subjek} value={s.kod_subjek}>
                  {s.nama_subjek}
                </option>
              ))}
            </select>
          </div>

        </div>

        <button onClick={paparLaporan} style={button}>
          PAPAR LAPORAN SUBJEK
        </button>
      </section>

      {data.length > 0 && (
        <section style={card}>
          <h2 style={{ textAlign: 'center' }}>
            LAPORAN SUBJEK - {subjects.find(s => s.kod_subjek === subjek)?.nama_subjek}
          </h2>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Ranking</th>
                <th style={th}>Darjah</th>
                <th style={th}>Kelas</th>
                <th style={th}>Jumlah Murid</th>
                <th style={th}>Purata</th>
                <th style={th}>Mumtaz</th>
                <th style={th}>Lulus</th>
              </tr>
            </thead>

            <tbody>
              {data.map((k: any, i) => (
                <tr key={i}>
                  <td style={td}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `Ke-${i+1}`}
                  </td>
                  <td style={td}>Tahun {k.darjah}</td>
                  <td style={td}>{k.kelas}</td>
                  <td style={td}>{k.jumlah}</td>
                  <td style={{ ...td, fontWeight: 'bold' }}>{k.purata}</td>
                  <td style={td}>{k.mumtaz}</td>
                  <td style={td}>{k.lulus}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="no-print" onClick={() => window.print()} style={button}>
            CETAK / PDF
          </button>
        </section>
      )}
    </main>
  )
}

/* STYLE */
const page = { padding: 30, background: '#f1f5f9', minHeight: '100vh' }

const header = {
  background: '#047857',
  color: 'white',
  padding: 20,
  borderRadius: 12,
  marginBottom: 20
}

const card = {
  background: 'white',
  padding: 20,
  borderRadius: 12,
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px,1fr))',
  gap: 15
}

const input = {
  width: '100%',
  padding: 10,
  marginTop: 5
}

const button = {
  width: '100%',
  padding: 12,
  background: '#047857',
  color: 'white',
  border: 'none',
  marginTop: 10
}

const buttonWhite = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: 10,
  marginTop: 10
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const
}

const th = {
  border: '1px solid #ddd',
  padding: 10,
  background: '#047857',
  color: 'white'
}

const td = {
  border: '1px solid #ddd',
  padding: 10
}