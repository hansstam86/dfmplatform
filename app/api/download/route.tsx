import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from '@react-pdf/renderer'

const S = StyleSheet.create({
  page:        { padding: 40, fontSize: 9, fontFamily: 'Helvetica', color: '#0a0a0a', backgroundColor: '#ffffff' },
  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 2, borderBottomColor: '#e8a43b', paddingBottom: 10, marginBottom: 16 },
  brand:       { fontSize: 10, fontFamily: 'Helvetica-Bold', letterSpacing: 1 },
  metaRight:   { fontSize: 7, color: '#888', textAlign: 'right', lineHeight: 1.6 },
  docTitle:    { fontSize: 17, fontFamily: 'Helvetica-Bold', marginBottom: 3 },
  docSub:      { fontSize: 10, color: '#555', marginBottom: 20 },
  h2:          { fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.8, borderBottomWidth: 0.5, borderBottomColor: '#e0ddd8', paddingBottom: 4, marginTop: 18, marginBottom: 8 },
  h3:          { fontSize: 9, fontFamily: 'Helvetica-Bold', marginTop: 8, marginBottom: 4 },
  summaryText: { fontSize: 9, color: '#555', lineHeight: 1.7, marginBottom: 14 },
  statsRow:    { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:     { padding: 8, borderRadius: 4, minWidth: 60, alignItems: 'center' },
  statNum:     { fontSize: 16, fontFamily: 'Helvetica-Bold', lineHeight: 1 },
  statLabel:   { fontSize: 7, letterSpacing: 0.6, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold', marginTop: 2 },
  table:       { marginBottom: 16 },
  tableHead:   { flexDirection: 'row', backgroundColor: '#0a0a0a' },
  tableRow:    { flexDirection: 'row', borderBottomWidth: 0.3, borderBottomColor: '#e0ddd8' },
  tableRowAlt: { flexDirection: 'row', borderBottomWidth: 0.3, borderBottomColor: '#e0ddd8', backgroundColor: '#faf8f4' },
  tableRowRed: { flexDirection: 'row', borderBottomWidth: 0.3, borderBottomColor: '#f0b8b8', backgroundColor: '#fdf0f0' },
  tableRowOrg: { flexDirection: 'row', borderBottomWidth: 0.3, borderBottomColor: '#f0c898', backgroundColor: '#fdf4ed' },
  th:          { fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#ffffff', padding: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  td:          { fontSize: 8, padding: 5, color: '#0a0a0a', lineHeight: 1.4 },
  tdMid:       { fontSize: 8, padding: 5, color: '#555', lineHeight: 1.4 },
  tdMono:      { fontSize: 7, padding: 5, color: '#888', fontFamily: 'Courier' },
  tdCenter:    { fontSize: 8, padding: 5, textAlign: 'center', fontFamily: 'Helvetica-Bold' },
  badge:       { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 2 },
  badgeText:   { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.4, textTransform: 'uppercase' },
  twoCol:      { flexDirection: 'row', gap: 20, marginBottom: 12 },
  col:         { flex: 1 },
  listItem:    { flexDirection: 'row', marginBottom: 3 },
  bullet:      { width: 10, color: '#e8a43b', fontFamily: 'Helvetica-Bold' },
  listText:    { flex: 1, fontSize: 8.5, color: '#333', lineHeight: 1.5 },
  footer:      { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: '#e0ddd8', paddingTop: 8, marginTop: 30 },
  footerText:  { fontSize: 7, color: '#aaa' },
  phaseBox:    { backgroundColor: '#faf8f4', borderWidth: 0.5, borderColor: '#e0ddd8', borderRadius: 4, padding: 10, marginBottom: 12 },
  phaseName:   { fontSize: 11, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  phaseDur:    { fontSize: 8, color: '#888', marginBottom: 8 },
  totalBox:    { backgroundColor: '#fdf6e8', borderWidth: 0.5, borderColor: '#f0c878', borderRadius: 4, padding: 10, marginTop: 8 },
})

function rpnRow(cls: string) {
  if (cls === 'CRITICAL') return S.tableRowRed
  if (cls === 'HIGH') return S.tableRowOrg
  return S.tableRow
}
function badgeColors(cls: string): [string, string] {
  if (cls === 'CRITICAL') return ['#fdf0f0', '#b83232']
  if (cls === 'HIGH') return ['#fdf4ed', '#c45e1a']
  if (cls === 'MEDIUM') return ['#fdf6e8', '#a06c10']
  return ['#edf7f1', '#2d7a4f']
}
function statColors(t: string): [string, string] {
  if (t === 'critical') return ['#fdf0f0', '#b83232']
  if (t === 'high') return ['#fdf4ed', '#c45e1a']
  if (t === 'medium') return ['#fdf6e8', '#a06c10']
  return ['#edf7f1', '#2d7a4f']
}

function Li({ text }: { text: string }) {
  return (
    <View style={S.listItem}>
      <Text style={S.bullet}>—</Text>
      <Text style={S.listText}>{text}</Text>
    </View>
  )
}

function Header({ title, type, project, date }: any) {
  const labels: any = { fmea: 'FMEA Report', charter: 'Project Charter', timeline: 'Build Stage Timeline' }
  return (
    <>
      <View style={S.header}>
        <Text style={S.brand}>DFM · INSIGHTS</Text>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={S.metaRight}>{labels[type]} · dfminsights.com</Text>
          <Text style={S.metaRight}>{project.name} · {project.product_category}</Text>
          <Text style={S.metaRight}>{project.build_stage} · {date}</Text>
        </View>
      </View>
      <Text style={S.docTitle}>{title}</Text>
      <Text style={S.docSub}>{project.name} · {project.product_category} · {project.build_stage}</Text>
    </>
  )
}

function Footer() {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>Generated by DFM Insights · dfminsights.com</Text>
      <Text style={S.footerText}>CONFIDENTIAL · © 2026 DFM Insights / Hans Stam</Text>
    </View>
  )
}

function FMEADoc({ content, project, date }: any) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={S.page}>
        <Header title={content.title} type="fmea" project={project} date={date} />
        <View style={S.statsRow}>
          {[['critical', content.critical_count ?? 0, 'Critical'], ['high', content.high_count ?? 0, 'High'], ['medium', content.medium_count ?? 0, 'Medium'], ['low', content.low_count ?? 0, 'Low']].map(([t, v, l]) => {
            const [bg, fg] = statColors(t as string)
            return <View key={t as string} style={[S.statBox, { backgroundColor: bg }]}><Text style={[S.statNum, { color: fg }]}>{v}</Text><Text style={[S.statLabel, { color: fg }]}>{l}</Text></View>
          })}
        </View>
        <Text style={S.summaryText}>{content.summary}</Text>
        {(content.subsystems || []).map((sub: any) => (
          <View key={sub.name}>
            <Text style={S.h2}>{sub.name}</Text>
            <View style={S.table}>
              <View style={S.tableHead}>
                {[['ID',30],['Component',80],['Failure Mode',110],['Effect',100],['Cause',95],['S',18],['O',18],['D',18],['RPN',28],['Class',48],['Action',118]].map(([l,w]) => (
                  <Text key={l as string} style={[S.th, { width: w as number }]}>{l}</Text>
                ))}
              </View>
              {(sub.failure_modes || []).map((fm: any) => {
                const [bbg, bfg] = badgeColors(fm.classification)
                return (
                  <View key={fm.id} style={rpnRow(fm.classification)} wrap={false}>
                    <Text style={[S.tdMono, { width: 30 }]}>{fm.id}</Text>
                    <Text style={[S.td, { width: 80, fontFamily: 'Helvetica-Bold' }]}>{fm.component}</Text>
                    <Text style={[S.td, { width: 110 }]}>{fm.failure_mode}</Text>
                    <Text style={[S.tdMid, { width: 100 }]}>{fm.effect}</Text>
                    <Text style={[S.tdMid, { width: 95 }]}>{fm.cause}</Text>
                    <Text style={[S.tdCenter, { width: 18 }]}>{fm.severity}</Text>
                    <Text style={[S.tdCenter, { width: 18 }]}>{fm.occurrence}</Text>
                    <Text style={[S.tdCenter, { width: 18 }]}>{fm.detectability}</Text>
                    <Text style={[S.tdCenter, { width: 28, color: bfg }]}>{fm.rpn}</Text>
                    <View style={[S.td, { width: 48, alignItems: 'center', justifyContent: 'center' }]}>
                      <View style={[S.badge, { backgroundColor: bbg }]}><Text style={[S.badgeText, { color: bfg }]}>{fm.classification}</Text></View>
                    </View>
                    <Text style={[S.tdMid, { width: 118 }]}>{fm.recommended_action}</Text>
                  </View>
                )
              })}
            </View>
          </View>
        ))}
        <Footer />
      </Page>
    </Document>
  )
}

