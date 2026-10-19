import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/types/database'

export type GymOnboardingItem = Tables<'gym_onboarding_items'>
export type OnboardingTemplate = Tables<'onboarding_templates'>
export type OnboardingTemplateItem = Tables<'onboarding_template_items'>
export type ClassRow = Tables<'classes'>
export type ClassInsert = TablesInsert<'classes'>

export interface GymOnboardingItemWithDetails extends GymOnboardingItem {
  assignee?: {
    id: string
    full_name: string
    email: string
  } | null
  template_item?: OnboardingTemplateItem | null
  category?: string | null
}

export interface ClassWithDetails extends ClassRow {
  gym?: {
    id: string
    name: string
    city?: string | null
  } | null
  discipline?: {
    id: string
    name: string
  } | null
  verified_by_profile?: {
    id: string
    full_name: string
    email: string
  } | null
}

export async function getGymOnboardingItems(gymId: string): Promise<GymOnboardingItemWithDetails[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('gym_onboarding_items')
    .select(`
      *,
      assignee:profiles!gym_onboarding_items_assignee_id_fkey ( id, full_name, email ),
      template_item:onboarding_template_items ( id, category, requires_document )
    `)
    .eq('gym_id', gymId)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching onboarding items:', error)
    throw new Error(error.message)
  }

  // Map category from template_item if present
  return ((data as any) || []).map((item: any) => ({
    ...item,
    category: item.template_item?.category || 'data',
  }))
}

export async function updateOnboardingItem(
  id: string,
  updates: Partial<GymOnboardingItem>
): Promise<GymOnboardingItem> {
  const supabase = createClient()

  const payload: Partial<GymOnboardingItem> = {
    ...updates,
    updated_at: new Date().toISOString(),
  }

  if (updates.status === 'completed' && !updates.completed_at) {
    payload.completed_at = new Date().toISOString()
  } else if (updates.status && updates.status !== 'completed') {
    payload.completed_at = null
  }

  const { data, error } = await supabase
    .from('gym_onboarding_items')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating onboarding item:', error)
    throw new Error(error.message)
  }

  // Update classes_verified or check if ready to publish
  if (data?.gym_id) {
    await checkAndUpdateGymOnboardingStatus(data.gym_id)
  }

  return data
}

export async function getOnboardingTemplates(): Promise<OnboardingTemplate[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('onboarding_templates')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching templates:', error)
    throw new Error(error.message)
  }

  return data || []
}

export const DEFAULT_TEMPLATE_ITEMS = [
  { title: 'Confirmación comercial registrada', description: 'Registrar la confirmación verbal o escrita del gimnasio', category: 'commercial', sort_order: 1 },
  { title: 'Persona de contacto principal identificada', description: 'Identificar quién será el interlocutor principal', category: 'commercial', sort_order: 2 },
  { title: 'Condiciones comerciales documentadas', description: 'Documentar el modelo y condiciones acordadas', category: 'commercial', sort_order: 3 },
  { title: 'Acuerdo formalizado (si procede)', description: 'Firmar o confirmar por escrito el acuerdo', category: 'commercial', sort_order: 4 },
  { title: 'Información del gimnasio verificada', description: 'Comprobar nombre, dirección y datos de contacto', category: 'data', sort_order: 5 },
  { title: 'Dirección y datos de contacto verificados', description: 'Confirmar dirección exacta y teléfono/email', category: 'data', sort_order: 6 },
  { title: 'Disciplinas deportivas confirmadas', description: 'Confirmar qué disciplinas ofrece el gimnasio', category: 'data', sort_order: 7 },
  { title: 'Horarios y clases recibidos', description: 'Recibir la programación de clases del gimnasio', category: 'data', sort_order: 8 },
  { title: 'Precios y condiciones de las clases comprobados', description: 'Verificar precios y política de cancelación', category: 'data', sort_order: 9 },
  { title: 'Disponibilidad y sistema de reservas definido', description: 'Aclarar cómo se gestionarán las reservas', category: 'operations', sort_order: 10 },
  { title: 'Procedimiento de cancelaciones documentado', description: 'Definir el proceso de cancelación de reservas', category: 'operations', sort_order: 11 },
  { title: 'Información cargada en la plataforma', description: 'Introducir los datos del gimnasio y clases en GymBooking', category: 'platform', sort_order: 12 },
  { title: 'Clases revisadas', description: 'Revisar que toda la información de clases es correcta', category: 'platform', sort_order: 13 },
  { title: 'Publicación autorizada', description: 'Obtener autorización interna para publicar', category: 'platform', sort_order: 14 },
  { title: 'Gimnasio activado', description: 'Activar el gimnasio en la plataforma pública', category: 'platform', sort_order: 15 },
]

