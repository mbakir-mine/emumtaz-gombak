'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function ReportMarkahPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [kelasList, setKelasList] = useState<string[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])

  const [darjah, setDarjah] = useState('')
  const [kelas, setKelas] = useState('')
  const [exam, setExam] = useState('UPSA')
  const [subjek, setSubjek] = useState('')

  useEffect(() => {
    async function init() {
      const savedKodSekolah = localStorage.getItem('kod_sekolah') || ''

      if (!savedKodSekolah || savedKodSekolah === 'SEMUA') {
        router.push('/akses')
        return
      }

      setKodSekolah(savedKodSekolah)

      const { data: sekolah } = await supabase
        .from('schools')
        .select('nama_sekolah')
        .eq('kod_sekolah', savedKodSekolah)
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

  useEffect(() => {
    async function loadSubjects() {
      if (!darjah) return

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .lte('darjah_min', Number(darjah))
        .gte('darjah_max', Number(darjah))
        .order('susunan', { ascending: true })

      setSubjects(data || [])
    }

    loadSubjects()
  }, [darjah])

  async function paparReport() {
    if (!kodSekolah || !darjah || !kelas || !subjek) return

    const { data: muridData } = await supabase
      .from('students')
      .select('*')
      .eq('kod_sekolah', kodSekolah)
      .eq('darjah', Number(darjah))
      .eq('kelas', kelas)
      .eq('status', 'AKTIF')
      .order('nama', { ascending: true })

    setStudents(muridData || [])

    const { data: markahData } = await supabase
      .from('marks')
      .select('*')
      .eq('tahun', 2026)
      .eq('kod_exam', exam)
      .eq('kod_sekolah', kodSekolah)
      .eq('kod_subjek', subjek)

    setMarks(markahData || [])
  }

  function getMarkah(mykid: string) {
    const rekod = marks.find((m) => m.mykid === mykid)
    return rekod?.markah ?? ''
  }

  function getGred(mykid: string) {
    const markah = getMarkah(mykid)

    if (markah === '' || markah === undefined || markah === null) return ''

    const m = Number(markah)

    if (m >= 90) return 'MUMTAZ'
    if (m >= 75) return 'JAYYID JIDDAN'
    if (m >= 60) return 'JAYYID'
    if (m >= 40) return 'MAQBUL'
    return "MUSA'ADAH"
  }

  function gredColor(gred: string) {
    if (gred === 'MUMTAZ') return '#15803d'
    if (gred === 'JAYYID JIDDAN') return '#16a34a'
    if (gred === 'JAYYID') return '#ca8a04'
    if (gred === 'MAQBUL') return '#f97316'
    if (gred === "MUSA'ADAH") return '#dc2626'
    return '#111827'
  }

  function namaExam(kod: string) {
    if (kod === 'UPSA') return 'Ujian Pertengahan Sesi Akademik'
    if (kod === 'UASA') return 'Ujian Akhir Sesi Akademik'
    return kod
  }

  const namaSubjek =
    subjects.find((s) => s.kod_subjek === subjek)?.nama_subjek || ''

  const jumlahDiisi = students.filter((m) => getMarkah(m.mykid) !== '').length
  const jumlahBelum = students.length - jumlahDiisi

  return (
    <main style={page}>
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }

            body {
              background: white !important;
            }

            main {
              padding: 0 !important;
              background: white !important;
            }

            .print-card {
              box-shadow: none !important;
              border-radius: 0 !important;
              padding: 0 !important;
            }
          }
        `}
      </style>

      <section className="no-print" style={header}>
        <h1 style={{ margin: 0 }}>Report Markah</h1>
        <p>
          Kod Sekolah: <b>{kodSekolah}</b>
        </p>

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
                setSubjek('')
                setStudents([])
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

          <div>
            <label>Subjek</label>
            <select
              value={subjek}
              onChange={(e) => {
                setSubjek(e.target.value)
                setStudents([])
                setMarks([])
              }}
              style={input}
            >
              <option value="">-- Pilih Subjek --</option>
              {subjects.map((s) => (
                <option key={s.kod_subjek} value={s.kod_subjek}>
                  {s.nama_subjek}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={paparReport} style={button}>
          PAPAR REPORT
        </button>
      </section>

      {students.length > 0 && (
        <section className="print-card" style={card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>LAPORAN MARKAH MURID</h2>
            <p style={{ margin: '6px 0' }}>
              <b>{namaSekolah || kodSekolah}</b>
            </p>
            <p style={{ margin: 0 }}>
              {namaExam(exam)} 2026
            </p>
          </div>

          <table style={{ width: '100%', marginBottom: '15px' }}>
            <tbody>
              <tr>
                <td><b>Darjah</b></td>
                <td>: Tahun {darjah}</td>
                <td><b>Kelas</b></td>
                <td>: {kelas}</td>
              </tr>
              <tr>
                <td><b>Subjek</b></td>
                <td>: {namaSubjek}</td>
                <td><b>Kod Sekolah</b></td>
                <td>: {kodSekolah}</td>
              </tr>
              <tr>
                <td><b>Jumlah Murid</b></td>
                <td>: {students.length}</td>
                <td><b>Sudah Diisi</b></td>
                <td>: {jumlahDiisi}</td>
              </tr>
              <tr>
                <td><b>Belum Diisi</b></td>
                <td>: {jumlahBelum}</td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Bil</th>
                <th style={th}>MyKid</th>
                <th style={th}>L/P</th>
                <th style={th}>Nama Murid</th>
                <th style={th}>Markah</th>
                <th style={th}>Gred</th>
              </tr>
            </thead>
            <tbody>
              {students.map((murid, index) => {
                const gred = getGred(murid.mykid)

                return (
                  <tr key={murid.mykid}>
                    <td style={td}>{index + 1}</td>
                    <td style={td}>{murid.mykid}</td>
                    <td style={td}>{murid.jantina}</td>
                    <td style={td}>{murid.nama}</td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 'bold' }}>
                      {getMarkah(murid.mykid)}
                    </td>
                    <td style={{
                      ...td,
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: gredColor(gred)
                    }}>
                      {gred}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'space-between' }}>
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

          <button className="no-print" onClick={() => window.print()} style={{ ...button, marginTop: '30px' }}>
            CETAK REPORT
          </button>
        </section>
      )}
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f1f5f9',
  padding: '30px',
  fontFamily: 'Arial'
}

const header = {
  background: 'linear-gradient(135deg, #065f46, #047857)',
  color: 'white',
  padding: '25px',
  borderRadius: '18px',
  marginBottom: '20px'
}

const card = {
  background: 'white',
  padding: '25px',
  borderRadius: '18px',
  boxShadow: '0 10px 25px rgba(15,23,42,0.10)',
  marginBottom: '20px'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px'
}

const input = {
  width: '100%',
  padding: '12px',
  marginTop: '6px',
  marginBottom: '16px',
  border: '1px solid #cbd5e1',
  borderRadius: '10px'
}

const button = {
  width: '100%',
  padding: '14px',
  background: '#047857',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const buttonWhite = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px'
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const
}

const th = {
  background: '#047857',
  color: 'white',
  padding: '10px',
  border: '1px solid #d1d5db',
  textAlign: 'left' as const
}

const td = {
  padding: '9px',
  border: '1px solid #d1d5db'
}