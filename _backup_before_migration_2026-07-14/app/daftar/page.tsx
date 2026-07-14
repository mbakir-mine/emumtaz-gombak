'use client'

import { useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function DaftarPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [role, setRole] = useState('ADMIN_SEKOLAH')
  const [kodSekolah, setKodSekolah] = useState('BYP7001')

  async function handleDaftar() {
    // 1. Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    // 2. Insert into table users
    await supabase.from('users').insert({
      email,
      nama,
      role,
      kod_sekolah: kodSekolah,
      status: 'AKTIF'
    })

    alert('Berjaya daftar!')
    router.push('/login')
  }

  return (
    <main style={{ padding: 30 }}>
      <h2>Daftar Pengguna</h2>

      <input placeholder="Nama" onChange={(e) => setNama(e.target.value)} /><br /><br />
      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br /><br />

      <select onChange={(e) => setRole(e.target.value)}>
        <option value="ADMIN_SEKOLAH">Admin Sekolah</option>
        <option value="ADMIN_DAERAH">Admin Daerah</option>
      </select><br /><br />

      <input placeholder="Kod Sekolah (BYP7001)" onChange={(e) => setKodSekolah(e.target.value)} /><br /><br />

      <button onClick={handleDaftar}>Daftar</button>
    </main>
  )
}