export async function initializeChecklistFromTemplate(
  gymId: string,
  templateId?: string
): Promise<GymOnboardingItem[]> {
  const supabase = createClient()

  // Get gym to find its organization_id
  const { data: gym, error: gymError } = await supabase
    .from('gyms')
    .select('id, organization_id')
    .eq('id', gymId)
    .single()

  if (gymError || !gym) {
    throw new Error('Gimnasio no encontrado')
  }

  // Look for items from template if provided or default
  let templateItems: Array<{ id?: string; title: string; description?: string | null; sort_order: number; category?: string }> = []

  let selectedTemplateId = templateId
  if (!selectedTemplateId) {
    const { data: defaultTemplate } = await supabase
      .from('onboarding_templates')
      .select('id')
      .eq('organization_id', gym.organization_id)
      .eq('is_default', true)
      .maybeSingle()

    if (defaultTemplate) {
      selectedTemplateId = defaultTemplate.id
    }
  }

  if (selectedTemplateId) {
    const { data: items } = await supabase
      .from('onboarding_template_items')
      .select('*')
      .eq('template_id', selectedTemplateId)
      .order('sort_order', { ascending: true })

    if (items && items.length > 0) {
      templateItems = items
    }
  }

  // Fallback to standard 15 items if no items found in DB
  if (templateItems.length === 0) {
    templateItems = DEFAULT_TEMPLATE_ITEMS
  }

  const itemsToInsert = templateItems.map((item) => ({
    organization_id: gym.organization_id,
    gym_id: gymId,
    template_item_id: item.id || null,
    title: item.title,
    description: item.description || null,
    status: 'pending' as const,
    sort_order: item.sort_order,
  }))

  const { data: createdItems, error: insertError } = await supabase
    .from('gym_onboarding_items')
    .insert(itemsToInsert)
    .select()

  if (insertError) {
    console.error('Error initializing checklist:', insertError)
    throw new Error(insertError.message)
  }

  return createdItems || []
}

async function checkAndUpdateGymOnboardingStatus(gymId: string) {
  const supabase = createClient()
  const { data: items } = await supabase
    .from('gym_onboarding_items')
    .select('status')
    .eq('gym_id', gymId)

  if (!items || items.length === 0) return

  const total = items.length
  const completed = items.filter((i) => i.status === 'completed').length
  const hasBlocked = items.some((i) => i.status === 'blocked')

  // Look up matching status in onboarding_statuses
  const targetSlug = hasBlocked
    ? 'blocked'
    : completed === total
    ? 'ready_to_publish'
    : completed > 0
    ? 'gathering_info'
    : 'not_started'

  const { data: statusObj } = await supabase
    .from('onboarding_statuses')
    .select('id')
    .eq('slug', targetSlug)
    .maybeSingle()

  if (statusObj) {
    await supabase.from('gyms').update({ onboarding_status_id: statusObj.id }).eq('id', gymId)
  }
}

export async function getClasses(filters?: {
  gym_id?: string
  publication_status?: string
}): Promise<ClassWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('classes')
    .select(`
      *,
      gym:gyms ( id, name, city ),
      discipline:disciplines ( id, name ),
      verified_by_profile:profiles!classes_verified_by_fkey ( id, full_name, email )
    `)
    .order('name', { ascending: true })

  if (filters?.gym_id && filters.gym_id !== 'all') {
    query = query.eq('gym_id', filters.gym_id)
  }

  if (filters?.publication_status && filters.publication_status !== 'all') {
    query = query.eq('publication_status', filters.publication_status)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching classes:', error)
    throw new Error(error.message)
  }

  return (data as any) || []
}

export async function createClass(data: ClassInsert): Promise<ClassRow> {
  const supabase = createClient()
  const { data: newClass, error } = await supabase
    .from('classes')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating class:', error)
    throw new Error(error.message)
  }

  return newClass
}

export async function updateClass(id: string, updates: Partial<ClassInsert>): Promise<ClassRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('classes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating class:', error)
    throw new Error(error.message)
  }

  return data
}
