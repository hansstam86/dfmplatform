'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const STAGES = ['Pre-EVT — design phase', 'EVT — Engineering Validation', 'DVT — Design Validation', 'PVT — Production Validation', 'Mass Production']
const CATEGORIES = ['Consumer Electronics', 'Medical Device', 'Industrial IoT', 'EV / Charging', 'Smart Home', 'Wearable', 'Robotics', 'Other']

export default function NewProjectPage() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [stage, setStage] = useState('')
  const [regulatory, setRegulatory] = useState<string[]>([])
  const [prdFile, setPrdFile] = useState<File | null>(null)
  const [bomFile, setBomFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toggleReg(val: string) {
    setRegulatory(prev => prev.includes(val) ? prev.filter(r => r !== val) : [...prev, val])
  }

  async function handleSubmit() {
    if (!prdFile) { setError('Please upload your PRD document.'); return }
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      // Create project record
      const { data: project, error: projErr } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name,
          description,
          product_category: category,
          build_stage: stage,
          regulatory_requirements: regulatory,
          status: 'draft',
          questions_used: 0
        })
        .select()
        .single()

      if (projErr) throw projErr

      // Upload PRD
      if (prdFile) {
        const prdPath = `${user.id}/${project.id}/prd-${prdFile.name}`
        await supabase.storage.from('documents').upload(prdPath, prdFile)
        await supabase.from('documents').insert({ project_id: project.id, type: 'prd', filename: prdFile.name, storage_path: prdPath })
      }

      // Upload BOM if provided
      if (bomFile) {
        const bomPath = `${user.id}/${project.id}/bom-${bomFile.name}`
        await supabase.storage.from('documents').upload(bomPath, bomFile)
        await supabase.from('documents').insert({ project_id: project.id, type: 'bom', filename: bomFile.name, storage_path: bomPath })
      }

      router.push(`/projects/${project.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputStyle = { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: '7px', background: 'var(--cream)', outline: 'none', fontSize: '14px' }
  const labelStyle = { display: 'block' as const, fontSize: '12px', fontWeight: 600, marginBottom: '6px', color: 'var(--ink)' }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      <nav style={{ background: 'rgba(255,255,255,.96)', borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', alignItems: 'center', height: '64px', gap: '16px' }}>
        <a href="/dashboard" style={{ fontFamily: '"Instrument Serif", serif', fontSize: '20px', color: 'var(--ink)' }}>
          DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
        </a>
        <span style={{ color: 'var(--light)', fontSize: '14px' }}>/ New Project</span>
      </nav>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '48px 24px' }}>
        <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '30px', marginBottom: '8px' }}>New Project</h1>
        <p style={{ fontSize: '14px', color: 'var(--mid)', marginBottom: '32px' }}>Tell us about your product. We'll generate your FMEA, project charter, and build timeline.</p>

        {/* Step indicators */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ flex: 1, height: '4px', borderRadius: '2px', background: s <= step ? 'var(--amber)' : 'var(--border)', transition: 'background .3s' }} />
          ))}
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '32px' }}>
          {error && (
            <div style={{ background: 'var(--red-bg)', border: '1px solid #f0b8b8', borderRadius: '7px', padding: '10px 14px', marginBottom: '20px', fontSize: '13px', color: 'var(--red)' }}>
              {error}
            </div>
          )}

          {/* Step 1: Product info */}
          {step === 1 && (
            <div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '20px' }}>Step 1 of 3 · Product Details</div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>Project name <span style={{ color: 'var(--amber)' }}>*</span></label>
                <input style={inputStyle} type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Aurora TWS Earbuds v2" />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={labelStyle}>What are you building?</label>
                <textarea style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description of your product, its key features and target market..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <label style={labelStyle}>Product category <span style={{ color: 'var(--amber)' }}>*</span></label>
                  <select style={inputStyle} required value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Build stage <span style={{ color: 'var(--amber)' }}>*</span></label>
                  <select style={inputStyle} required value={stage} onChange={e => setStage(e.target.value)}>
                    <option value="">Select…</option>
                    {STAGES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <button
                onClick={() => { if (!name || !category || !stage) { setError('Please fill in all required fields.'); return } setError(''); setStep(2) }}
                style={{ width: '100%', padding: '12px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Regulatory */}
          {step === 2 && (
            <div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '20px' }}>Step 2 of 3 · Regulatory Requirements</div>
              <p style={{ fontSize: '14px', color: 'var(--mid)', marginBottom: '20px', lineHeight: 1.65 }}>Select all regulatory standards that apply to your product. This shapes the FMEA risk categories and build timeline milestones.</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '24px' }}>
                {['CE marking (EU)', 'FCC / IC (US/Canada)', 'FDA 510(k)', 'ISO 13485', 'UL listing', 'IATF 16949', 'IEC 62368-1', 'None yet'].map(r => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px',
                    border: `1px solid ${regulatory.includes(r) ? 'var(--amber)' : 'var(--border)'}`,
                    borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                    background: regulatory.includes(r) ? 'var(--amber-bg)' : 'var(--cream)',
                    transition: 'all .15s'
                  }}>
                    <input type="checkbox" checked={regulatory.includes(r)} onChange={() => toggleReg(r)} style={{ accentColor: 'var(--amber)', width: '15px', height: '15px' }} />
                    {r}
                  </label>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>← Back</button>
                <button onClick={() => { setError(''); setStep(3) }} style={{ flex: 2, padding: '12px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700 }}>Continue →</button>
              </div>
            </div>
          )}

          {/* Step 3: Documents */}
          {step === 3 && (
            <div>
              <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '20px' }}>Step 3 of 3 · Upload Documents</div>

              {/* PRD upload */}
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>Product Requirements Document (PRD) <span style={{ color: 'var(--amber)' }}>*</span></label>
                <div style={{
                  border: `2px dashed ${prdFile ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '24px', textAlign: 'center',
                  background: prdFile ? 'var(--amber-bg)' : 'var(--cream)', transition: 'all .2s'
                }}>
                  {prdFile ? (
                    <div>
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>📄</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>{prdFile.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mid)', marginBottom: '10px' }}>{(prdFile.size / 1024).toFixed(0)} KB</div>
                      <button onClick={() => setPrdFile(null)} style={{ fontSize: '12px', color: 'var(--mid)', background: 'none', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '4px' }}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📄</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Drop your PRD here</div>
                      <div style={{ fontSize: '12px', color: 'var(--mid)', marginBottom: '12px' }}>PDF, Word, or text file</div>
                      <label style={{ display: 'inline-block', background: 'var(--ink)', color: 'var(--white)', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Browse file
                        <input type="file" accept=".pdf,.doc,.docx,.txt" style={{ display: 'none' }} onChange={e => setPrdFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* BOM upload */}
              <div style={{ marginBottom: '24px' }}>
                <label style={labelStyle}>Bill of Materials (BOM) <span style={{ fontSize: '11px', color: 'var(--mid)', fontWeight: 400 }}>optional but recommended</span></label>
                <div style={{
                  border: `2px dashed ${bomFile ? 'var(--amber)' : 'var(--border)'}`,
                  borderRadius: '10px', padding: '24px', textAlign: 'center',
                  background: bomFile ? 'var(--amber-bg)' : 'var(--cream)', transition: 'all .2s'
                }}>
                  {bomFile ? (
                    <div>
                      <div style={{ fontSize: '20px', marginBottom: '6px' }}>📊</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>{bomFile.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--mid)', marginBottom: '10px' }}>{(bomFile.size / 1024).toFixed(0)} KB</div>
                      <button onClick={() => setBomFile(null)} style={{ fontSize: '12px', color: 'var(--mid)', background: 'none', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: '4px' }}>Remove</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>Drop your BOM here</div>
                      <div style={{ fontSize: '12px', color: 'var(--mid)', marginBottom: '12px' }}>Excel, CSV, or PDF</div>
                      <label style={{ display: 'inline-block', background: 'var(--ink)', color: 'var(--white)', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Browse file
                        <input type="file" accept=".xlsx,.xls,.csv,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => setBomFile(e.target.files?.[0] || null)} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '14px', fontWeight: 500 }}>← Back</button>
                <button onClick={handleSubmit} disabled={loading || !prdFile} style={{
                  flex: 2, padding: '12px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                  opacity: loading || !prdFile ? 0.6 : 1
                }}>
                  {loading ? 'Creating project…' : 'Create Project →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
