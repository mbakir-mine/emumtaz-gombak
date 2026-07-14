'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

export default function AnalisisPage() {
  const [data, setData] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    async function load() {
      const ks = localStorage.getItem('kod_sekolah') || 'BYP7001'

      const { data, error } = await supabase
        .from('analisis_sekolah')
        .select('*')
        .eq('kod_sekolah', ks)
        .maybeSingle()

      if (error) {
        console.log(error)
        setErrorMsg('Ralat membaca data analisis.')
        setLoading(false)
        return
      }

      if (!data) {
        setErrorMsg('Tiada data analisis ditemui untuk kod sekolah ini.')
        setLoading(false)
        return
      }

      setData(data)
      setChartData([
        { name: 'Mumtaz', value: data.bil_mumtaz || 0 },
        { name: 'Lulus', value: data.bil_lulus || 0 },
      ])

      setLoading(false)
    }

    load()
  }, [])

  if (loading) return <p style={{ padding: 30 }}>Loading...</p>
  if (errorMsg) return <main style={page}><h2>{errorMsg}</h2></main>

  return (
    <main style={page}>
      <h1>📊 Analisis Sekolah</h1>

      <div style={grid}>
        <Card title="Jumlah Murid" value={data.jumlah_murid} color="#16a34a" bg="#dcfce7" />
        <Card title="Purata Sekolah" value={data.purata_sekolah} color="#2563eb" bg="#dbeafe" />
        <Card title="% Mumtaz" value={data.peratus_mumtaz + '%'} color="#7c3aed" bg="#ede9fe" />
        <Card title="% Lulus" value={data.peratus_lulus + '%'} color="#ea580c" bg="#ffedd5" />
      </div>

      <div style={grid}>
        <div style={card}>
          <h3>Prestasi Murid</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                <Cell fill="#22c55e" />
                <Cell fill="#3b82f6" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={card}>
          <h3>Peratus Prestasi</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartData} dataKey="value" outerRadius={95} label>
                <Cell fill="#22c55e" />
                <Cell fill="#3b82f6" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </main>
  )
}

function Card({ title, value, color, bg }: any) {
  return (
    <div style={{ ...card, background: bg }}>
      <h3>{title}</h3>
      <p style={{ fontSize: 30, fontWeight: 'bold', color }}>{value}</p>
    </div>
  )
}

const page = {
  padding: 30,
  background: '#f8fafc',
  minHeight: '100vh',
  fontFamily: 'Arial'
}

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: 20,
  marginBottom: 20
}

const card = {
  background: 'white',
  padding: 22,
  borderRadius: 18,
  boxShadow: '0 10px 25px rgba(15,23,42,0.08)'
}