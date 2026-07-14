'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function InputPage() {
  const router = useRouter()

  const [kodSekolah, setKodSekolah] = useState('')
  const [role, setRole] = useState('')
  const [students, setStudents] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [marks, setMarks] = useState<any[]>([])

  const [selectedMykid, setSelectedMykid] = useState('')
  const [selectedSubjek, setSelectedSubjek] = useState('')
  const [markah, setMarkah] = useState('')
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

      if (!savedRole || !savedKodSekolah) {
        router.push('/akses')
        return
      }

      if (savedKodSekolah === 'SEMUA') {
        router.push('/akses')
        return
      }

      setRole(savedRole)
      setKodSekolah(savedKodSekolah)

      const { data: muridData } = await supabase
        .from('students')
        .select('*')
        .eq('kod_sekolah', savedKodSekolah)
        .eq('status', 'AKTIF')
        .order('darjah', { ascending: true })
        .order('nama', { ascending: true })

      setStudents(muridData || [])

      loadMarks(savedKodSekolah)
    }

    init()
  }, [router])

  async function loadMarks(sekolah: string) {
    const { data } = await supabase
      .from('marks')
      .select(`
        id,
        tahun,
        kod_exam,
        kod_sekolah,
        mykid,
        kod_subjek,
        markah,
        gred
      `)
      .eq('kod_sekolah', sekolah)
      .order('mykid', { ascending: true })

    setMarks(data || [])
  }

  useEffect(() => {
    async function loadSubjects() {
      if (!selectedMykid) return

      const murid = students.find((s) => s.mykid === selectedMykid)
      if (!murid) return

      const { data } = await supabase
        .from('subjects')
        .select('*')
        .lte('darjah_min', murid.darjah)
        .gte('darjah_max', murid.darjah)
        .order('susunan', { ascending: true })

      setSubjects(data || [])
    }

    loadSubjects()
  }, [selectedMykid, students])

  useEffect(() => {
    async function loadExistingMarkah() {
      if (!selectedMykid || !selectedSubjek || !kodSekolah) return

      const { data } = await supabase
        .from('marks')
        .select('markah')
        .eq('tahun', 2026)
        .eq('kod_exam', 'UPSA')
        .eq('kod_sekolah', kodSekolah)
        .eq('mykid', selectedMykid)
        .eq('kod_subjek', selectedSubjek)
        .maybeSingle()

      if (data) {
        setMarkah(String(data.markah))
      } else {
        setMarkah('')
      }
    }

    loadExistingMarkah()
  }, [selectedMykid, selectedSubjek, kodSekolah])

  async function handleSubmit(e: any) {
    e.preventDefault()
    setMessage('')

    if (!selectedMykid || !selectedSubjek || markah === '') {
      setMessage('Sila lengkapkan semua maklumat.')
      return
    }

    const { error } = await supabase.from('marks').upsert(
      [
        {
          tahun: 2026,
          kod_exam: 'UPSA',
          kod_sekolah: kodSekolah,
          mykid: selectedMykid,
          kod_subjek: selectedSubjek,
          markah: Number(markah)
        }
      ],
      {
        onConflict: 'tahun,kod_exam,kod_sekolah,mykid,kod_subjek'
      }
    )

    if (error) {
      console.log(error)
      setMessage('Gagal simpan. Sila semak data murid, subjek atau markah.')
    } else {
      setMessage('Markah berjaya disimpan / dikemaskini.')
      setSelectedSubjek('')
      setMarkah('')
      loadMarks(kodSekolah)
    }
  }

  function resetForm() {
    setSelectedMykid('')
    setSelectedSubjek('')
    setSubjects([])
    setMarkah('')
    setMessage('')
  }

  const getNamaMurid = (mykid: string) => {
    const murid = students.find((s) => s.mykid === mykid)
    return murid ? murid.nama : mykid
  }

  const getNamaSubjek = (kod: string) => {
    const subjek = subjects.find((s) => s.kod_subjek === kod)
    return subjek ? subjek.nama_subjek : kod
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#f1f5f9',
      padding: '30px',
      fontFamily: 'Arial'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '18px',
          boxShadow: '0 10px 25px rgba(15,23,42,0.10)',
          marginBottom: '25px'
        }}>
          <h1>Input Markah e-Mumtaz</h1>

          <p>
            Role: <b>{role}</b><br />
            Kod Sekolah: <b>{kodSekolah}</b>
          </p>

          <form onSubmit={handleSubmit}>
            <label>Pilih Murid</label>
            <select
              value={selectedMykid}
              onChange={(e) => {
                setSelectedMykid(e.target.value)
                setSelectedSubjek('')
                setSubjects([])
                setMarkah('')
                setMessage('')
              }}
              style={inputStyle}
              required
            >
              <option value="">-- Pilih Murid --</option>
              {students.map((murid) => (
                <option key={murid.mykid} value={murid.mykid}>
                  Tahun {murid.darjah} - {murid.nama} ({murid.mykid})
                </option>
              ))}
            </select>

            <label>Pilih Subjek</label>
            <select
              value={selectedSubjek}
              onChange={(e) => {
                setSelectedSubjek(e.target.value)
                setMessage('')
              }}
              style={inputStyle}
              required
              disabled={!selectedMykid}
            >
              <option value="">-- Pilih Subjek --</option>
              {subjects.map((subjek) => (
                <option key={subjek.kod_subjek} value={subjek.kod_subjek}>
                  {subjek.nama_subjek}
                </option>
              ))}
            </select>

            <label>Markah</label>
            <input
              type="number"
              min="0"
              max="100"
              value={markah}
              onChange={(e) => setMarkah(e.target.value)}
              placeholder="Contoh: 85"
              style={inputStyle}
              required
            />

            <button type="submit" style={buttonStyle}>
              SIMPAN / KEMASKINI MARKAH
            </button>

            <button type="button" onClick={resetForm} style={buttonSecondary}>
              RESET BORANG
            </button>
          </form>

          {message && (
            <p style={{
              marginTop: '15px',
              background: '#ecfdf5',
              color: '#065f46',
              padding: '12px',
              borderRadius: '10px'
            }}>
              {message}
            </p>
          )}
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '18px',
          boxShadow: '0 10px 25px rgba(15,23,42,0.10)'
        }}>
          <h2>Senarai Markah Telah Diisi</h2>

          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            marginTop: '15px'
          }}>
            <thead>
              <tr style={{ background: '#047857', color: 'white' }}>
                <th style={th}>Bil</th>
                <th style={th}>Murid</th>
                <th style={th}>Subjek</th>
                <th style={th}>Markah</th>
                <th style={th}>Gred</th>
              </tr>
            </thead>
            <tbody>
              {marks.map((m, index) => (
                <tr key={m.id}>
                  <td style={td}>{index + 1}</td>
                  <td style={td}>{getNamaMurid(m.mykid)}</td>
                  <td style={td}>{m.kod_subjek}</td>
                  <td style={td}>{m.markah}</td>
                  <td style={td}>{m.gred}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {marks.length === 0 && (
            <p>Belum ada markah direkodkan.</p>
          )}
        </div>
      </div>
    </main>
  )
}

const inputStyle = {
  width: '100%',
  padding: '12px',
  marginTop: '6px',
  marginBottom: '16px',
  border: '1px solid #cbd5e1',
  borderRadius: '10px'
}

const buttonStyle = {
  width: '100%',
  padding: '14px',
  background: '#047857',
  color: 'white',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer'
}

const buttonSecondary = {
  width: '100%',
  padding: '12px',
  background: '#e2e8f0',
  color: '#0f172a',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: '10px'
}

const th = {
  padding: '12px',
  border: '1px solid #e2e8f0',
  textAlign: 'left' as const
}

const td = {
  padding: '12px',
  border: '1px solid #e2e8f0'
}