function CharterDoc({ content, project, date }: any) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Header title={content.title} type="charter" project={project} date={date} />
        <Text style={S.summaryText}>{content.objective}</Text>
        <View style={S.twoCol}>
          <View style={S.col}><Text style={S.h2}>In Scope</Text>{(content.scope_in || []).map((i: string, x: number) => <Li key={x} text={i} />)}</View>
          <View style={S.col}><Text style={S.h2}>Out of Scope</Text>{(content.scope_out || []).map((i: string, x: number) => <Li key={x} text={i} />)}</View>
        </View>
        <Text style={S.h2}>Success Criteria</Text>
        {(content.success_criteria || []).map((i: string, x: number) => <Li key={x} text={i} />)}
        <Text style={S.h2}>Risks</Text>
        <View style={S.table}>
          <View style={S.tableHead}>
            {[['Risk',190],['Probability',60],['Impact',55],['Mitigation',200]].map(([l,w]) => <Text key={l as string} style={[S.th, { width: w as number }]}>{l}</Text>)}
          </View>
          {(content.risks || []).map((r: any, i: number) => (
            <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt} wrap={false}>
              <Text style={[S.td, { width: 190 }]}>{r.risk}</Text>
              <Text style={[S.tdCenter, { width: 60 }]}>{r.probability}</Text>
              <Text style={[S.tdCenter, { width: 55 }]}>{r.impact}</Text>
              <Text style={[S.tdMid, { width: 200 }]}>{r.mitigation}</Text>
            </View>
          ))}
        </View>
        <Text style={S.h2}>RACI Matrix</Text>
        <View style={S.table}>
          <View style={S.tableHead}>
            {[['Activity',140],['Responsible',85],['Accountable',85],['Consulted',85],['Informed',85]].map(([l,w]) => <Text key={l as string} style={[S.th, { width: w as number }]}>{l}</Text>)}
          </View>
          {(content.raci || []).map((r: any, i: number) => (
            <View key={i} style={i % 2 === 0 ? S.tableRow : S.tableRowAlt} wrap={false}>
              <Text style={[S.td, { width: 140 }]}>{r.activity}</Text>
              <Text style={[S.tdMid, { width: 85 }]}>{r.responsible}</Text>
              <Text style={[S.tdMid, { width: 85 }]}>{r.accountable}</Text>
              <Text style={[S.tdMid, { width: 85 }]}>{r.consulted}</Text>
              <Text style={[S.tdMid, { width: 85 }]}>{r.informed}</Text>
            </View>
          ))}
        </View>
        <View style={S.twoCol}>
          <View style={S.col}><Text style={S.h2}>Constraints</Text>{(content.constraints || []).map((i: string, x: number) => <Li key={x} text={i} />)}</View>
          <View style={S.col}><Text style={S.h2}>Assumptions</Text>{(content.assumptions || []).map((i: string, x: number) => <Li key={x} text={i} />)}</View>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}

