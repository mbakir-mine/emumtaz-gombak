'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function AksesPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [akses, setAkses] = useState<any[]>([])
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    async function loadAkses() {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.push('/login')
        return
      }

      const userEmail = userData.user.email || ''
      setEmail(userEmail)

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', userEmail)
        .eq('status', 'AKTIF')

      if (error) {
        console.log(error)
        setMessage('Ralat membaca akses pengguna.')
        return
      }

      if (!data || data.length === 0) {
        setMessage('Tiada akses ditemui untuk email ini.')
        return
      }

      setAkses(data)
      setMessage('')
    }

    loadAkses()
  }, [router])

  function pilihAkses(item: any) {
    localStorage.setItem('role', item.role)
    localStorage.setItem('kod_sekolah', item.kod_sekolah)
    router.push('/')
  }

  async function logout() {
    localStorage.removeItem('role')
    localStorage.removeItem('kod_sekolah')
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main style={page}>
      <section style={card}>
        <h2 style={{ marginTop: 0 }}>Pilih Akses e-Mumtaz</h2>
        <p>Pengguna: <b>{email}</b></p>

        {message && <p style={warning}>{message}</p>}

        {akses.map((item) => (
          <button key={item.id} onClick={() => pilihAkses(item)} style={aksesButton}>
            <b>{item.role}</b>
            <br />
            Kod Sekolah: {item.kod_sekolah}
          </button>
        ))}

        <button onClick={logout} style={logoutButton}>
          Logout
        </button>
      </section>
    </main>
  )
}

const page = {
  minHeight: '100vh',
  background: '#f1f5f9',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'Arial'
}

const card = {
  background: 'white',
  padding: 30,
  borderRadius: 18,
  width: '100%',
  maxWidth: 650,
  boxShadow: '0 10px 25px rgba(15,23,42,0.10)'
}

const warning = {
  background: '#fef3c7',
  color: '#92400e',
  padding: 12,
  borderRadius: 10
}

const aksesButton = {
  width: '100%',
  textAlign: 'left' as const,
  padding: 18,
  marginBottom: 12,
  borderRadius: 12,
  border: '1px solid #a7f3d0',
  background: '#ecfdf5',
  cursor: 'pointer',
  fontSize: 16
}

const logoutButton = {
  background: '#dc2626',
  color: 'white',
  border: 'none',
  padding: '12px 18px',
  borderRadius: 10,
  fontWeight: 'bold',
  cursor: 'pointer',
  marginTop: 10
}