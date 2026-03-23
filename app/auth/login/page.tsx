'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="https://www.dfminsights.com" style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', color: 'var(--ink)' }}>
            DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
          </a>
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--mid)' }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px' }}>
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: '7px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>Email</label>
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>Password</label>
            <input
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none' }}
            />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: 'var(--amber)', color: 'var(--ink)',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--mid)' }}>
            No account?{' '}
            <a href="/auth/signup" style={{ color: 'var(--amber)', fontWeight: 600 }}>Sign up</a>
          </p>
        </form>
      </div>
    </div>
  )
}