function TimelineDoc({ content, project, date }: any) {
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Header title={content.title} type="timeline" project={project} date={date} />
        <Text style={S.summaryText}>{content.summary}</Text>
        {(content.phases || []).map((phase: any) => (
          <View key={phase.name} style={S.phaseBox} wrap={false}>
            <Text style={S.phaseName}>{phase.name} — {phase.full_name}</Text>
            <Text style={S.phaseDur}>Week {phase.start_week}–{(phase.start_week || 1) + (phase.duration_weeks || 0) - 1} · {phase.duration_weeks} weeks</Text>
            <View style={S.twoCol}>
              <View style={S.col}>
                <Text style={S.h3}>Objectives</Text>
                {(phase.objectives || []).map((o: string, i: number) => <Li key={i} text={o} />)}
                <Text style={[S.h3, { marginTop: 6 }]}>Gate Criteria</Text>
                {(phase.gate_criteria || []).map((o: string, i: number) => <Li key={i} text={o} />)}
              </View>
              <View style={S.col}>
                <Text style={S.h3}>Key Milestones</Text>
                {(phase.key_milestones || []).map((m: any, i: number) => (
                  <View key={i} style={S.listItem}>
                    <Text style={[S.bullet, { fontFamily: 'Courier', fontSize: 7.5, width: 22, color: '#888' }]}>W{m.week}</Text>
                    <Text style={S.listText}>{m.milestone}</Text>
                  </View>
                ))}
                <Text style={[S.h3, { marginTop: 6 }]}>Risks</Text>
                {(phase.risks || []).map((r: string, i: number) => <Li key={i} text={r} />)}
              </View>
            </View>
          </View>
        ))}
        {(content.regulatory_milestones || []).length > 0 && (
          <><Text style={S.h2}>Regulatory Milestones</Text>{content.regulatory_milestones.map((m: string, i: number) => <Li key={i} text={m} />)}</>
        )}
        <View style={S.totalBox}>
          <Text style={{ fontSize: 10, color: '#333' }}>Total programme duration: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{content.total_weeks} weeks</Text></Text>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get('projectId')
    const type = searchParams.get('type')
    if (!projectId || !type) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })

    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: output } = await supabase
      .from('outputs')
      .select('*, projects!inner(user_id, name, product_category, build_stage)')
      .eq('project_id', projectId)
      .eq('type', type)
      .eq('projects.user_id', user.id)
      .single()

    if (!output) return NextResponse.json({ error: 'Output not found' }, { status: 404 })

    const content = output.content
    const project = (output as any).projects
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    const labels: any = { fmea: 'FMEA-Report', charter: 'Project-Charter', timeline: 'Build-Timeline' }

    let pdfDoc: any
    if (type === 'fmea') pdfDoc = React.createElement(FMEADoc, { content, project, date })
    else if (type === 'charter') pdfDoc = React.createElement(CharterDoc, { content, project, date })
    else pdfDoc = React.createElement(TimelineDoc, { content, project, date })

    const buffer = await renderToBuffer(pdfDoc)

    return new NextResponse(buffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${labels[type]}-${project.name.replace(/\s+/g, '-')}.pdf"`,
      }
    })
  } catch (err: any) {
    console.error('PDF error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
