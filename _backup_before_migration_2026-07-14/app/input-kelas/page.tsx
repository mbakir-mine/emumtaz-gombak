'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function InputKelasPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [namaGuru, setNamaGuru] = useState('')
  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [role, setRole] = useState('')
  const [darjah, setDarjah] = useState('')
  const [kelas, setKelas] = useState('')
  const [namaSubjek, setNamaSubjek] = useState('')
  const [kodSubjek, setKodSubjek] = useState('')
  const [exam, setExam] = useState('UPSA')

  const [subjects, setSubjects] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [markah, setMarkah] = useState<any>({})
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.push('/login')
        return
      }

      const savedRole = localStorage.getItem('role') || ''
      const savedKodSekolah = localStorage.getItem('kod_sekolah') || ''

      setEmail(data.user.email || '')
      setRole(savedRole)
      setKodSekolah(savedKodSekolah)

      const { data: userInfo } = await supabase
        .from('users')
        .select('nama')
        .eq('email', data.user.email)
        .limit(1)
        .single()

      if (userInfo?.nama) setNamaGuru(userInfo.nama)

      const { data: sekolahInfo } = await supabase
        .from('schools')
        .select('nama_sekolah')
        .eq('kod_sekolah', savedKodSekolah)
        .single()

      if (sekolahInfo?.nama_sekolah) setNamaSekolah(sekolahInfo.nama_sekolah)

      const { data: kelasData } = await supabase
        .from('guru_kelas')
        .select('*')
        .eq('email', data.user.email)
        .eq('kod_sekolah', savedKodSekolah)

      const { data: subjekData } = await supabase
        .from('guru_subjek')
        .select('*')
        .eq('email', data.user.email)
        .eq('kod_sekolah', savedKodSekolah)

      if (kelasData && kelasData.length > 0) {
        setDarjah(String(kelasData[0].darjah))
        setKelas(kelasData[0].kelas)

        const { data: allSubjek } = await supabase
          .from('subjects')
          .select('*')
          .lte('darjah_min', kelasData[0].darjah)
          .gte('darjah_max', kelasData[0].darjah)
          .order('susunan', { ascending: true })

        setSubjects(allSubjek || [])
      } else if (subjekData && subjekData.length > 0) {
        setDarjah(String(subjekData[0].darjah))
        setKelas(subjekData[0].kelas)
        setNamaSubjek(subjekData[0].nama_subjek)
        setSubjects(subjekData)
      }
    }

    init()
  }, [router])

  useEffect(() => {
    async function getKodSubjek() {
      if (!namaSubjek || !darjah) return

      const { data } = await supabase
        .from('subjects')
        .select('kod_subjek')
        .eq('nama_subjek', namaSubjek)
        .lte('darjah_min', Number(darjah))
        .gte('darjah_max', Number(darjah))
        .single()

      if (data) setKodSubjek(data.kod_subjek)
    }

    getKodSubjek()
  }, [namaSubjek, darjah])

  async function paparMurid() {
    setMessage('')
    setStudents([])
    setMarkah({})

    if (!namaSubjek || !kodSubjek) {
      setMessage('Sila pilih subjek dahulu.')
      return
    }

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
      .eq('kod_subjek', kodSubjek)

    const map: any = {}

    ;(markahData || []).forEach((m: any) => {
      map[m.mykid] = m.markah
    })

    setMarkah(map)
  }

  function updateMarkah(mykid: string, value: string) {
    setMarkah((prev: any) => ({
      ...prev,
      [mykid]: value
    }))
  }

  function kiraGred(value: any) {
    if (value === '' || value === undefined || value === null) return '-'
    const m = Number(value)
    if (m >= 90) return 'MUMTAZ'
    if (m >= 75) return 'JAYYID JIDDAN'
    if (m >= 60) return 'JAYYID'
    if (m >= 40) return 'MAQBUL'
    return "MUSA'ADAH"
  }

  async function simpanSemua() {
    const dataUntukSimpan = students
      .filter((murid) => markah[murid.mykid] !== '' && markah[murid.mykid] !== undefined)
      .map((murid) => ({
        tahun: 2026,
        kod_exam: exam,
        kod_sekolah: kodSekolah,
        mykid: murid.mykid,
        kod_subjek: kodSubjek,
        markah: Number(markah[murid.mykid])
      }))

    const { error } = await supabase.from('marks').upsert(dataUntukSimpan, {
      onConflict: 'tahun,kod_exam,kod_sekolah,mykid,kod_subjek'
    })

    if (error) setMessage('Gagal simpan markah.')
    else setMessage('Semua markah berjaya disimpan.')
  }

  const filteredStudents = students.filter((m) =>
    m.nama.toLowerCase().includes(search.toLowerCase()) ||
    m.mykid.includes(search)
  )

  return (
    <main style={page}>
      <div style={container}>
        <section style={header}>
          <h1 style={{ margin: 0 }}>Input Markah Mengikut Kelas</h1>
          <p style={{ marginBottom: 0 }}>
            <b>Sekolah:</b> {namaSekolah || kodSekolah}<br />
            <b>Guru:</b> {namaGuru || email}<br />
            <b>Peperiksaan:</b> {exam} 2026<br />
            <b>Kelas:</b> {kelas || '-'} | <b>Darjah:</b> {darjah || '-'} | <b>Subjek:</b> {namaSubjek || '-'}
          </p>
        </section>

        <section style={card}>
          <div style={grid}>
            <div>
              <label>Peperiksaan</label>
              <select value={exam} onChange={(e) => setExam(e.target.value)} style={input}>
                <option value="UPSA">UPSA</option>
                <option value="UASA">UASA</option>
              </select>
            </div>

            <div>
              <label>Subjek</label>
              <select value={namaSubjek} onChange={(e) => setNamaSubjek(e.target.value)} style={input}>
                <option value="">-- Pilih Subjek --</option>
                {subjects.map((s: any, i: number) => (
                  <option key={i} value={s.nama_subjek}>{s.nama_subjek}</option>
                ))}
              </select>
            </div>
          </div>

          <button onClick={paparMurid} style={button}>
            PAPAR SENARAI MURID
          </button>

          {message && <p style={messageBox}>{message}</p>}
        </section>

        {students.length > 0 && (
          <section style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', marginBottom: '15px' }}>
              <h2 style={{ margin: 0 }}>Senarai Murid</h2>
              <input
                placeholder="Cari nama murid / MyKid..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...input, maxWidth: '350px', margin: 0 }}
              />
            </div>

            <div style={{ overflowX: 'auto' }}>
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
                  {filteredStudents.map((murid, index) => (
                    <tr key={murid.mykid}>
                      <td style={td}>{index + 1}</td>
                      <td style={td}>{murid.mykid}</td>
                      <td style={td}>{murid.jantina}</td>
                      <td style={td}><b>{murid.nama}</b></td>
                      <td style={td}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={markah[murid.mykid] ?? ''}
                          onChange={(e) => updateMarkah(murid.mykid, e.target.value)}
                          style={markInput}
                        />
                      </td>
                      <td style={td}>{kiraGred(markah[murid.mykid])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={simpanSemua} style={{ ...button, marginTop: '20px' }}>
              SIMPAN SEMUA MARKAH
            </button>
          </section>
        )}
      </div>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f1f5f9',
  padding: '30px',
  fontFamily: 'Arial'
}

const container = {
  maxWidth: '1200px',
  margin: '0 auto'
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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

const messageBox = {
  marginTop: '15px',
  background: '#ecfdf5',
  color: '#065f46',
  padding: '12px',
  borderRadius: '10px'
}

const table = {
  width: '100%',
  borderCollapse: 'collapse' as const
}

const th = {
  background: '#047857',
  color: 'white',
  padding: '12px',
  border: '1px solid #e2e8f0',
  textAlign: 'left' as const,
  position: 'sticky' as const,
  top: 0
}

const td = {
  padding: '10px',
  border: '1px solid #e2e8f0'
}

const markInput = {
  width: '90px',
  padding: '8px',
  border: '1px solid #cbd5e1',
  borderRadius: '8px',
  fontWeight: 'bold'
}