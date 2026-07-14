'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function PerbandinganTahunanPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadData() {
      const ks = localStorage.getItem('kod_sekolah') || ''

      if (!ks) {
        router.push('/akses')
        return
      }

      setKodSekolah(ks)

      let query = supabase
        .from('perbandingan_tahunan')
        .select('*')
        .order('tahun', { ascending: true })

      if (ks !== 'SEMUA') {
        query = query.eq('kod_sekolah', ks)
      }

      const { data, error } = await query

      if (!error && data) setData(data)
      else console.log(error)
    }

    loadData()
  }, [router])

  const filtered = data.filter((item) =>
    item.nama_sekolah?.toLowerCase().includes(search.toLowerCase()) ||
    item.kod_exam?.toLowerCase().includes(search.toLowerCase()) ||
    String(item.tahun).includes(search)
  )

  function warnaPurata(purata: number) {
    if (purata >= 90) return '#16a34a'
    if (purata >= 75) return '#2563eb'
    if (purata >= 60) return '#ca8a04'
    if (purata >= 40) return '#f97316'
    return '#dc2626'
  }

  return (
    <main style={page}>
      <section style={header}>
        <h1 style={{ margin: 0 }}>📊 Perbandingan Tahunan</h1>
        <p>
          Rekod prestasi UPSA dan UASA mengikut tahun untuk simpanan jangka panjang.
        </p>

        <button onClick={() => router.push('/')} style={buttonWhite}>
          Dashboard
        </button>
      </section>

      <section style={card}>
        <input
          placeholder="Cari sekolah / tahun / UPSA / UASA..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Bil</th>
                <th style={th}>Sekolah</th>
                <th style={th}>Tahun</th>
                <th style={th}>Peperiksaan</th>
                <th style={th}>Jumlah Murid</th>
                <th style={th}>Purata</th>
                <th style={th}>Mumtaz</th>
                <th style={th}>Lulus</th>
                <th style={th}>% Mumtaz</th>
                <th style={th}>% Lulus</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item, index) => (
                <tr key={index}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{item.nama_sekolah}</td>
                  <td style={td}>{item.tahun}</td>
                  <td style={td}>{item.kod_exam}</td>
                  <td style={td}>{item.jumlah_murid}</td>
                  <td style={{
                    ...td,
                    fontWeight: 'bold',
                    color: warnaPurata(Number(item.purata))
                  }}>
                    {item.purata}
                  </td>
                  <td style={td}>{item.bil_mumtaz}</td>
                  <td style={td}>{item.bil_lulus}</td>
                  <td style={td}>{item.peratus_mumtaz}%</td>
                  <td style={td}>{item.peratus_lulus}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <p>Tiada data perbandingan tahunan ditemui.</p>}
      </section>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f8fafc',
  padding: '30px',
  fontFamily: 'Arial'
}

const header = {
  background: 'linear-gradient(135deg, #065f46, #0f766e)',
  color: 'white',
  padding: '28px',
  borderRadius: '18px',
  marginBottom: '20px'
}

const card = {
  background: 'white',
  padding: '25px',
  borderRadius: '18px',
  boxShadow: '0 10px 25px rgba(15,23,42,0.08)'
}

const input = {
  width: '100%',
  padding: '12px',
  marginBottom: '16px',
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
  padding: '12px',
  border: '1px solid #e2e8f0'
}

const buttonWhite = {
  background: 'white',
  color: '#047857',
  border: 'none',
  padding: '10px 14px',
  borderRadius: '8px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '15px'
}