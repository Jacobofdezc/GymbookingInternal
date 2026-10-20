import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/auth/permissions'
import type { Profile } from '@/types/database'
import { DEMO_COOKIE_NAME, type DemoSessionData } from '@/app/api/auth/demo-session/route'

export async function getCurrentUser(): Promise<Profile | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*, organizations(*)')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        return profile as Profile
      }

      // Fallback profile if user exists in auth but no profile row yet
      return {
        id: user.id,
        organization_id: (user.user_metadata?.organization_id as string) || 'a0000000-0000-4000-8000-000000000001',
        email: user.email || '',
        full_name: (user.user_metadata?.full_name as string) || user.email?.split('@')[0] || 'Usuario',
        role: (user.user_metadata?.role as UserRole) || 'admin',
        avatar_url: (user.user_metadata?.avatar_url as string) || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  } catch (err) {
    // If Supabase call fails, check demo session cookie
  }

  // Check demo session cookie
  try {
    const cookieStore = await cookies()
    const demoCookie = cookieStore.get(DEMO_COOKIE_NAME)
    if (demoCookie?.value) {
      const demoData = JSON.parse(demoCookie.value) as DemoSessionData
      return {
        id: demoData.id,
        organization_id: demoData.organization_id || 'a0000000-0000-4000-8000-000000000001',
        email: demoData.email,
        full_name: demoData.full_name,
        role: demoData.role,
        avatar_url: demoData.avatar_url || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    }
  } catch {
    // Ignore cookie parsing error
  }

  return null
}

export async function requireAuth(): Promise<Profile> {
  const user = await getCurrentUser()
  if (!user || !user.is_active) {
    redirect('/login')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<Profile> {
  const user = await requireAuth()
  if (!allowedRoles.includes(user.role as UserRole)) {
    redirect('/dashboard')
  }
  return user
}
