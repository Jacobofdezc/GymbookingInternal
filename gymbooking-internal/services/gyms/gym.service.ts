import { createClient } from '@/lib/supabase/client'
import type {
  Gym,
  CommercialStatus,
  OnboardingStatus,
  Profile,
  Discipline,
  Tag,
  GymContact,
  Interaction,
  Task,
  Document,
  GymOnboardingItem,
  Class,
  GymPriority,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'
import type { GymFormValues } from '@/lib/validations/gym.schema'

export interface GymFilters {
  city?: string
  commercial_status_id?: string
  onboarding_status_id?: string
  priority?: GymPriority | 'all'
  owner_id?: string
  search?: string
  nextFollowupOverdue?: boolean
  quickFilter?: string
  sortBy?: string
  sortAsc?: boolean
}

export interface GymListItem extends Gym {
  commercial_status: CommercialStatus | null
  onboarding_status: OnboardingStatus | null
  owner: Profile | null
  last_interaction_date?: string | null
}

export interface FullGymDetail extends Gym {
  commercial_status: CommercialStatus | null
  onboarding_status: OnboardingStatus | null
  owner: Profile | null
  onboarding_owner: Profile | null
  gym_contacts: GymContact[]
  disciplines: Discipline[]
  tags: Tag[]
  interactions: (Interaction & {
    registered_by_user: { id: string; full_name: string; avatar_url: string | null } | null
    contact: GymContact | null
  })[]
  tasks: (Task & {
    assignee: { id: string; full_name: string; avatar_url: string | null } | null
  })[]
  documents: Document[]
  gym_onboarding_items: GymOnboardingItem[]
  classes: (Class & { discipline: Discipline | null })[]
}

export interface GymStats {
  total: number
  byCommercialStatus: Record<string, { count: number; name: string; color: string }>
  byOnboardingStatus: Record<string, { count: number; name: string; color: string }>
  overdueFollowups: number
}

// Log audit helper
async function logAudit(
  action: string,
  entityId: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
) {
  try {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (!profile) return

    await supabase.from('audit_logs').insert({
      organization_id: profile.organization_id,
      actor_user_id: user.id,
      entity_type: 'gym',
      entity_id: entityId,
      action,
      old_values: oldValues as any,
      new_values: newValues as any,
    })
  } catch (err) {
    console.error('Error logging audit:', err)
  }
}

/**
 * Get list of gyms with optional filters and sorting
 */
export async function getGyms(filters: GymFilters = {}): Promise<GymListItem[]> {
  const supabase = createClient()

  let query = supabase
    .from('gyms')
    .select(`
      *,
      commercial_status:commercial_statuses(*),
      onboarding_status:onboarding_statuses(*),
      owner:profiles!gyms_owner_id_fkey(*)
    `)

  // City filter
  if (filters.city && filters.city !== 'all') {
    query = query.ilike('city', `%${filters.city}%`)
  }

  // Commercial status filter
  if (filters.commercial_status_id && filters.commercial_status_id !== 'all') {
    query = query.eq('commercial_status_id', filters.commercial_status_id)
  }

  // Onboarding status filter
  if (filters.onboarding_status_id && filters.onboarding_status_id !== 'all') {
    query = query.eq('onboarding_status_id', filters.onboarding_status_id)
  }

  // Priority filter
  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  // Owner filter
  if (filters.owner_id && filters.owner_id !== 'all') {
    query = query.eq('owner_id', filters.owner_id)
  }

  // Search filter (name or city)
  if (filters.search && filters.search.trim().length > 0) {
    const s = filters.search.trim()
    query = query.or(`name.ilike.%${s}%,city.ilike.%${s}%,description.ilike.%${s}%`)
  }

  // Followup overdue filter
  const today = new Date().toISOString().split('T')[0]
  if (filters.nextFollowupOverdue) {
    query = query.not('next_followup_date', 'is', null).lt('next_followup_date', today)
  }

  // Sorting
  const sortBy = filters.sortBy || 'created_at'
  const sortAsc = filters.sortAsc ?? false
  query = query.order(sortBy as any, { ascending: sortAsc })

  const { data, error } = await query

  if (error) {
    console.error('Error in getGyms:', error)
    throw new Error(error.message)
  }

  let results = (data || []) as unknown as GymListItem[]

  // Quick filter tab application if specified
  if (filters.quickFilter && filters.quickFilter !== 'all') {
    switch (filters.quickFilter) {
      case 'new_contacts':
        results = results.filter((g) => {
          const slug = g.commercial_status?.slug?.toLowerCase() || ''
          return slug.includes('identificado') || slug.includes('nuevo') || slug.includes('primer_contacto')
        })
        break
      case 'pending_response':
        results = results.filter((g) => {
          const slug = g.commercial_status?.slug?.toLowerCase() || ''
          return slug.includes('pendiente') || slug.includes('contactado')
        })
        break
      case 'interested':
        results = results.filter((g) => {
          const slug = g.commercial_status?.slug?.toLowerCase() || ''
          return slug.includes('interesado') || g.interest_level === 'high' || g.interest_level === 'very_high'
        })
        break
      case 'confirmed':
        results = results.filter((g) => {
          const slug = g.commercial_status?.slug?.toLowerCase() || ''
          return slug.includes('confirmado') || slug.includes('acuerdo')
        })
        break
      case 'onboarding_pending':
        results = results.filter((g) => {
          const slug = g.onboarding_status?.slug?.toLowerCase() || ''
          return !!g.onboarding_status_id && !slug.includes('activo') && !slug.includes('completado')
        })
        break
      case 'active':
        results = results.filter((g) => {
          const slug = g.onboarding_status?.slug?.toLowerCase() || ''
          return slug.includes('activo') || slug.includes('publicado')
        })
        break
      case 'overdue_followup':
        results = results.filter((g) => g.next_followup_date && g.next_followup_date < today)
        break
    }
  }

  return results
}

/**
 * Get single gym with all relations for detail page
 */
export async function getGym(id: string): Promise<FullGymDetail> {
  const supabase = createClient()

  // 1. Fetch gym with status and owner relations
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select(`
      *,
      commercial_status:commercial_statuses(*),
      onboarding_status:onboarding_statuses(*),
      owner:profiles!gyms_owner_id_fkey(*),
      onboarding_owner:profiles!gyms_onboarding_owner_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (gymError || !gym) {
    console.error('Error fetching gym:', gymError)
    throw new Error(gymError?.message || 'Gimnasio no encontrado')
  }

  // 2. Parallel fetch for sub-collections
  const [
    contactsRes,
    disciplinesRes,
    tagsRes,
    interactionsRes,
    tasksRes,
    documentsRes,
    onboardingRes,
    classesRes,
  ] = await Promise.all([
    supabase
      .from('gym_contacts')
      .select('*')
      .eq('gym_id', id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),

    supabase
      .from('gym_disciplines')
      .select('discipline:disciplines(*)')
      .eq('gym_id', id),

    supabase
      .from('gym_tags')
      .select('tag:tags(*)')
      .eq('gym_id', id),

    supabase
      .from('interactions')
      .select(`
        *,
        registered_by_user:profiles!interactions_registered_by_fkey(id, full_name, avatar_url),
        contact:gym_contacts(*)
      `)
      .eq('gym_id', id)
      .order('interaction_date', { ascending: false }),

    supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
      `)
      .eq('gym_id', id)
      .order('due_date', { ascending: true }),

    supabase
      .from('documents')
      .select('*')
      .eq('gym_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('gym_onboarding_items')
      .select('*')
      .eq('gym_id', id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('classes')
      .select('*, discipline:disciplines(*)')
      .eq('gym_id', id)
      .order('name', { ascending: true }),
  ])

  const disciplines = (disciplinesRes.data || [])
    .map((item: any) => item.discipline)
    .filter(Boolean) as Discipline[]

  const tags = (tagsRes.data || [])
    .map((item: any) => item.tag)
    .filter(Boolean) as Tag[]

  return {
    ...(gym as unknown as Gym),
    commercial_status: (gym as any).commercial_status || null,
    onboarding_status: (gym as any).onboarding_status || null,
    owner: (gym as any).owner || null,
    onboarding_owner: (gym as any).onboarding_owner || null,
    gym_contacts: (contactsRes.data || []) as GymContact[],
    disciplines,
    tags,
    interactions: (interactionsRes.data || []) as any,
    tasks: (tasksRes.data || []) as any,
    documents: (documentsRes.data || []) as Document[],
    gym_onboarding_items: (onboardingRes.data || []) as GymOnboardingItem[],
    classes: (classesRes.data || []) as any,
  }
}

/**
 * Create a new gym
 */
export async function createGym(values: GymFormValues): Promise<Gym> {
  const supabase = createClient()

  // Get current user and organization
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Usuario no autenticado')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw new Error('Perfil de usuario no encontrado')
  }

  const { discipline_ids, ...rawValues } = values

  // Clean empty strings to null for uuids and foreign keys
  const cleanedInsert: TablesInsert<'gyms'> = {
    ...rawValues,
    organization_id: profile.organization_id,
    created_by: user.id,
    commercial_status_id: rawValues.commercial_status_id || null,
    onboarding_status_id: rawValues.onboarding_status_id || null,
    owner_id: rawValues.owner_id || null,
    onboarding_owner_id: rawValues.onboarding_owner_id || null,
    website: rawValues.website || null,
    email: rawValues.email || null,
    contract_url: rawValues.contract_url || null,
  }

  const { data: newGym, error } = await supabase
    .from('gyms')
    .insert(cleanedInsert)
    .select()
    .single()

  if (error || !newGym) {
    console.error('Error creating gym:', error)
    throw new Error(error?.message || 'Error al crear el gimnasio')
  }

  // Handle disciplines M:N
  if (discipline_ids && discipline_ids.length > 0) {
    const disciplineRows = discipline_ids.map((dId) => ({
      gym_id: newGym.id,
      discipline_id: dId,
    }))
    await supabase.from('gym_disciplines').insert(disciplineRows)
  }

  // Log audit
  await logAudit('CREATE', newGym.id, null, newGym as any)

  return newGym
}

