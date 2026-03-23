import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { projectId, question } = await req.json()
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const { data: project } = await supabase
      .from('projects')
      .select('*, outputs(*)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Check question limit
    const questionsUsed = project.questions_used ?? 0
    if (questionsUsed >= 10) {
      return NextResponse.json({ error: 'Question limit reached (10/10)' }, { status: 403 })
    }

    // Build context from outputs
    const outputContext = (project.outputs || []).map((o: any) =>
      `${o.type.toUpperCase()}:\n${JSON.stringify(o.content, null, 2)}`
    ).join('\n\n---\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: `You are Hans Stam, a hardware product development consultant with 18+ years of experience. You are reviewing a customer's generated FMEA, project charter, and build timeline and answering their specific question about it. Be direct, practical, and specific to their product. Reference actual items from their documents.`,
      messages: [{
        role: 'user',
        content: `Product: ${project.name} (${project.product_category}, ${project.build_stage})

Generated documents:
${outputContext}

Customer question: ${question}`
      }]
    })

    const answer = message.content[0].type === 'text' ? message.content[0].text : ''

    // Save question and answer
    const { data: savedQuestion } = await supabase
      .from('questions')
      .insert({ project_id: projectId, question, answer })
      .select()
      .single()

    // Increment question counter
    await supabase
      .from('projects')
      .update({ questions_used: questionsUsed + 1 })
      .eq('id', projectId)

    return NextResponse.json({ question: savedQuestion })

  } catch (err: any) {
    console.error('Question error:', err)
    return NextResponse.json({ error: err.message || 'Failed to answer question' }, { status: 500 })
  }
}
