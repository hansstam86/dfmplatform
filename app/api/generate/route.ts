import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json()
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Check payment
    const { data: profile } = await supabase
      .from('profiles')
      .select('paid')
      .eq('id', user.id)
      .single()

    if (!profile?.paid) {
      return NextResponse.json({ error: 'PAYMENT_REQUIRED', message: 'Please purchase the AI Package to generate documents.' }, { status: 402 })
    }

    // Get project and documents
    const { data: project } = await supabase
      .from('projects')
      .select('*, documents(*)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Mark as generating
    await supabase.from('projects').update({ status: 'generating' }).eq('id', projectId)

    // Read document content
    let prdContent = ''
    let bomContent = ''

    for (const doc of project.documents || []) {
      const { data } = await supabase.storage.from('documents').download(doc.storage_path)
      if (data) {
        const text = await data.text()
        if (doc.type === 'prd') prdContent = text.slice(0, 8000)
        if (doc.type === 'bom') bomContent = text.slice(0, 4000)
      }
    }

    const systemPrompt = `You are an expert hardware product development consultant with 18+ years of experience in DFM, supply chain, and manufacturing. You help hardware founders generate professional FMEA reports, project charters, and build timelines.

Your outputs are used by real hardware companies. Be specific, technical, and practical. Use real engineering terminology. Reference the specific product details from the PRD and BOM provided.

Always respond with valid JSON only, no markdown, no preamble.`

    const userPrompt = `Generate three documents for this hardware product.

PRODUCT: ${project.name}
CATEGORY: ${project.product_category}
BUILD STAGE: ${project.build_stage}
REGULATORY: ${(project.regulatory_requirements || []).join(', ') || 'None specified'}
DESCRIPTION: ${project.description || 'Not provided'}

PRD CONTENT:
${prdContent || 'Not provided — generate based on product name and category'}

BOM CONTENT:
${bomContent || 'Not provided — generate based on product category and description'}

Generate a JSON response with exactly this structure:
{
  "fmea": {
    "title": "FMEA Report — [Product Name]",
    "summary": "2-3 sentence executive summary",
    "subsystems": [
      {
        "name": "subsystem name",
        "failure_modes": [
          {
            "id": "ME-001",
            "component": "component name",
            "failure_mode": "specific failure mode description",
            "effect": "effect on product/user",
            "cause": "root cause",
            "severity": 8,
            "occurrence": 5,
            "detectability": 4,
            "rpn": 160,
            "classification": "HIGH",
            "current_control": "what exists now",
            "recommended_action": "specific action to take",
            "owner": "engineering role",
            "target": "build stage or deadline"
          }
        ]
      }
    ],
    "critical_count": 0,
    "high_count": 5,
    "medium_count": 3,
    "low_count": 2
  },
  "charter": {
    "title": "Project Charter — [Product Name]",
    "objective": "clear project objective statement",
    "scope_in": ["item 1", "item 2", "item 3"],
    "scope_out": ["item 1", "item 2"],
    "success_criteria": ["criterion 1", "criterion 2", "criterion 3"],
    "risks": [
      {"risk": "risk description", "probability": "Medium", "impact": "High", "mitigation": "mitigation strategy"}
    ],
    "raci": [
      {"activity": "FMEA completion", "responsible": "ME Lead", "accountable": "Program Manager", "consulted": "CM", "informed": "CEO"}
    ],
    "constraints": ["constraint 1", "constraint 2"],
    "assumptions": ["assumption 1", "assumption 2"]
  },
  "timeline": {
    "title": "Build Stage Timeline — [Product Name]",
    "summary": "overview of the programme timeline",
    "phases": [
      {
        "name": "EVT",
        "full_name": "Engineering Validation Test",
        "duration_weeks": 8,
        "start_week": 1,
        "objectives": ["objective 1", "objective 2"],
        "gate_criteria": ["criterion 1", "criterion 2"],
        "key_milestones": [
          {"week": 2, "milestone": "milestone description"},
          {"week": 6, "milestone": "milestone description"}
        ],
        "risks": ["risk 1", "risk 2"]
      }
    ],
    "regulatory_milestones": ["milestone 1", "milestone 2"],
    "total_weeks": 32
  }
}

Generate at least 3 subsystems for the FMEA with 2-4 failure modes each. Include EVT, DVT, and PVT phases in the timeline. Be specific to the actual product described.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    // Clean and parse JSON
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const generated = JSON.parse(clean)

    // Delete existing outputs
    await supabase.from('outputs').delete().eq('project_id', projectId)

    // Save outputs
    const outputsToInsert = [
      { project_id: projectId, type: 'fmea', content: generated.fmea, title: generated.fmea.title },
      { project_id: projectId, type: 'charter', content: generated.charter, title: generated.charter.title },
      { project_id: projectId, type: 'timeline', content: generated.timeline, title: generated.timeline.title },
    ]

    const { data: savedOutputs } = await supabase
      .from('outputs')
      .insert(outputsToInsert)
      .select()

    // Mark project complete
    await supabase.from('projects').update({ status: 'complete' }).eq('id', projectId)

    return NextResponse.json({ outputs: savedOutputs })

  } catch (err: any) {
    console.error('Generation error:', err)
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 })
  }
}