/**
 * Update existing gym
 */
export async function updateGym(id: string, values: Partial<GymFormValues>): Promise<Gym> {
  const supabase = createClient()

  // Fetch current for audit comparison
  const { data: oldGym } = await supabase.from('gyms').select('*').eq('id', id).single()

  const { discipline_ids, ...rawValues } = values

  const cleanedUpdate: TablesUpdate<'gyms'> = {
    ...rawValues,
    commercial_status_id: rawValues.commercial_status_id === '' ? null : rawValues.commercial_status_id,
    onboarding_status_id: rawValues.onboarding_status_id === '' ? null : rawValues.onboarding_status_id,
    owner_id: rawValues.owner_id === '' ? null : rawValues.owner_id,
    onboarding_owner_id: rawValues.onboarding_owner_id === '' ? null : rawValues.onboarding_owner_id,
    website: rawValues.website === '' ? null : rawValues.website,
    email: rawValues.email === '' ? null : rawValues.email,
    contract_url: rawValues.contract_url === '' ? null : rawValues.contract_url,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedGym, error } = await supabase
    .from('gyms')
    .update(cleanedUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error || !updatedGym) {
    console.error('Error updating gym:', error)
    throw new Error(error?.message || 'Error al actualizar el gimnasio')
  }

  // Update disciplines if provided
  if (discipline_ids !== undefined) {
    await supabase.from('gym_disciplines').delete().eq('gym_id', id)
    if (discipline_ids.length > 0) {
      const disciplineRows = discipline_ids.map((dId) => ({
        gym_id: id,
        discipline_id: dId,
      }))
      await supabase.from('gym_disciplines').insert(disciplineRows)
    }
  }

  // Log audit
  await logAudit('UPDATE', id, oldGym as any, updatedGym as any)

  return updatedGym
}

