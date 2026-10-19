export type UserRole = 'admin' | 'commercial' | 'operations' | 'viewer'

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
