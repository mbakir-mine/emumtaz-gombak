'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function LaporanKelasPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [darjah, setDarjah] = useState('')
  const [kelas, setKelas] = useState('')
  const [exam, setExam] = useState('UPSA')

  const [kelasList, setKelasList] = useState<string[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])

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
    async function loadKelas() {
      if (!kodSekolah || !darjah) return

      const { data } = await supabase
        .from('students')
        .select('kelas')
        .eq('kod_sekolah', kodSekolah)
        .eq('darjah', Number(darjah))
        .eq('status', 'AKTIF')

      const unique = Array.from(
        new Set((data || []).map((x: any) => x.kelas).filter(Boolean))
      )

      setKelasList(unique)
    }

    loadKelas()
  }, [kodSekolah, darjah])

  async function paparLaporan() {
    if (!kodSekolah || !darjah || !kelas) return

    const { data: muridData } = await supabase
      .from('students')
      .select('*')
      .eq('kod_sekolah', kodSekolah)
      .eq('darjah', Number(darjah))
      .eq('kelas', kelas)
      .eq('status', 'AKTIF')
      .order('nama', { ascending: true })

    setStudents(muridData || [])

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('*')
      .lte('darjah_min', Number(darjah))
      .gte('darjah_max', Number(darjah))
      .order('susunan', { ascending: true })

    setSubjects(subjectData || [])

    const mykids = (muridData || []).map((m: any) => m.mykid)

    if (mykids.length === 0) {
      setMarks([])
      return
    }

    const { data: markahData } = await supabase
      .from('marks')
      .select('*')
      .eq('tahun', 2026)
      .eq('kod_exam', exam)
      .eq('kod_sekolah', kodSekolah)
      .in('mykid', mykids)

    setMarks(markahData || [])
  }

  function getMarkah(mykid: string, kodSubjek: string) {
    const rekod = marks.find(
      (m) => m.mykid === mykid && m.kod_subjek === kodSubjek
    )
    return rekod?.markah ?? ''
  }

  function subjekDikira() {
    return subjects.filter(
      (s) =>
        s.dikira === true &&
        s.nama_subjek !== 'Al-Quran' &&
        s.nama_subjek !== 'Hafazan'
    )
  }

  function kiraPurata(mykid: string) {
    const dikira = subjekDikira()
    if (dikira.length === 0) return 0

    const total = dikira.reduce((sum: number, s: any) => {
      return sum + Number(getMarkah(mykid, s.kod_subjek) || 0)
    }, 0)

    return Number((total / dikira.length).toFixed(2))
  }

  function getGred(markah: number) {
    if (markah >= 90) return 'MUMTAZ'
    if (markah >= 75) return 'JAYYID JIDDAN'
    if (markah >= 60) return 'JAYYID'
    if (markah >= 40) return 'MAQBUL'
    return "MUSA'ADAH"
  }

  function warnaMarkah(markah: any) {
    if (markah === '' || markah === null || markah === undefined) return '#64748b'
    const m = Number(markah)
    if (m >= 90) return '#15803d'
    if (m >= 75) return '#16a34a'
    if (m >= 60) return '#ca8a04'
    if (m >= 40) return '#f97316'
    return '#dc2626'
  }

  const rankingData = students
    .map((m) => ({
      ...m,
      purata: kiraPurata(m.mykid),
      gred: getGred(kiraPurata(m.mykid))
    }))
    .sort((a, b) => b.purata - a.purata)
    .map((m, index) => ({
      ...m,
      ranking: index + 1
    }))

  const purataKelas =
    rankingData.length > 0
      ? (
          rankingData.reduce((sum, m) => sum + Number(m.purata), 0) /
          rankingData.length
        ).toFixed(2)
      : '-'

  const bilMumtaz = rankingData.filter((m) => m.purata >= 90).length
  const bilLulus = rankingData.filter((m) => m.purata >= 40).length

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
        <h1 style={{ margin: 0 }}>Laporan Kelas</h1>
        <p>Analisis prestasi lengkap murid mengikut kelas dan subjek.</p>

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
            <select
              value={darjah}
              onChange={(e) => {
                setDarjah(e.target.value)
                setKelas('')
                setStudents([])
                setSubjects([])
                setMarks([])
              }}
              style={input}
            >
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
            <label>Kelas</label>
            <select
              value={kelas}
              onChange={(e) => {
                setKelas(e.target.value)
                setStudents([])
                setSubjects([])
                setMarks([])
              }}
              style={input}
            >
              <option value="">-- Pilih Kelas --</option>
              {kelasList.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={paparLaporan} style={button}>
          PAPAR LAPORAN KELAS
        </button>
      </section>

      {students.length > 0 && (
        <section className="print-card" style={card}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ margin: 0 }}>LAPORAN PRESTASI KELAS</h2>
            <p style={{ margin: '6px 0' }}><b>{namaSekolah || kodSekolah}</b></p>
            <p style={{ margin: 0 }}>{exam} 2026</p>
          </div>

          <table style={{ width: '100%', marginBottom: 20 }}>
            <tbody>
              <tr>
                <td><b>Darjah</b></td>
                <td>: Tahun {darjah}</td>
                <td><b>Kelas</b></td>
                <td>: {kelas}</td>
              </tr>
              <tr>
                <td><b>Jumlah Murid</b></td>
                <td>: {students.length}</td>
                <td><b>Purata Kelas</b></td>
                <td>: {purataKelas}</td>
              </tr>
              <tr>
                <td><b>Bil. Mumtaz</b></td>
                <td>: {bilMumtaz}</td>
                <td><b>Bil. Lulus</b></td>
                <td>: {bilLulus}</td>
              </tr>
            </tbody>
          </table>

          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr>
                  <th style={th}>Rank</th>
                  <th style={th}>Nama Murid</th>
                  <th style={th}>MyKid</th>
                  <th style={th}>L/P</th>

                  {subjects.map((s) => (
                    <th key={s.kod_subjek} style={th}>
                      {s.nama_subjek}
                    </th>
                  ))}

                  <th style={th}>Purata</th>
                  <th style={th}>Gred</th>
                </tr>
              </thead>

              <tbody>
                {rankingData.map((m) => (
                  <tr key={m.mykid}>
                    <td style={td}>
                      <b>
                        {m.ranking === 1
                          ? '🥇'
                          : m.ranking === 2
                          ? '🥈'
                          : m.ranking === 3
                          ? '🥉'
                          : `Ke-${m.ranking}`}
                      </b>
                    </td>

                    <td style={td}>{m.nama}</td>
                    <td style={td}>{m.mykid}</td>
                    <td style={td}>{m.jantina}</td>

                    {subjects.map((s) => {
                      const markah = getMarkah(m.mykid, s.kod_subjek)

                      return (
                        <td
                          key={s.kod_subjek}
                          style={{
                            ...td,
                            textAlign: 'center',
                            fontWeight: 'bold',
                            color: warnaMarkah(markah)
                          }}
                        >
                          {markah === '' ? '-' : markah}
                        </td>
                      )
                    })}

                    <td style={{ ...td, fontWeight: 'bold', textAlign: 'center' }}>
                      {m.purata}
                    </td>

                    <td style={{ ...td, fontWeight: 'bold' }}>
                      {m.gred}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ marginTop: 12, fontSize: 13, color: '#64748b' }}>
            Nota: Al-Quran dan Hafazan tidak dikira dalam purata keseluruhan.
            Subjek kosong dikira sebagai 0 bagi subjek yang termasuk dalam kiraan.
          </p>

          <div style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between' }}>
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

          <button className="no-print" onClick={() => window.print()} style={{ ...button, marginTop: 30 }}>
            CETAK / SAVE PDF
          </button>
        </section>
      )}
    </main>
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
  padding: 25,
  borderRadius: 18,
  boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: 16
}

const input = {
  width: '100%',
  padding: 12,
  marginTop: 6,
  marginBottom: 16,
  border: '1px solid #cbd5e1',
  borderRadius: 10
}

const button = {
  width: '100%',
  padding: 14,
  background: '#047857',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  fontWeight: 'bold',
  cursor: 'pointer'
}

const buttonWhite = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: '10px 14px',
  borderRadius: 8,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: 10
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontSize: 13
}

const th = {
  background: '#047857',
  color: 'white',
  padding: 9,
  border: '1px solid #d1d5db',
  textAlign: 'left' as const,
  whiteSpace: 'nowrap' as const
}

const td = {
  padding: 8,
  border: '1px solid #d1d5db',
  whiteSpace: 'nowrap' as const
}