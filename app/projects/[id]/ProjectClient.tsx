function PurchaseButton() {
  const [loading, setLoading] = useState(false)
  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (err) {
      setLoading(false)
    }
  }
  return (
    <button onClick={handlePurchase} disabled={loading} style={{
      background: 'var(--ink)', color: 'var(--white)', padding: '14px 32px',
      borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer',
      opacity: loading ? 0.7 : 1
    }}>
      {loading ? 'Redirecting to payment…' : '⚡ Purchase AI Package — €499'}
    </button>
  )
}

'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function ProjectClient({ project, outputs, questions, paid }: {
  project: any, outputs: any[], questions: any[], paid: boolean
}) {
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [question, setQuestion] = useState('')
  const [asking, setAsking] = useState(false)
  const [localOutputs, setLocalOutputs] = useState(outputs)
  const [localQuestions, setLocalQuestions] = useState(questions)
  const [questionsUsed, setQuestionsUsed] = useState(project.questions_used ?? 0)
  const supabase = createClient()

  const MAX_QUESTIONS = 10
  const questionsLeft = MAX_QUESTIONS - questionsUsed

  async function handleGenerate() {
    setGenerating(true)
    setGenError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id })
      })
      const data = await res.json()
      if (res.status === 402) {
        window.location.href = '/dashboard?upgrade=true'
        return
      }
      if (!res.ok) throw new Error(data.error || 'Generation failed')
      setLocalOutputs(data.outputs)
      window.location.reload()
    } catch (err: any) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  async function handleQuestion(e: React.FormEvent) {
    e.preventDefault()
    if (!question.trim() || questionsLeft <= 0) return
    setAsking(true)
    try {
      const res = await fetch('/api/question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id, question: question.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setLocalQuestions(prev => [...prev, data.question])
      setQuestionsUsed((prev: number) => prev + 1)
      setQuestion('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setAsking(false)
    }
  }

  const hasOutputs = localOutputs.length > 0
  const fmea = localOutputs.find((o: any) => o.type === 'fmea')
  const charter = localOutputs.find((o: any) => o.type === 'charter')
  const timeline = localOutputs.find((o: any) => o.type === 'timeline')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,.96)', borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', alignItems: 'center', height: '64px', gap: '12px' }}>
        <a href="/dashboard" style={{ fontFamily: '"Instrument Serif", serif', fontSize: '20px', color: 'var(--ink)' }}>
          DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
        </a>
        <span style={{ color: 'var(--light)' }}>/ <a href="/dashboard" style={{ color: 'var(--mid)' }}>Projects</a></span>
        <span style={{ color: 'var(--light)' }}>/ {project.name}</span>
        <div style={{ marginLeft: 'auto' }}>
          <span style={{
            fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '.1em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '20px',
            background: project.status === 'complete' ? 'var(--green-bg)' : 'var(--amber-bg)',
            color: project.status === 'complete' ? 'var(--green)' : '#a06c10',
            border: `1px solid ${project.status === 'complete' ? '#b8ddc8' : '#f0c878'}`
          }}>
            {project.status === 'complete' ? 'Complete' : project.status === 'generating' ? 'Generating…' : 'Draft'}
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>

        {/* Project header */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '32px', marginBottom: '6px' }}>{project.name}</h1>
          <div style={{ fontSize: '13px', color: 'var(--mid)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <span>{project.product_category}</span>
            <span>·</span>
            <span>{project.build_stage}</span>
            {project.regulatory_requirements?.length > 0 && <>
              <span>·</span>
              <span>{project.regulatory_requirements.join(', ')}</span>
            </>}
          </div>
          {project.description && (
            <p style={{ marginTop: '10px', fontSize: '14px', color: 'var(--mid)', lineHeight: 1.7, maxWidth: '620px' }}>{project.description}</p>
          )}
        </div>

        {/* Documents uploaded */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', padding: '20px 24px', marginBottom: '24px' }}>
          <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '12px' }}>Uploaded Documents</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {project.documents?.map((doc: any) => (
              <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 14px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: '7px' }}>
                <span>{doc.type === 'prd' ? '📄' : '📊'}</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>{doc.type.toUpperCase()}</span>
                <span style={{ fontSize: '12px', color: 'var(--mid)' }}>{doc.filename}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Generate button / payment gate */}
        {!hasOutputs && (
          paid ? (
            <div style={{ background: 'var(--ink)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: '22px', color: 'var(--white)', marginBottom: '8px' }}>
                Ready to generate your documents
              </div>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,.5)', marginBottom: '24px', lineHeight: 1.7 }}>
                We'll generate your FMEA report, project charter, and EVT/DVT/PVT build timeline<br />from your uploaded documents. This takes 1–2 minutes.
              </p>
              {genError && (
                <div style={{ background: 'rgba(184,50,50,.15)', border: '1px solid rgba(184,50,50,.3)', borderRadius: '7px', padding: '10px 14px', marginBottom: '16px', fontSize: '13px', color: '#ef9a9a' }}>
                  {genError}
                </div>
              )}
              <button onClick={handleGenerate} disabled={generating} style={{
                background: 'var(--amber)', color: 'var(--ink)', padding: '14px 32px',
                borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none',
                opacity: generating ? 0.7 : 1, display: 'inline-flex', alignItems: 'center', gap: '10px'
              }}>
                {generating ? (
                  <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', fontSize: '16px' }}>⏳</span> Generating… this takes 1–2 minutes</>
                ) : '⚡ Generate FMEA, Charter & Timeline'}
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border, #f0c878)', borderRadius: '12px', padding: '32px', textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '36px', marginBottom: '16px' }}>🔒</div>
              <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: '22px', color: 'var(--ink)', marginBottom: '8px' }}>
                Purchase the AI Package to generate
              </div>
              <p style={{ fontSize: '14px', color: 'var(--mid)', marginBottom: '24px', lineHeight: 1.7, maxWidth: '420px', margin: '0 auto 24px' }}>
                Your project is set up and ready. Purchase the AI Package to generate your FMEA report, project charter, and build timeline.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
                <PurchaseButton />
              </div>
              <div style={{ fontSize: '12px', color: 'var(--mid)' }}>
                €499 · One-time payment · 48h delivery · 10 refinement questions included
              </div>
            </div>
          )
        )}

        {/* Outputs */}
        {hasOutputs && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '14px' }}>Generated Documents</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { output: fmea, label: 'FMEA Report', icon: '⚠️', type: 'fmea' },
                { output: charter, label: 'Project Charter', icon: '📋', type: 'charter' },
                { output: timeline, label: 'Build Timeline', icon: '📅', type: 'timeline' },
              ].map(({ output, label, icon }) => (
                <div key={label} style={{
                  background: 'var(--white)', border: `1px solid ${output ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '20px', textAlign: 'center'
                }}>
                  <div style={{ fontSize: '28px', marginBottom: '8px' }}>{icon}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>{label}</div>
                  {output ? (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <a href={`/api/download?projectId=${project.id}&type=${output.type}`}
                        style={{ fontSize: '11px', background: 'var(--amber)', color: 'var(--ink)', padding: '4px 12px', borderRadius: '5px', fontWeight: 700 }}>
                        ↓ Download PDF
                      </a>
                    </div>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--light)' }}>Not generated</span>
                  )}
                </div>
              ))}
            </div>

            {/* Regenerate option */}
            <div style={{ marginTop: '12px', textAlign: 'right' }}>
              <button onClick={handleGenerate} disabled={generating} style={{
                fontSize: '12px', color: 'var(--mid)', background: 'none', border: '1px solid var(--border)',
                padding: '6px 14px', borderRadius: '6px', opacity: generating ? 0.6 : 1
              }}>
                {generating ? 'Regenerating…' : '↻ Regenerate'}
              </button>
            </div>
          </div>
        )}

        {/* Q&A Section */}
        {hasOutputs && (
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '4px' }}>Refinement Questions</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)' }}>Ask Hans anything about your documents</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '.1em',
                  padding: '4px 12px', borderRadius: '20px',
                  background: questionsLeft > 3 ? 'var(--green-bg)' : questionsLeft > 0 ? 'var(--amber-bg)' : 'var(--red-bg)',
                  color: questionsLeft > 3 ? 'var(--green)' : questionsLeft > 0 ? '#a06c10' : 'var(--red)',
                  border: `1px solid ${questionsLeft > 3 ? '#b8ddc8' : questionsLeft > 0 ? '#f0c878' : '#f0b8b8'}`
                }}>
                  {questionsLeft} question{questionsLeft !== 1 ? 's' : ''} remaining
                </div>
              </div>
            </div>

            {/* Previous Q&A */}
            {localQuestions.length > 0 && (
              <div style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {localQuestions.map((q: any) => (
                  <div key={q.id}>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--amber-bg)', border: '1px solid #f0c878', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', flexShrink: 0 }}>You</div>
                      <div style={{ background: 'var(--cream)', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', flex: 1 }}>{q.question}</div>
                    </div>
                    {q.answer && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--amber)', flexShrink: 0, fontWeight: 700 }}>H</div>
                        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', padding: '12px 16px', borderRadius: '8px', fontSize: '14px', flex: 1, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{q.answer}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ask question form */}
            {questionsLeft > 0 ? (
              <form onSubmit={handleQuestion} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text" value={question} onChange={e => setQuestion(e.target.value)}
                  placeholder="Ask about your FMEA, charter, or timeline…"
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none', fontSize: '14px' }}
                />
                <button type="submit" disabled={asking || !question.trim()} style={{
                  background: 'var(--amber)', color: 'var(--ink)', padding: '10px 20px', border: 'none',
                  borderRadius: '7px', fontSize: '14px', fontWeight: 700, opacity: asking || !question.trim() ? 0.6 : 1, whiteSpace: 'nowrap'
                }}>
                  {asking ? 'Asking…' : 'Ask →'}
                </button>
              </form>
            ) : (
              <div style={{ padding: '16px', background: 'var(--cream)', borderRadius: '8px', fontSize: '13px', color: 'var(--mid)', textAlign: 'center' }}>
                You've used all 10 refinement questions for this project.{' '}
                <a href="mailto:hans.stam@gmail.com?subject=More questions for my DFM project" style={{ color: 'var(--amber)', fontWeight: 600 }}>
                  Contact Hans for further review →
                </a>
              </div>
            )}
          </div>
        )}

      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
