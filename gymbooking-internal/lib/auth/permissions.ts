import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'commercial' | 'operations' | 'viewer'

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

export function can(role: UserRole, action: 'read' | 'write' | 'admin'): boolean {
  const permissions: Record<UserRole, ('read' | 'write' | 'admin')[]> = {
    admin: ['read', 'write', 'admin'],
    commercial: ['read', 'write'],
    operations: ['read', 'write'],
    viewer: ['read'],
  }
  return permissions[role]?.includes(action) ?? false
}

export function canWrite(role: UserRole): boolean {
  return can(role, 'write')
}

export function isAdmin(role: UserRole): boolean {
  return role === 'admin'
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  commercial: 'Comercial',
  operations: 'Operaciones',
  viewer: 'Observador',
}
