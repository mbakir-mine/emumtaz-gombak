'use client'

import { useState } from 'react'
import { supabase } from '../supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleLogin() {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      alert(error.message)
      return
    }

    router.push('/akses')
  }

  return (
    <main style={{ padding: 30 }}>
      <h2>Login e-Mumtaz</h2>

      <input placeholder="Email" onChange={(e) => setEmail(e.target.value)} /><br /><br />
      <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} /><br /><br />

      <button onClick={handleLogin}>Login</button>

      <br /><br />
      <button onClick={() => router.push('/daftar')}>
        Daftar Pengguna Baru
      </button>
    </main>
  )
}