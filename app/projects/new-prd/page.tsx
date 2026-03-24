'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const QUESTIONS = [
  { id: 'product_name', label: 'What is the name of your product?', placeholder: 'e.g. FitPaw Smart Dog Collar', required: true, type: 'text' },
  { id: 'problem', label: 'What problem does your product solve?', placeholder: 'Describe the core problem in 2-3 sentences', required: true, type: 'textarea' },
  { id: 'target_user', label: 'Who is your target user?', placeholder: 'e.g. Dog owners aged 25-45 who track their own fitness', required: true, type: 'text' },
  { id: 'core_features', label: 'What are the 3-5 core features?', placeholder: 'e.g. GPS tracking, heart rate monitor, 7-day battery, IP67', required: true, type: 'textarea' },
  { id: 'category', label: 'Product category', placeholder: '', required: true, type: 'select', options: ['Consumer Electronics', 'Medical Device', 'Industrial IoT', 'EV / Charging', 'Smart Home', 'Wearable', 'Robotics', 'Other'] },
  { id: 'connectivity', label: 'What connectivity does your product need?', placeholder: 'e.g. Bluetooth 5.2, WiFi, LoRa, NFC, none', required: false, type: 'text' },
  { id: 'battery', label: 'Battery / power requirements', placeholder: 'e.g. 7-day battery life, rechargeable via USB-C, or mains powered', required: false, type: 'text' },
  { id: 'environmental', label: 'Environmental requirements', placeholder: 'e.g. IP67, -10°C to 50°C operating range, drop resistant', required: false, type: 'text' },
  { id: 'regulatory', label: 'Regulatory requirements', placeholder: 'e.g. CE marking, FCC, FDA 510(k), none yet', required: false, type: 'text' },
  { id: 'target_cost', label: 'Target unit cost and retail price', placeholder: 'e.g. BOM target €15, retail price €89', required: false, type: 'text' },
  { id: 'timeline', label: 'What is your target launch timeline?', placeholder: 'e.g. EVT in 3 months, launch in 12 months', required: false, type: 'text' },
  { id: 'constraints', label: 'Any key constraints or things to avoid?', placeholder: 'e.g. must use existing tooling, no subscription model, max weight 30g', required: false, type: 'textarea' },
]

const inputStyle = {
  width: '100%', padding: '10px 14px', border: '1px solid var(--border)',
  borderRadius: '7px', background: 'var(--cream)', outline: 'none',
  fontSize: '14px', fontFamily: 'var(--font-sans)',
}

export default function NewPRDPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function set(id: string, val: string) {
    setAnswers(prev => ({ ...prev, [id]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const missing = QUESTIONS.filter(q => q.required && !answers[q.id]?.trim())
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.map(q => q.label).join(', ')}`)
      return
    }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Check PRD package
      const { data: profile } = await supabase
        .from('profiles')
        .select('package, paid')
        .eq('id', user.id)
        .single()

      if (!profile?.paid || (profile.package !== 'prd' && profile.package !== 'ai')) {
        setError('Please purchase the PRD Generator package to continue.')
        setLoading(false)
        return
      }

      // Check project limit for PRD package (1 project only)
      if (profile.package === 'prd') {
        const { count } = await supabase
          .from('projects')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
        if ((count ?? 0) >= 1) {
          setError('The PRD Generator package includes 1 project. Upgrade to the AI Package for more projects.')
          setLoading(false)
          return
        }
      }

      // Create project
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: answers.product_name,
          description: answers.problem,
          product_category: answers.category,
          build_stage: 'Pre-EVT — design phase',
          status: 'generating',
        })
        .select()
        .single()

      if (projErr) throw projErr

      // Generate PRD via API
      const res = await fetch('/api/generate-prd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, answers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const progress = QUESTIONS.filter(q => answers[q.id]?.trim()).length
  const progressPct = Math.round((progress / QUESTIONS.length) * 100)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ background: 'rgba(255,255,255,.96)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', alignItems: 'center', height: '64px', gap: '12px' }}>
        <a href="/dashboard" style={{ fontFamily: '"Instrument Serif", serif', fontSize: '20px', color: 'var(--ink)' }}>
          DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
        </a>
        <span style={{ color: 'var(--light)', fontSize: '14px' }}>/ PRD Generator</span>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '48px 24px' }}>
        <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.2em', textTransform: 'uppercase', color: 'var(--mid)', marginBottom: '12px' }}>
          PRD Generator
        </div>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '32px', marginBottom: '8px', letterSpacing: '-.02em' }}>
          Let's build your <span style={{ fontStyle: 'italic', color: 'var(--amber)' }}>PRD</span>
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--mid)', lineHeight: 1.72, marginBottom: '32px' }}>
          Answer these questions and we'll generate a complete Product Requirements Document. You can revise it twice after generation.
        </p>

        {/* Progress bar */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--mid)' }}>{progress} of {QUESTIONS.length} answered</span>
            <span style={{ fontSize: '12px', color: 'var(--amber)', fontWeight: 600 }}>{progressPct}%</span>
          </div>
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--amber)', borderRadius: '2px', transition: 'width .3s ease' }} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {QUESTIONS.map((q, i) => (
              <div key={q.id}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }}>
                  {i + 1}. {q.label}
                  {q.required && <span style={{ color: 'var(--amber)', marginLeft: '4px' }}>*</span>}
                  {!q.required && <span style={{ color: 'var(--light)', fontSize: '11px', fontWeight: 400, marginLeft: '6px' }}>optional</span>}
                </label>
                {q.type === 'textarea' ? (
                  <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
                    placeholder={q.placeholder}
                    value={answers[q.id] || ''}
                    onChange={e => set(q.id, e.target.value)}
                  />
                ) : q.type === 'select' ? (
                  <select
                    style={{ ...inputStyle, cursor: 'pointer' }}
                    value={answers[q.id] || ''}
                    onChange={e => set(q.id, e.target.value)}
                  >
                    <option value="">Select…</option>
                    {q.options?.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type="text"
                    style={inputStyle}
                    placeholder={q.placeholder}
                    value={answers[q.id] || ''}
                    onChange={e => set(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            {error && (
              <div style={{ background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: '7px', padding: '10px 14px', fontSize: '13px', color: 'var(--red)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'var(--amber)', color: 'var(--ink)', padding: '14px',
                borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none',
                cursor: 'pointer', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}
            >
              {loading ? (
                <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span> Generating your PRD…</>
              ) : '⚡ Generate PRD'}
            </button>

          </div>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
