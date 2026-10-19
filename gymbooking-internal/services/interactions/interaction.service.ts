import { createClient } from '@/lib/supabase/client'
import type { Database, Tables, TablesInsert } from '@/types/database'

export type InteractionInsert = TablesInsert<'interactions'>
export type InteractionRow = Tables<'interactions'>

export interface InteractionWithDetails extends InteractionRow {
  gym?: {
    id: string
    name: string
    city?: string | null
  } | null
  contact?: {
    id: string
    full_name: string
    job_title?: string | null
    phone?: string | null
    email?: string | null
  } | null
  registered_by_profile?: {
    id: string
    full_name: string
    email: string
  } | null
}

export async function getInteractions(filters?: {
  gym_id?: string
  type?: string
  registered_by?: string
  dateFrom?: string
  dateTo?: string
}): Promise<InteractionWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('interactions')
    .select(`
      *,
      gym:gyms ( id, name, city ),
      contact:gym_contacts ( id, full_name, job_title, phone, email ),
      registered_by_profile:profiles!interactions_registered_by_fkey ( id, full_name, email )
    `)
    .order('interaction_date', { ascending: false })

  if (filters?.gym_id) {
    query = query.eq('gym_id', filters.gym_id)
  }

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type as any)
  }

  if (filters?.registered_by && filters.registered_by !== 'all') {
    query = query.eq('registered_by', filters.registered_by)
  }

  if (filters?.dateFrom) {
    query = query.gte('interaction_date', filters.dateFrom)
  }

  if (filters?.dateTo) {
    query = query.lte('interaction_date', `${filters.dateTo}T23:59:59.999Z`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching interactions:', error)
    throw new Error(error.message)
  }

  return (data as any) || []
}

export async function getGymInteractions(gymId: string): Promise<InteractionWithDetails[]> {
  return getInteractions({ gym_id: gymId })
}

export async function createInteraction(
  data: Omit<InteractionInsert, 'organization_id'> & { organization_id?: string },
  createTaskFlag?: boolean,
  taskData?: {
    title?: string
    description?: string
    due_date?: string | null
    assignee_id?: string | null
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }
): Promise<InteractionRow> {
  const supabase = createClient()

  // Ensure organization_id if not present
  let orgId = data.organization_id
  let userId = data.registered_by

  if (!orgId || !userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      if (!userId) userId = user.id
      if (!orgId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (profile) orgId = profile.organization_id
      }
    }
  }

  const payload: InteractionInsert = {
    ...data,
    organization_id: (orgId || data.organization_id)!,
    registered_by: userId || data.registered_by,
    created_by: userId || data.created_by,
  }

  const { data: interaction, error } = await supabase
    .from('interactions')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating interaction:', error)
    throw new Error(error.message)
  }

  // Update gym last_contact_date & next_followup_date if provided
  if (data.gym_id) {
    const gymUpdate: Record<string, any> = {
      last_contact_date: data.interaction_date ? data.interaction_date.split('T')[0] : new Date().toISOString().split('T')[0],
    }
    if (data.next_step_date) {
      gymUpdate.next_followup_date = data.next_step_date
    }
    if (data.next_step) {
      gymUpdate.next_action = data.next_step
    }

    await supabase.from('gyms').update(gymUpdate as any).eq('id', data.gym_id)
  }

  // Optionally create linked task
  if (createTaskFlag && data.gym_id && orgId) {
    const taskTitle =
      taskData?.title ||
      (data.next_step ? `Seguimiento: ${data.next_step.slice(0, 60)}` : `Seguimiento de interacción`)

    const taskPayload = {
      organization_id: orgId,
      gym_id: data.gym_id,
      contact_id: data.contact_id || null,
      title: taskTitle,
      description: taskData?.description || data.next_step || data.summary,
      due_date: taskData?.due_date || data.next_step_date || null,
      assignee_id: taskData?.assignee_id || userId || null,
      priority: taskData?.priority || 'medium',
      status: 'pending' as const,
      created_by: userId || null,
    }

    const { error: taskError } = await supabase.from('tasks').insert(taskPayload)
    if (taskError) {
      console.warn('Could not auto-create linked task:', taskError)
    }
  }

  return interaction
}
