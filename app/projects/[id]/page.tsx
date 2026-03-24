import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import ProjectClient from './ProjectClient'

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*, documents(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/dashboard')

  const { data: outputs } = await supabase
    .from('outputs')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('profiles')
    .select('paid, package, ecr_used')
    .eq('id', user.id)
    .single()

  const isPaid = profile?.paid ?? false
  const pkg = profile?.package || 'ai'
  const maxECRs = pkg === 'prd' ? 2 : 5
  const ecrUsed = pkg === 'prd' ? (project.prd_ecr_used ?? 0) : (profile?.ecr_used ?? 0)

  return (
    <ProjectClient
      project={project}
      outputs={outputs || []}
      paid={isPaid}
      maxECRs={maxECRs}
      ecrUsed={ecrUsed}
    />
  )
}