/**
 * Delete a gym (soft delete or hard delete with admin checks)
 */
export async function deleteGym(id: string): Promise<void> {
  const supabase = createClient()

  // Fetch old data for audit
  const { data: oldGym } = await supabase.from('gyms').select('*').eq('id', id).single()

  const { error } = await supabase.from('gyms').delete().eq('id', id)

  if (error) {
    console.error('Error deleting gym:', error)
    throw new Error(error.message)
  }

  await logAudit('DELETE', id, oldGym as any, null)
}

/**
 * Update commercial status and optionally record note/interaction
 */
export async function updateGymStatus(
  id: string,
  commercial_status_id: string,
  reason?: string
): Promise<Gym> {
  const supabase = createClient()

  const { data: oldGym } = await supabase
    .from('gyms')
    .select('commercial_status_id, commercial_notes')
    .eq('id', id)
    .single()

  const updatePayload: TablesUpdate<'gyms'> = {
    commercial_status_id,
    updated_at: new Date().toISOString(),
  }

  if (reason) {
    const existingNotes = oldGym?.commercial_notes ? `${oldGym.commercial_notes}\n\n` : ''
    updatePayload.commercial_notes = `${existingNotes}[${new Date().toLocaleDateString('es-ES')}] Cambio de estado: ${reason}`
  }

  const { data: updatedGym, error } = await supabase
    .from('gyms')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single()

  if (error || !updatedGym) {
    console.error('Error updating status:', error)
    throw new Error(error?.message || 'Error al cambiar el estado')
  }

  await logAudit('STATUS_CHANGE', id, oldGym as any, updatedGym as any)

  return updatedGym
}

