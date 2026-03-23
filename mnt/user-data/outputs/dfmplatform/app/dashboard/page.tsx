import { redirect } from 'next/navigation'
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
          <form action="/auth/signout" method="post">
            <button style={{ fontSize: '13px', color: 'var(--mid)', background: 'none', border: '1px solid var(--border)', padding: '6px 14px', borderRadius: '6px' }}>
              Sign out
            </button>
          </form>
        </div>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontFamily: '"Instrument Serif", serif', fontSize: '32px', marginBottom: '6px' }}>Your Projects</h1>
            <p style={{ fontSize: '14px', color: 'var(--mid)' }}>
              {projectCount} of {maxProjects} projects used
            </p>
          </div>
          {projectCount < maxProjects ? (
            <a href="/projects/new" style={{
              background: 'var(--amber)', color: 'var(--ink)', padding: '11px 22px',
              borderRadius: '8px', fontSize: '14px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              + New Project
            </a>
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
