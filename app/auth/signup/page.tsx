'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } }
    })
    if (error) { setError(error.message); setLoading(false) }
    else setDone(true)
  }

  if (done) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', maxWidth: '400px' }}>
        <div style={{ fontSize: '36px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', marginBottom: '8px' }}>Check your email</h2>
        <p style={{ fontSize: '14px', color: 'var(--mid)', lineHeight: 1.7 }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
        </p>
        <a href="/auth/login" style={{ display: 'inline-block', marginTop: '20px', color: 'var(--amber)', fontWeight: 600, fontSize: '14px' }}>
          Go to Sign In →
        </a>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <a href="https://www.dfminsights.com" style={{ fontFamily: '"Instrument Serif", serif', fontSize: '24px', color: 'var(--ink)' }}>
            DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
          </a>
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--mid)' }}>Create your account</p>
        </div>

        <form onSubmit={handleSignup} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px' }}>
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: '7px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Full name</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)}
              placeholder="Jane Smith"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              style={{ width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none' }} />
          </div>

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', background: 'var(--amber)', color: 'var(--ink)',
            border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--mid)' }}>
            Already have an account?{' '}
            <a href="/auth/login" style={{ color: 'var(--amber)', fontWeight: 600 }}>Sign in</a>
          </p>
        </form>
      </div>
    </div>
  )
}
