'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function ProgressPage() {
  const router = useRouter()

  const [role, setRole] = useState('')
  const [kodSekolah, setKodSekolah] = useState('')
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [filterDarjah, setFilterDarjah] = useState('')

  useEffect(() => {
    async function loadProgress() {
      const savedRole = localStorage.getItem('role') || ''
      const savedKodSekolah = localStorage.getItem('kod_sekolah') || ''

      if (!savedRole || !savedKodSekolah) {
        router.push('/akses')
        return
      }

      setRole(savedRole)
      setKodSekolah(savedKodSekolah)

      let query = supabase
        .from('progress_markah_sekolah')
        .select('*')

      if (savedKodSekolah !== 'SEMUA') {
        query = query.eq('kod_sekolah', savedKodSekolah)
      }

      const { data, error } = await query

      if (error) {
        console.log(error)
      } else {
        setData(data || [])
      }
    }

    loadProgress()
  }, [router])

  const filteredData = data.filter((item) => {
    const matchSearch =
      item.nama_sekolah?.toLowerCase().includes(search.toLowerCase()) ||
      item.kelas?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_subjek?.toLowerCase().includes(search.toLowerCase())

    const matchDarjah =
      filterDarjah === '' || String(item.darjah) === filterDarjah

    return matchSearch && matchDarjah
  })

  function statusColor(percent: number) {
    if (percent >= 100) return '#16a34a'
    if (percent >= 50) return '#ca8a04'
    return '#dc2626'
  }

  function statusText(percent: number) {
    if (percent >= 100) return 'SIAP'
    if (percent >= 50) return 'SEDANG DIISI'
    return 'BELUM LENGKAP'
  }

  return (
    <main style={page}>
      <section style={header}>
        <h1 style={{ margin: 0 }}>Progress Pengisian Markah</h1>
        <p>
          Role: <b>{role}</b> | Kod Sekolah: <b>{kodSekolah}</b>
        </p>

        <button onClick={() => router.push('/')} style={buttonWhite}>
          Dashboard
        </button>
      </section>

      <section style={card}>
        <div style={filterGrid}>
          <input
            placeholder="Cari sekolah / kelas / subjek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={input}
          />

          <select
            value={filterDarjah}
            onChange={(e) => setFilterDarjah(e.target.value)}
            style={input}
          >
            <option value="">Semua Darjah</option>
            <option value="1">Tahun 1</option>
            <option value="2">Tahun 2</option>
            <option value="3">Tahun 3</option>
            <option value="4">Tahun 4</option>
            <option value="5">Tahun 5</option>
            <option value="6">Tahun 6</option>
          </select>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Bil</th>
                <th style={th}>Sekolah</th>
                <th style={th}>Darjah</th>
                <th style={th}>Kelas</th>
                <th style={th}>Subjek</th>
                <th style={th}>Murid</th>
                <th style={th}>Sudah Isi</th>
                <th style={th}>Belum Isi</th>
                <th style={th}>Progress</th>
                <th style={th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredData.map((item, index) => {
                const percent = Number(item.peratus_siap || 0)

                return (
                  <tr key={index}>
                    <td style={td}>{index + 1}</td>
                    <td style={td}>{item.nama_sekolah}</td>
                    <td style={td}>Tahun {item.darjah}</td>
                    <td style={td}>{item.kelas}</td>
                    <td style={td}>{item.nama_subjek}</td>
                    <td style={td}>{item.jumlah_murid}</td>
                    <td style={td}>{item.jumlah_sudah_isi}</td>
                    <td style={td}>{item.jumlah_belum_isi}</td>
                    <td style={td}>
                      <div style={progressOuter}>
                        <div style={{
                          ...progressInner,
                          width: `${percent}%`,
                          background: statusColor(percent)
                        }} />
                      </div>
                      <b style={{ color: statusColor(percent) }}>
                        {percent}%
                      </b>
                    </td>
                    <td style={td}>
                      <span style={{
                        background: statusColor(percent),
                        color: 'white',
                        padding: '6px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {statusText(percent)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {filteredData.length === 0 && (
          <p>Tiada data progress ditemui.</p>
        )}
      </section>
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
  boxShadow: '0 10px 25px rgba(15,23,42,0.10)'
}

const filterGrid = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: '12px',
  marginBottom: '16px'
}

const input = {
  width: '100%',
  padding: '12px',
  border: '1px solid #cbd5e1',
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
  textAlign: 'left' as const
}

const td = {
  padding: '10px',
  border: '1px solid #e2e8f0',
  verticalAlign: 'middle' as const
}

const progressOuter = {
  background: '#e5e7eb',
  borderRadius: '999px',
  height: '12px',
  width: '100%',
  marginBottom: '6px',
  overflow: 'hidden'
}

const progressInner = {
  height: '100%',
  borderRadius: '999px'
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