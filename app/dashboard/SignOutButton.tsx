'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const supabase = createClient()
  const router = useRouter()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      style={{
        fontSize: '13px', color: 'var(--mid)', background: 'none',
        border: '1px solid var(--border)', padding: '6px 14px',
        borderRadius: '6px', cursor: 'pointer'
      }}
    >
      Sign out
    </button>
  )
}
