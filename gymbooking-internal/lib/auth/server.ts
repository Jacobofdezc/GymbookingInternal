import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/auth/permissions'

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  return profile
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user || !user.is_active) {
    redirect('/login')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect('/dashboard')
  }
  return user
}
