'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function RankingDaerahPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function loadRanking() {
      const { data, error } = await supabase
        .from('ranking_daerah')
        .select('*')
        .order('ranking_daerah', { ascending: true })

      if (!error && data) setData(data)
      else console.log(error)
    }

    loadRanking()
  }, [])

  const filtered = data.filter((item) =>
    item.nama_sekolah?.toLowerCase().includes(search.toLowerCase()) ||
    item.kod_sekolah?.toLowerCase().includes(search.toLowerCase())
  )

  function warnaRanking(rank: number) {
    if (rank === 1) return '#16a34a'
    if (rank === 2) return '#2563eb'
    if (rank === 3) return '#ca8a04'
    return '#334155'
  }

  return (
    <main style={page}>
      <section style={header}>
        <h1 style={{ margin: 0 }}>🏆 Ranking Daerah Gombak</h1>
        <p style={{ marginBottom: 0 }}>
          Kedudukan sekolah berdasarkan purata markah peperiksaan.
        </p>

        <button onClick={() => router.push('/')} style={buttonWhite}>
          Dashboard
        </button>
      </section>

      <section style={card}>
        <input
          placeholder="Cari nama sekolah / kod sekolah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={input}
        />

        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                <th style={th}>Ranking</th>
                <th style={th}>Kod Sekolah</th>
                <th style={th}>Nama Sekolah</th>
                <th style={th}>Jumlah Murid</th>
                <th style={th}>Purata Sekolah</th>
                <th style={th}>Status</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((item, index) => (
                <tr key={index}>
                  <td style={td}>
                    <b style={{
                      color: warnaRanking(Number(item.ranking_daerah)),
                      fontSize: '22px'
                    }}>
                      {item.ranking_daerah === 1
                        ? '🥇'
                        : item.ranking_daerah === 2
                        ? '🥈'
                        : item.ranking_daerah === 3
                        ? '🥉'
                        : `Ke-${item.ranking_daerah}`}
                    </b>
                  </td>
                  <td style={td}>{item.kod_sekolah}</td>
                  <td style={td}><b>{item.nama_sekolah}</b></td>
                  <td style={td}>{item.jumlah_murid}</td>
                  <td style={td}>
                    <b style={{ color: warnaRanking(Number(item.ranking_daerah)) }}>
                      {item.purata_sekolah}
                    </b>
                  </td>
                  <td style={td}>
                    {item.ranking_daerah <= 3 ? (
                      <span style={badgeGreen}>TOP 3 DAERAH</span>
                    ) : (
                      <span style={badgeBlue}>AKTIF</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && <p>Tiada data ranking ditemui.</p>}
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

const badgeGreen = {
  background: '#dcfce7',
  color: '#166534',
  padding: '6px 10px',
  borderRadius: '999px',
  fontWeight: 'bold',
  fontSize: '12px'
}

const badgeBlue = {
  background: '#dbeafe',
  color: '#1d4ed8',
  padding: '6px 10px',
  borderRadius: '999px',
  fontWeight: 'bold',
  fontSize: '12px'
}