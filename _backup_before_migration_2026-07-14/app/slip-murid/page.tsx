'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function SlipMuridPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [namaSekolah, setNamaSekolah] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])
  const [ranking, setRanking] = useState<any>(null)

  const [exam, setExam] = useState('UPSA')
  const [selectedMykid, setSelectedMykid] = useState('')
  const [murid, setMurid] = useState<any>(null)

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

      const { data: muridData } = await supabase
        .from('students')
        .select('*')
        .eq('kod_sekolah', savedKodSekolah)
        .eq('status', 'AKTIF')
        .order('darjah', { ascending: true })
        .order('kelas', { ascending: true })
        .order('nama', { ascending: true })

      setStudents(muridData || [])
    }

    init()
  }, [router])

  async function paparSlip() {
    if (!selectedMykid) return

    const selected = students.find((s) => s.mykid === selectedMykid)
    if (!selected) return

    setMurid(selected)

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('*')
      .lte('darjah_min', selected.darjah)
      .gte('darjah_max', selected.darjah)
      .order('susunan', { ascending: true })

    setSubjects(subjectData || [])

    const { data: markahData } = await supabase
      .from('marks')
      .select('*')
      .eq('tahun', 2026)
      .eq('kod_exam', exam)
      .eq('kod_sekolah', kodSekolah)
      .eq('mykid', selectedMykid)

    setMarks(markahData || [])

    const { data: rankingData } = await supabase
      .from('ranking_kelas')
      .select('*')
      .eq('kod_sekolah', kodSekolah)
      .eq('mykid', selectedMykid)
      .single()

    setRanking(rankingData || null)
  }

  function getMarkah(kodSubjek: string) {
    const rekod = marks.find((m) => m.kod_subjek === kodSubjek)
    return rekod?.markah ?? ''
  }

  function getGredByMarkah(markah: any) {
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

  const subjekDikira = subjects.filter(
    (s) =>
      s.dikira === true &&
      s.nama_subjek !== 'Al-Quran' &&
      s.nama_subjek !== 'Hafazan'
  )

  const jumlahMarkahDikira = subjekDikira.reduce((total: number, subjek: any) => {
    const markah = getMarkah(subjek.kod_subjek)
    return total + Number(markah || 0)
  }, 0)

  const purata =
    subjekDikira.length > 0
      ? (jumlahMarkahDikira / subjekDikira.length).toFixed(2)
      : '-'

  const gredKeseluruhan =
    purata === '-' ? '-' : getGredByMarkah(Number(purata))

  return (
    <main style={page}>
      <style>
        {`
          @media print {
            .no-print { display: none !important; }
            body { background: white !important; }
            main { padding: 0 !important; background: white !important; }
            .print-card { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
          }
        `}
      </style>

      <section className="no-print" style={header}>
        <h1 style={{ margin: 0 }}>Slip Individu Murid</h1>
        <p>Kod Sekolah: <b>{kodSekolah}</b></p>

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
            <label>Pilih Murid</label>
            <select
              value={selectedMykid}
              onChange={(e) => {
                setSelectedMykid(e.target.value)
                setMurid(null)
                setSubjects([])
                setMarks([])
                setRanking(null)
              }}
              style={input}
            >
              <option value="">-- Pilih Murid --</option>
              {students.map((s) => (
                <option key={s.mykid} value={s.mykid}>
                  Tahun {s.darjah} - {s.kelas} - {s.nama}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button onClick={paparSlip} style={button}>
          PAPAR SLIP
        </button>
      </section>

      {murid && (
        <section className="print-card" style={card}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0 }}>SLIP PRESTASI MURID</h2>
            <p style={{ margin: '6px 0' }}>
              <b>{namaSekolah || kodSekolah}</b>
            </p>
            <p style={{ margin: 0 }}>
              {namaExam(exam)} 2026
            </p>
          </div>

          <table style={{ width: '100%', marginBottom: '18px' }}>
            <tbody>
              <tr>
                <td><b>Nama Murid</b></td>
                <td>: {murid.nama}</td>
                <td><b>MyKid</b></td>
                <td>: {murid.mykid}</td>
              </tr>
              <tr>
                <td><b>Darjah</b></td>
                <td>: Tahun {murid.darjah}</td>
                <td><b>Kelas</b></td>
                <td>: {murid.kelas}</td>
              </tr>
              <tr>
                <td><b>Jantina</b></td>
                <td>: {murid.jantina}</td>
                <td><b>Kod Sekolah</b></td>
                <td>: {kodSekolah}</td>
              </tr>
            </tbody>
          </table>

          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Bil</th>
                <th style={th}>Subjek</th>
                <th style={th}>Markah</th>
                <th style={th}>Gred</th>
              </tr>
            </thead>

            <tbody>
              {subjects.map((subjek, index) => {
                const markah = getMarkah(subjek.kod_subjek)
                const gred = getGredByMarkah(markah)
                const tidakDikira =
                  subjek.nama_subjek === 'Al-Quran' ||
                  subjek.nama_subjek === 'Hafazan'

                return (
                  <tr key={subjek.kod_subjek}>
                    <td style={td}>{index + 1}</td>
                    <td style={td}>
                      {subjek.nama_subjek}
                      {tidakDikira && (
                        <span style={{ color: '#64748b', fontSize: '12px' }}>
                          {' '}(Tidak dikira dalam purata)
                        </span>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'center', fontWeight: 'bold' }}>
                      {markah}
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

          <p style={{ marginTop: '10px', fontSize: '13px', color: '#64748b' }}>
            Nota: Markah Al-Quran dan Hafazan tidak diambil kira dalam purata keseluruhan.
            Subjek yang belum diisi akan dikira sebagai 0 bagi subjek yang termasuk dalam kiraan.
          </p>

          <div style={summaryBox}>
            <div>
              <p style={summaryLabel}>Purata Keseluruhan</p>
              <p style={summaryValue}>{purata}</p>
            </div>

            <div>
              <p style={summaryLabel}>Gred Keseluruhan</p>
              <p style={{ ...summaryValue, color: gredColor(gredKeseluruhan) }}>
                {gredKeseluruhan}
              </p>
            </div>

            <div>
              <p style={summaryLabel}>Kedudukan Dalam Kelas</p>
              <p style={{
                ...summaryValue,
                color:
                  ranking?.kedudukan === 1 ? '#16a34a' :
                  ranking?.kedudukan === 2 ? '#2563eb' :
                  ranking?.kedudukan === 3 ? '#ca8a04' :
                  '#111827'
              }}>
                {ranking?.kedudukan ? `Ke-${ranking.kedudukan}` : '-'}
              </p>

              {ranking?.kedudukan === 1 && (
                <p style={{ color: '#16a34a', fontWeight: 'bold' }}>🥇 TOP 1 KELAS</p>
              )}

              {ranking?.kedudukan === 2 && (
                <p style={{ color: '#2563eb', fontWeight: 'bold' }}>🥈 TOP 2 KELAS</p>
              )}

              {ranking?.kedudukan === 3 && (
                <p style={{ color: '#ca8a04', fontWeight: 'bold' }}>🥉 TOP 3 KELAS</p>
              )}

              {ranking?.jumlah_murid && ranking?.kedudukan === ranking?.jumlah_murid && (
                <p style={{ color: '#dc2626', fontWeight: 'bold' }}>
                  ❗ PERLU INTERVENSI
                </p>
              )}
            </div>

            <div>
              <p style={summaryLabel}>Status</p>
              <p style={summaryValue}>
                {purata !== '-' && Number(purata) >= 90
                  ? 'CALON MUMTAZ'
                  : purata !== '-' && Number(purata) >= 75
                  ? 'POTENSI MUMTAZ'
                  : purata !== '-'
                  ? 'PERLU BIMBINGAN'
                  : '-'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '35px', display: 'flex', justifyContent: 'space-between' }}>
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
            CETAK SLIP
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

const summaryBox = {
  marginTop: '20px',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '15px'
}

const summaryLabel = {
  margin: 0,
  color: '#64748b',
  fontSize: '13px'
}

const summaryValue = {
  margin: '6px 0 0',
  fontSize: '24px',
  fontWeight: 'bold'
}