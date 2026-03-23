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

  const { data: questions } = await supabase
    .from('questions')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: true })

  const { data: profile } = await supabase
    .from('profiles')
    .select('paid')
    .eq('id', user.id)
    .single()

  return <ProjectClient project={project} outputs={outputs || []} questions={questions || []} paid={profile?.paid ?? false} />
}
