import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { projectId, documentType, instruction } = await req.json()
    const supabase = createServerSupabaseClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    // Get profile and check ECR limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('paid, package, ecr_used')
      .eq('id', user.id)
      .single()

    if (!profile?.paid) return NextResponse.json({ error: 'PAYMENT_REQUIRED' }, { status: 402 })

    // Get project and check PRD ECR limit
    const { data: project } = await supabase
      .from('projects')
      .select('*, outputs(*)')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    // Check ECR limits per package
    const isPRDPackage = profile.package === 'prd'
    const maxECRs = isPRDPackage ? 2 : 5

    if (isPRDPackage) {
      // PRD package: track ECRs per project
      const prdECRUsed = project.prd_ecr_used ?? 0
      if (prdECRUsed >= maxECRs) {
        return NextResponse.json({
          error: `ECR limit reached (${maxECRs}/${maxECRs}). Upgrade to AI Package for 5 ECRs.`
        }, { status: 403 })
      }
    } else {
      // AI package: 5 ECRs total across all documents
      const ecrUsed = profile.ecr_used ?? 0
      if (ecrUsed >= maxECRs) {
        return NextResponse.json({
          error: `ECR limit reached (${maxECRs}/${maxECRs}).`
        }, { status: 403 })
      }
    }

    // Get the current document content
    const output = (project.outputs || []).find((o: any) => o.type === documentType)
    if (!output) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const currentContent = JSON.stringify(output.content, null, 2)

    // Generate the revision
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: 'You are an expert hardware product development consultant. You are revising a document based on the user\'s change request. Return ONLY the updated JSON document, no explanation, no markdown.',
      messages: [{
        role: 'user',
        content: `Current ${documentType.toUpperCase()} document:
${currentContent}

Engineering Change Request (ECR):
${instruction}

Apply the requested changes and return the complete updated document as JSON. Keep all unchanged sections exactly as they are. Only modify what was requested.`
      }]
    })

    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const updatedContent = JSON.parse(clean)

    // Save ECR record
    await supabase.from('ecrs').insert({
      project_id: projectId,
      document_type: documentType,
      instruction,
      updated_content: updatedContent,
    })

    // Update the output with new content
    await supabase
      .from('outputs')
      .update({ content: updatedContent })
      .eq('id', output.id)

    // Increment ECR counter
    if (isPRDPackage) {
      await supabase
        .from('projects')
        .update({ prd_ecr_used: (project.prd_ecr_used ?? 0) + 1 })
        .eq('id', projectId)
    } else {
      await supabase
        .from('profiles')
        .update({ ecr_used: (profile.ecr_used ?? 0) + 1 })
        .eq('id', user.id)
    }

    return NextResponse.json({ updatedContent, message: 'ECR applied successfully' })

  } catch (err: any) {
    console.error('ECR error:', err)
    return NextResponse.json({ error: err.message || 'ECR failed' }, { status: 500 })
  }
}
