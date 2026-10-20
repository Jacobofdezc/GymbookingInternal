import { createClient } from '@/lib/supabase/client'
import type {
  Decision,
  DecisionStatus,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export interface DecisionWithDetails extends Decision {
  responsible?: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  created_by_profile?: { id: string; full_name: string; email: string } | null
  gym?: { id: string; name: string; city: string | null } | null
  replaces_decision?: { id: string; title: string } | null
}

export interface DecisionFilters {
  status?: DecisionStatus | 'all'
  gym_id?: string
  search?: string
}

export async function getDecisions(filters?: DecisionFilters): Promise<DecisionWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('decisions')
    .select(`
      *,
      responsible:profiles!decisions_responsible_id_fkey(id, full_name, email, avatar_url),
      created_by_profile:profiles!decisions_created_by_fkey(id, full_name, email),
      gym:gyms(id, name, city),
      replaces_decision:decisions!decisions_replaces_decision_id_fkey(id, title)
    `)
    .order('decision_date', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.gym_id) {
    query = query.eq('gym_id', filters.gym_id)
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.trim()
    query = query.or(`title.ilike.%${s}%,decision_made.ilike.%${s}%,context.ilike.%${s}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching decisions:', error)
    throw new Error(error.message)
  }

  return (data || []) as unknown as DecisionWithDetails[]
}

export async function createDecision(
  data: Omit<TablesInsert<'decisions'>, 'organization_id'> & { organization_id?: string }
): Promise<Decision> {
  const supabase = createClient()

  let orgId = data.organization_id
  let userId = data.created_by

  if (!orgId || !userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error('Usuario no autenticado')

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) throw new Error('Perfil no encontrado')
    orgId = profile.organization_id
    userId = user.id
  }

  const { data: created, error } = await supabase
    .from('decisions')
    .insert({
      ...data,
      organization_id: orgId,
      created_by: userId,
    })
    .select()
    .single()

  if (error || !created) {
    console.error('Error creating decision:', error)
    throw new Error(error?.message || 'Error al registrar la decisión')
  }

  return created
}

export async function updateDecision(
  id: string,
  data: TablesUpdate<'decisions'>
): Promise<Decision> {
  const supabase = createClient()

  const { data: updated, error } = await supabase
    .from('decisions')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error || !updated) {
    console.error('Error updating decision:', error)
    throw new Error(error?.message || 'Error al actualizar la decisión')
  }

  return updated
}

export async function deleteDecision(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase.from('decisions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting decision:', error)
    throw new Error(error.message)
  }
}