/**
 * Get stats for dashboard and summary widgets
 */
export async function getGymStats(): Promise<GymStats> {
  const supabase = createClient()

  const [gymsRes, commStatusesRes, onbStatusesRes] = await Promise.all([
    supabase
      .from('gyms')
      .select('id, commercial_status_id, onboarding_status_id, next_followup_date'),
    supabase
      .from('commercial_statuses')
      .select('id, name, color')
      .eq('is_active', true),
    supabase
      .from('onboarding_statuses')
      .select('id, name, color')
      .eq('is_active', true),
  ])

  const gyms = gymsRes.data || []
  const commStatuses = commStatusesRes.data || []
  const onbStatuses = onbStatusesRes.data || []

  const today = new Date().toISOString().split('T')[0]
  let overdueFollowups = 0

  const byCommercialStatus: Record<string, { count: number; name: string; color: string }> = {}
  commStatuses.forEach((st) => {
    byCommercialStatus[st.id] = { count: 0, name: st.name, color: st.color }
  })

  const byOnboardingStatus: Record<string, { count: number; name: string; color: string }> = {}
  onbStatuses.forEach((st) => {
    byOnboardingStatus[st.id] = { count: 0, name: st.name, color: st.color }
  })

  gyms.forEach((g) => {
    if (g.commercial_status_id && byCommercialStatus[g.commercial_status_id]) {
      byCommercialStatus[g.commercial_status_id].count++
    }
    if (g.onboarding_status_id && byOnboardingStatus[g.onboarding_status_id]) {
      byOnboardingStatus[g.onboarding_status_id].count++
    }
    if (g.next_followup_date && g.next_followup_date < today) {
      overdueFollowups++
    }
  })

  return {
    total: gyms.length,
    byCommercialStatus,
    byOnboardingStatus,
    overdueFollowups,
  }
}
