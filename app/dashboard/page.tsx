import { redirect } from 'next/navigation'
import PurchaseButton from './PurchaseButton'
import SignOutButton from './SignOutButton'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('paid, package, paid_at')
    .eq('id', user.id)
    .single()

  const isPaid = profile?.paid ?? false
  const profileData = profile

  const projectCount = projects?.length ?? 0
  const maxProjects = 5

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)' }}>
      {/* Nav */}
      <nav style={{ background: 'rgba(255,255,255,.96)', borderBottom: '1px solid var(--border)', padding: '0 40px', display: 'flex', alignItems: 'center', height: '64px', gap: '16px' }}>
        <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: '20px' }}>
          DFM<span style={{ color: 'var(--amber)' }}>·</span>Platform
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'var(--mid)' }}>{user.email}</span>
          <SignOutButton />
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>
        {/* Upgrade banner for unpaid users */}
        {!isPaid && (
          <div style={{ marginBottom: '28px' }}>
            <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '10px', letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--light)', marginBottom: '14px' }}>
              Get started
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>

              {/* PRD Generator card */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--cream)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>📄</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>PRD Generator</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: 'var(--amber)', fontWeight: 600 }}>€9.90</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--mid)', lineHeight: 1.65, margin: 0 }}>
                  Answer 12 questions and AI generates your complete Product Requirements Document. Includes 2 revisions. 1 project.
                </p>
                <PurchaseButton pkg="prd" label="Get PRD Generator →" />
              </div>

              {/* AI Package card */}
              <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border, #f0c878)', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(232,164,59,.2)', border: '1px solid var(--amber-border, #f0c878)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>⚡</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--ink)' }}>AI Package</div>
                    <div style={{ fontFamily: '"DM Mono", monospace', fontSize: '11px', color: '#a06c10', fontWeight: 600 }}>€49</div>
                  </div>
                </div>
                <p style={{ fontSize: '13px', color: '#7a5c1a', lineHeight: 1.65, margin: 0 }}>
                  FMEA report, project charter, and EVT/DVT/PVT build timeline — generated from your PRD and BOM. Includes 5 revisions.
                </p>
                <PurchaseButton pkg="ai" label="Get AI Package →" />
              </div>

            </div>
          </div>
        )}

        {/* Paid — PRD package banner */}
        {isPaid && profileData?.package === 'prd' && (
          <div style={{ background: 'var(--amber-bg)', border: '1px solid var(--amber-border, #f0c878)', borderRadius: '10px', padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>📄</span>
              <span style={{ fontSize: '13px', color: 'var(--ink)' }}>
                <strong>PRD Generator active</strong> — Generate your PRD below. Upgrade to AI Package for FMEA, charter and timeline.
              </span>
            </div>
            <PurchaseButton pkg="ai" label="Upgrade to AI Package — €39.10 →" />
          </div>
        )}

        {/* Paid — AI package banner */}
        {isPaid && profileData?.package === 'ai' && (
          <div style={{ background: 'var(--green-bg)', border: '1px solid var(--green-border, #b8ddc8)', borderRadius: '10px', padding: '12px 18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '16px' }}>✅</span>
            <span style={{ fontSize: '13px', color: 'var(--green)' }}>
              <strong>AI Package active</strong> — Generate FMEA, charter and timeline on any project. 5 ECRs included.
            </span>
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '32px', marginBottom: '6px' }}>Your Projects</h1>
            <p style={{ fontSize: '14px', color: 'var(--mid)' }}>
              {projectCount} of {maxProjects} projects used
            </p>
          </div>
          {projectCount < maxProjects ? (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {(isPaid && (profileData?.package === 'prd' || profileData?.package === 'ai')) && (
                <a href="/projects/new-prd" style={{
                  background: 'var(--white)', color: 'var(--ink)', padding: '11px 22px',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  textDecoration: 'none'
                }}>
                  📄 Generate PRD
                </a>
              )}
              {isPaid && profileData?.package === 'ai' && (
                <a href="/projects/new" style={{
                  background: 'var(--amber)', color: 'var(--ink)', padding: '11px 22px',
                  borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none'
                }}>
                  ⚡ New Project
                </a>
              )}
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: 'var(--mid)', padding: '11px 16px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '8px' }}>
              5/5 projects used · <a href="mailto:hans.stam@gmail.com?subject=More projects" style={{ color: 'var(--amber)', fontWeight: 600 }}>Contact Hans for more</a>
            </div>
          )}
        </div>

        {/* Projects list */}
        {!projects || projects.length === 0 ? (
          <div style={{ background: 'var(--white)', border: '2px dashed var(--border)', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '22px', marginBottom: '8px' }}>No projects yet</h3>
            <p style={{ fontSize: '14px', color: 'var(--mid)', marginBottom: '24px', lineHeight: 1.7 }}>
              Create your first project by uploading your PRD and BOM.<br />
              We'll generate your FMEA, project charter, and build timeline.
            </p>
            <a href="/projects/new" style={{
              background: 'var(--amber)', color: 'var(--ink)', padding: '12px 24px',
              borderRadius: '8px', fontSize: '14px', fontWeight: 700, display: 'inline-block'
            }}>
              Create First Project →
            </a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {projects.map((p: any) => (
              <a key={p.id} href={`/projects/${p.id}`} style={{
                background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '12px',
                padding: '22px 24px', display: 'flex', alignItems: 'center', gap: '16px',
                transition: 'border-color .15s'
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '10px', background: 'var(--amber-bg)',
                  border: '1px solid var(--amber-border, #f0c878)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0
                }}>📋</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '3px', color: 'var(--ink)' }}>{p.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--mid)' }}>
                    {p.product_category} · {p.build_stage} · {new Date(p.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                  <span style={{
                    fontSize: '11px', fontFamily: '"DM Mono", monospace', letterSpacing: '.1em', textTransform: 'uppercase',
                    padding: '3px 10px', borderRadius: '20px',
                    background: p.status === 'complete' ? 'var(--green-bg)' : 'var(--amber-bg)',
                    color: p.status === 'complete' ? 'var(--green)' : '#a06c10',
                    border: `1px solid ${p.status === 'complete' ? '#b8ddc8' : 'var(--amber-border, #f0c878)'}`
                  }}>
                    {p.status === 'complete' ? 'Complete' : p.status === 'generating' ? 'Generating…' : 'Draft'}
                  </span>
                  <span style={{ fontSize: '13px', color: 'var(--light)' }}>{p.questions_used ?? 0}/10 questions</span>
                  <span style={{ color: 'var(--light)' }}>→</span>
                </div>
              </a>
            ))}
          </div>
        )}

        {/* Usage bar */}
        <div style={{ marginTop: '32px', padding: '20px 24px', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontFamily: '"DM Mono", monospace', letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--light)' }}>Project usage</span>
            <span style={{ fontSize: '12px', color: 'var(--mid)' }}>{projectCount} / {maxProjects}</span>
          </div>
          <div style={{ height: '6px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(projectCount / maxProjects) * 100}%`, background: 'var(--amber)', borderRadius: '3px', transition: 'width .6s ease' }} />
          </div>
        </div>
      </div>
    </div>
  )
}
