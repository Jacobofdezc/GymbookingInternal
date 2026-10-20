import { createClient } from '@/lib/supabase/client'
import type { AuditLog, Profile } from '@/types/database'

export type AuditLogWithActor = AuditLog & {
  actor?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null
}

export interface AuditLogFilters {
  entity_type?: string
  action?: string
  actor_user_id?: string
  search?: string
  limit?: number
  offset?: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(client?: any) {
  return client || createClient()
}

/**
 * Fetch audit logs with optional filters and actor profile details
 */
export async function getAuditLogs(
  filters?: AuditLogFilters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
): Promise<AuditLogWithActor[]> {
  const supabase = getSupabase(client)

  let query = supabase
    .from('audit_logs')
    .select(
      `
      *,
      actor:profiles!audit_logs_actor_user_id_fkey(
        id,
        full_name,
        email,
        avatar_url,
        role
      )
    `
    )
    .order('created_at', { ascending: false })

  if (filters?.entity_type && filters.entity_type !== 'all') {
    query = query.eq('entity_type', filters.entity_type)
  }

  if (filters?.action && filters.action !== 'all') {
    query = query.eq('action', filters.action)
  }

  if (filters?.actor_user_id && filters.actor_user_id !== 'all') {
    query = query.eq('actor_user_id', filters.actor_user_id)
  }

  if (filters?.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`
    query = query.or(`action.ilike.${term},entity_type.ilike.${term}`)
  }

  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query

  if (error) {
    console.error('Error fetching audit logs:', error)
    throw new Error(`Error al cargar registros de auditoría: ${error.message}`)
  }

  return (data || []) as AuditLogWithActor[]
}

export interface CreateAuditEntryPayload {
  organization_id: string
  entity_type: string
  entity_id?: string | null
  action: string
  old_values?: Record<string, unknown> | null
  new_values?: Record<string, unknown> | null
  actor_user_id?: string | null
}

/**
 * Appends a new audit log record
 */
export async function createAuditLogEntry(
  entry: CreateAuditEntryPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
): Promise<void> {
  const supabase = getSupabase(client)

  const { error } = await supabase.from('audit_logs').insert({
    organization_id: entry.organization_id,
    entity_type: entry.entity_type,
    entity_id: entry.entity_id || null,
    action: entry.action,
    old_values: entry.old_values || null,
    new_values: entry.new_values || null,
    actor_user_id: entry.actor_user_id || null,
  })

  if (error) {
    // Non-fatal warning so it doesn't break primary application flows
    console.warn('Could not record audit log entry:', error.message)
  }
}
