import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type')

    if (!projectId || !type) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Get the output
    const { data: output } = await supabase
      .from('outputs')
      .select('*, projects!inner(user_id, name, product_category, build_stage)')
      .eq('project_id', projectId)
      .eq('type', type)
      .eq('projects.user_id', user.id)
      .single()

    if (!output) return NextResponse.json({ error: 'Output not found' }, { status: 404 })

    const content = output.content
    const project = output.projects
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

    // Generate HTML document for the output
    let bodyHTML = ''

    if (type === 'fmea') {
      const subsystems = content.subsystems || []
      bodyHTML = `
        <div class="summary-stats">
          <div class="stat critical"><div class="stat-num">${content.critical_count ?? 0}</div><div class="stat-label">Critical</div></div>
          <div class="stat high"><div class="stat-num">${content.high_count ?? 0}</div><div class="stat-label">High</div></div>
          <div class="stat medium"><div class="stat-num">${content.medium_count ?? 0}</div><div class="stat-label">Medium</div></div>
          <div class="stat low"><div class="stat-num">${content.low_count ?? 0}</div><div class="stat-label">Low</div></div>
        </div>
        <p class="summary-text">${content.summary || ''}</p>
        ${subsystems.map((sub: any) => `
          <h2>${sub.name}</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th><th>Component</th><th>Failure Mode</th><th>Effect</th><th>S</th><th>O</th><th>D</th><th>RPN</th><th>Class</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${(sub.failure_modes || []).map((fm: any) => `
                <tr class="rpn-${(fm.classification || '').toLowerCase()}">
                  <td class="mono">${fm.id}</td>
                  <td><strong>${fm.component}</strong></td>
                  <td>${fm.failure_mode}</td>
                  <td>${fm.effect}</td>
                  <td class="center"><strong>${fm.severity}</strong></td>
                  <td class="center"><strong>${fm.occurrence}</strong></td>
                  <td class="center"><strong>${fm.detectability}</strong></td>
                  <td class="center rpn-num"><strong>${fm.rpn}</strong></td>
                  <td class="center"><span class="badge badge-${(fm.classification || '').toLowerCase()}">${fm.classification}</span></td>
                  <td class="small">${fm.recommended_action}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}`

    } else if (type === 'charter') {
      bodyHTML = `
        <p class="summary-text">${content.objective || ''}</p>
        <div class="two-col">
          <div>
            <h2>In Scope</h2>
            <ul>${(content.scope_in || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
          </div>
          <div>
            <h2>Out of Scope</h2>
            <ul>${(content.scope_out || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>
        <h2>Success Criteria</h2>
        <ul>${(content.success_criteria || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
        <h2>Risks</h2>
        <table>
          <thead><tr><th>Risk</th><th>Probability</th><th>Impact</th><th>Mitigation</th></tr></thead>
          <tbody>
            ${(content.risks || []).map((r: any) => `
              <tr><td>${r.risk}</td><td>${r.probability}</td><td>${r.impact}</td><td>${r.mitigation}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <h2>RACI Matrix</h2>
        <table>
          <thead><tr><th>Activity</th><th>Responsible</th><th>Accountable</th><th>Consulted</th><th>Informed</th></tr></thead>
          <tbody>
            ${(content.raci || []).map((r: any) => `
              <tr><td>${r.activity}</td><td>${r.responsible}</td><td>${r.accountable}</td><td>${r.consulted}</td><td>${r.informed}</td></tr>
            `).join('')}
          </tbody>
        </table>
        <div class="two-col">
          <div>
            <h2>Constraints</h2>
            <ul>${(content.constraints || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
          </div>
          <div>
            <h2>Assumptions</h2>
            <ul>${(content.assumptions || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
          </div>
        </div>`

    } else if (type === 'timeline') {
      bodyHTML = `
        <p class="summary-text">${content.summary || ''}</p>
        ${(content.phases || []).map((phase: any) => `
          <h2>${phase.name} — ${phase.full_name} <span class="phase-duration">(${phase.duration_weeks} weeks · Week ${phase.start_week}–${phase.start_week + phase.duration_weeks - 1})</span></h2>
          <div class="two-col">
            <div>
              <h3>Objectives</h3>
              <ul>${(phase.objectives || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
              <h3>Gate Criteria</h3>
              <ul>${(phase.gate_criteria || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
            </div>
            <div>
              <h3>Key Milestones</h3>
              <table>
                <thead><tr><th>Week</th><th>Milestone</th></tr></thead>
                <tbody>
                  ${(phase.key_milestones || []).map((m: any) => `<tr><td class="mono">W${m.week}</td><td>${m.milestone}</td></tr>`).join('')}
                </tbody>
              </table>
              <h3>Risks</h3>
              <ul>${(phase.risks || []).map((i: string) => `<li>${i}</li>`).join('')}</ul>
            </div>
          </div>
        `).join('')}
        ${content.regulatory_milestones?.length ? `
          <h2>Regulatory Milestones</h2>
          <ul>${content.regulatory_milestones.map((i: string) => `<li>${i}</li>`).join('')}</ul>
        ` : ''}
        <div class="total-timeline">Total programme duration: <strong>${content.total_weeks} weeks</strong></div>`
    }

    const typeLabels: Record<string, string> = {
      fmea: 'FMEA Report',
      charter: 'Project Charter',
      timeline: 'Build Stage Timeline'
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${content.title}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #0a0a0a; line-height: 1.5; background: #fff; }
  .page { max-width: 1000px; margin: 0 auto; padding: 40px; }

  /* Header */
  .doc-header { border-bottom: 3px solid #e8a43b; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
  .doc-brand { font-size: 13px; font-weight: 700; color: #0a0a0a; letter-spacing: .1em; text-transform: uppercase; }
  .doc-brand span { color: #e8a43b; }
  .doc-meta { text-align: right; font-size: 10px; color: #888; line-height: 1.6; }
  .doc-title { font-size: 20px; font-weight: 700; color: #0a0a0a; margin-bottom: 4px; margin-top: 16px; }
  .doc-subtitle { font-size: 12px; color: #555; margin-bottom: 24px; }

  /* Stats */
  .summary-stats { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
  .stat { padding: 12px 20px; border-radius: 6px; text-align: center; min-width: 80px; }
  .stat-num { font-size: 22px; font-weight: 700; line-height: 1; margin-bottom: 2px; }
  .stat-label { font-size: 9px; letter-spacing: .12em; text-transform: uppercase; font-weight: 600; }
  .stat.critical { background: #fdf0f0; color: #b83232; border: 1px solid #f0b8b8; }
  .stat.high { background: #fdf4ed; color: #c45e1a; border: 1px solid #f0c898; }
  .stat.medium { background: #fdf6e8; color: #a06c10; border: 1px solid #f0c878; }
  .stat.low { background: #edf7f1; color: #2d7a4f; border: 1px solid #b8ddc8; }

  .summary-text { font-size: 12px; color: #555; line-height: 1.7; margin-bottom: 24px; max-width: 700px; }

  /* Sections */
  h2 { font-size: 13px; font-weight: 700; color: #0a0a0a; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e0ddd8; text-transform: uppercase; letter-spacing: .08em; }
  h3 { font-size: 11px; font-weight: 700; color: #333; margin: 12px 0 6px; }
  ul { padding-left: 16px; margin-bottom: 12px; }
  ul li { margin-bottom: 4px; color: #333; }

  /* Table */
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 10.5px; }
  th { background: #0a0a0a; color: #fff; padding: 7px 8px; text-align: left; font-size: 9px; letter-spacing: .08em; text-transform: uppercase; font-weight: 600; }
  td { padding: 6px 8px; border-bottom: 1px solid #f0ede8; vertical-align: top; }
  tr:nth-child(even) td { background: #faf8f4; }
  .center { text-align: center; }
  .mono { font-family: monospace; font-size: 10px; color: #888; }
  .small { font-size: 10px; color: #555; }

  /* RPN row colours */
  tr.rpn-critical td { background: #fdf0f0 !important; }
  tr.rpn-high td { background: #fdf4ed !important; }
  .rpn-num { font-size: 12px; }

  /* Badges */
  .badge { display: inline-block; padding: 2px 7px; border-radius: 10px; font-size: 9px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
  .badge-critical { background: #fdf0f0; color: #b83232; border: 1px solid #f0b8b8; }
  .badge-high { background: #fdf4ed; color: #c45e1a; border: 1px solid #f0c898; }
  .badge-medium { background: #fdf6e8; color: #a06c10; border: 1px solid #f0c878; }
  .badge-low { background: #edf7f1; color: #2d7a4f; border: 1px solid #b8ddc8; }

  /* Two col */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }

  /* Timeline */
  .phase-duration { font-size: 11px; color: #888; font-weight: 400; text-transform: none; letter-spacing: 0; }
  .total-timeline { margin-top: 20px; padding: 14px 18px; background: #fdf6e8; border: 1px solid #f0c878; border-radius: 6px; font-size: 12px; color: #333; }

  /* Footer */
  .doc-footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #e0ddd8; display: flex; justify-content: space-between; font-size: 9px; color: #aaa; }

  @media print {
    .page { padding: 20px; }
    h2 { page-break-after: avoid; }
    table { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="page">
  <div class="doc-header">
    <div class="doc-brand">DFM<span>·</span>Insights</div>
    <div class="doc-meta">
      <div>${typeLabels[type]} · Sample Output</div>
      <div>${project.name} · ${project.product_category}</div>
      <div>${project.build_stage} · ${date}</div>
    </div>
  </div>

  <div class="doc-title">${content.title}</div>
  <div class="doc-subtitle">${project.name} · ${project.product_category} · ${project.build_stage}</div>

  ${bodyHTML}

  <div class="doc-footer">
    <span>Generated by DFM Insights · dfminsights.com</span>
    <span>CONFIDENTIAL · For authorised use only</span>
    <span>© 2026 DFM Insights / Hans Stam</span>
  </div>
</div>
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${type}-${projectId}.html"`,
      }
    })

  } catch (err: any) {
    console.error('Download error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
