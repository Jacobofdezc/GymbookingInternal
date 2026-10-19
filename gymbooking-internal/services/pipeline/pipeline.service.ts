import { createClient } from '@/lib/supabase/client'
import type { Database, PriorityLevel } from '@/types/database'

export interface CommercialStage {
  id: string
  name: string
  slug: string
  color: string
  sort_order: number
  is_pipeline_stage: boolean
  is_active: boolean
}

export interface GymOwner {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

export interface GymWithRelations {
  id: string
  organization_id: string
  name: string
  legal_name: string | null
  city: string | null
  priority: PriorityLevel | null
  commercial_status_id: string | null
  owner_id: string | null
  first_contact_date: string | null
  last_contact_date: string | null
  next_followup_date: string | null
  next_action: string | null
  interest_level: string | null
  owner?: GymOwner | null
  commercial_status?: {
    id: string
    name: string
    slug: string
    color: string
    sort_order: number
    is_pipeline_stage: boolean
  } | null
}

export async function getPipelineStages(): Promise<CommercialStage[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('commercial_statuses')
    .select('id, name, slug, color, sort_order, is_pipeline_stage, is_active')
    .eq('is_pipeline_stage', true)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching pipeline stages:', error)
    throw new Error(`Error al obtener etapas: ${error.message}`)
  }

  return (data || []) as CommercialStage[]
}

export async function getGymsByPipelineStage(): Promise<Record<string, GymWithRelations[]>> {
  const supabase = createClient()

  // 1. Fetch pipeline stages to establish columns
  const stages = await getPipelineStages()
  const stageIds = stages.map((s) => s.id)

  const result: Record<string, GymWithRelations[]> = {}
  for (const stage of stages) {
    result[stage.id] = []
  }

  if (stageIds.length === 0) {
    return result
  }

  // 2. Fetch gyms in these stages with relations
  const { data: gyms, error } = await supabase
    .from('gyms')
    .select(`
      id,
      organization_id,
      name,
      legal_name,
      city,
      priority,
      commercial_status_id,
      owner_id,
      first_contact_date,
      last_contact_date,
      next_followup_date,
      next_action,
      interest_level,
      owner:profiles!owner_id(id, full_name, email, avatar_url),
      commercial_status:commercial_statuses!commercial_status_id(id, name, slug, color, sort_order, is_pipeline_stage)
    `)
    .in('commercial_status_id', stageIds)
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching gyms by stage:', error)
    throw new Error(`Error al obtener gimnasios del pipeline: ${error.message}`)
  }

  // 3. Group by commercial_status_id
  if (gyms) {
    for (const rawGym of gyms) {
      const gym = rawGym as unknown as GymWithRelations
      if (gym.commercial_status_id && result[gym.commercial_status_id]) {
        result[gym.commercial_status_id].push(gym)
      }
    }
  }

  return result
}

export async function moveGymToStage(
  gymId: string,
  newStatusId: string,
  reason?: string
) {
  const supabase = createClient()

  // 1. Get current gym and target status details for audit/interaction log
  const [gymRes, targetStatusRes] = await Promise.all([
    supabase
      .from('gyms')
      .select(`
        id,
        name,
        organization_id,
        commercial_status_id,
        commercial_status:commercial_statuses!commercial_status_id(name)
      `)
      .eq('id', gymId)
      .single(),
    supabase
      .from('commercial_statuses')
      .select('name')
      .eq('id', newStatusId)
      .single(),
  ])

  const gym = gymRes.data
  const targetStatus = targetStatusRes.data

  const today = new Date().toISOString().split('T')[0]
  const now = new Date().toISOString()

  // 2. Update commercial_status_id and last_contact_date
  const { data: updatedGym, error: updateError } = await supabase
    .from('gyms')
    .update({
      commercial_status_id: newStatusId,
      last_contact_date: today,
      updated_at: now,
    })
    .eq('id', gymId)
    .select()
    .single()

  if (updateError) {
    console.error('Error updating gym stage:', updateError)
    throw new Error(`Error al mover gimnasio de etapa: ${updateError.message}`)
  }

  // 3. Create interaction of type 'internal_note' recording the status change
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const targetName = targetStatus?.name || 'nueva etapa'
    const prevName = (gym as any)?.commercial_status?.name || 'etapa anterior'
    const noteSummary = `Cambio de etapa: de "${prevName}" a "${targetName}"`

    const orgId = gym?.organization_id
    if (orgId) {
      await supabase.from('interactions').insert({
        organization_id: orgId,
        gym_id: gymId,
        type: 'internal_note',
        interaction_date: now,
        registered_by: user?.id || null,
        summary: noteSummary,
        commitments: reason ? `Motivo: ${reason}` : null,
      })
    }
  } catch (noteErr) {
    console.warn('Could not record internal note for stage change:', noteErr)
  }

  return updatedGym
}
