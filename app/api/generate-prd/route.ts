import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { projectId, answers } = await req.json()
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Check payment
    const { data: profile } = await supabase
      .from('profiles')
      .select('paid, package')
      .eq('id', user.id)
      .single()

    if (!profile?.paid) {
      return NextResponse.json({ error: 'PAYMENT_REQUIRED' }, { status: 402 })
    }

    const prompt = `You are an expert hardware product development consultant. Generate a comprehensive, professional Product Requirements Document (PRD) for the following product.

Product answers from the founder:
- Product name: ${answers.product_name}
- Problem being solved: ${answers.problem}
- Target user: ${answers.target_user}
- Core features: ${answers.core_features}
- Product category: ${answers.category}
- Connectivity: ${answers.connectivity || 'Not specified'}
- Battery/power: ${answers.battery || 'Not specified'}
- Environmental requirements: ${answers.environmental || 'Not specified'}
- Regulatory requirements: ${answers.regulatory || 'Not specified'}
- Target cost/price: ${answers.target_cost || 'Not specified'}
- Timeline: ${answers.timeline || 'Not specified'}
- Constraints: ${answers.constraints || 'None specified'}

Generate a complete PRD as JSON with exactly this structure:
{
  "title": "Product Requirements Document — [Product Name]",
  "version": "1.0",
  "overview": {
    "product_name": "",
    "summary": "2-3 sentence product summary",
    "problem_statement": "clear problem statement",
    "target_user": "user description",
    "value_proposition": "clear value proposition"
  },
  "specifications": {
    "physical": [
      {"parameter": "Dimensions", "requirement": "...", "rationale": "..."}
    ],
    "performance": [
      {"parameter": "Battery life", "requirement": "...", "rationale": "..."}
    ],
    "connectivity": [
      {"parameter": "Protocol", "requirement": "...", "rationale": "..."}
    ],
    "environmental": [
      {"parameter": "IP Rating", "requirement": "...", "rationale": "..."}
    ]
  },
  "functional_requirements": [
    {"id": "FR-001", "category": "Core", "requirement": "...", "priority": "Must Have", "acceptance_criteria": "..."}
  ],
  "non_functional_requirements": [
    {"id": "NFR-001", "category": "Performance", "requirement": "...", "metric": "..."}
  ],
  "regulatory": {
    "standards": ["CE marking", "..."],
    "notes": "..."
  },
  "bom_guidance": {
    "key_components": [
      {"component": "MCU", "recommendation": "...", "rationale": "..."}
    ],
    "target_bom_cost": "...",
    "retail_price": "...",
    "target_margin": "..."
  },
  "programme_timeline": {
    "evt_target": "Week X",
    "dvt_target": "Week X",
    "pvt_target": "Week X",
    "mp_target": "Week X",
    "launch_target": "Week X"
  },
  "out_of_scope": ["item 1", "item 2"],
  "open_questions": ["question 1", "question 2"]
}

Be specific and technical. Include at least 5 functional requirements and 3 non-functional requirements. Include realistic component recommendations in the BOM guidance.`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const prd = JSON.parse(clean)

    // Save PRD to project
    await supabase
      .from('projects')
      .update({
        prd_content: prd,
        status: 'prd_complete',
        name: answers.product_name,
      })
      .eq('id', projectId)

    // Also save as an output record
    await supabase
      .from('outputs')
      .insert({
        project_id: projectId,
        type: 'prd',
        title: prd.title,
        content: prd,
      })

    return NextResponse.json({ prd })

  } catch (err: any) {
    console.error('PRD generation error:', err)
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 })
  }
}
