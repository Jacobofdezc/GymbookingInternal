import type {
  KnowledgePage,
  KnowledgePageInsert,
  KnowledgePageWithRelations,
  KnowledgePageHistory,
  KnowledgeCategory,
  KnowledgeStatus,
} from '@/types/database'

async function getSupabase() {
  if (typeof window === 'undefined') {
    const { createClient } = await import('@/lib/supabase/server')
    return await createClient()
  } else {
    const { createClient } = await import('@/lib/supabase/client')
    return createClient()
  }
}

export interface KnowledgeFilters {
  category?: KnowledgeCategory | string
  status?: KnowledgeStatus | string
  search?: string
}

export interface ExtendedKnowledgePage extends KnowledgePageWithRelations {
  history?: (KnowledgePageHistory & {
    changed_by_user?: { id: string; full_name: string; email: string } | null
  })[]
}

export async function getKnowledgePages(
  filters?: KnowledgeFilters
): Promise<KnowledgePageWithRelations[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('knowledge_pages')
    .select(
      `
      *,
      author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
    `
    )
    .order('updated_at', { ascending: false })

  if (filters?.category && filters.category !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('category', filters.category as any)
  }

  if (filters?.status && filters.status !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('status', filters.status as any)
  }

  if (filters?.search && filters.search.trim() !== '') {
    query = query.or(
      `title.ilike.%${filters.search.trim()}%,content.ilike.%${filters.search.trim()}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching knowledge pages:', error)
    throw new Error(`Error al obtener artículos de la base de conocimiento: ${error.message}`)
  }

  return (data || []) as KnowledgePageWithRelations[]
}

export async function getKnowledgePage(id: string): Promise<ExtendedKnowledgePage | null> {
  const supabase = await getSupabase()

  const { data: page, error } = await supabase
    .from('knowledge_pages')
    .select(
      `
      *,
      author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
    `
    )
    .eq('id', id)
    .single()

  if (error || !page) {
    if (error?.code === 'PGRST116') return null
    console.error('Error fetching knowledge page:', error)
    throw new Error(`Error al cargar el artículo: ${error?.message || 'No encontrado'}`)
  }

  // Fetch page history
  const { data: history } = await supabase
    .from('knowledge_page_history')
    .select(
      `
      *,
      changed_by_user:profiles!knowledge_page_history_changed_by_fkey(id, full_name, email)
    `
    )
    .eq('page_id', id)
    .order('changed_at', { ascending: false })

  return {
    ...(page as KnowledgePageWithRelations),
    history: (history || []) as ExtendedKnowledgePage['history'],
  }
}

export async function createKnowledgePage(
  data: KnowledgePageInsert
): Promise<KnowledgePage> {
  const supabase = await getSupabase()

  const { data: created, error } = await supabase
    .from('knowledge_pages')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating knowledge page:', error)
    throw new Error(`Error al crear la página: ${error.message}`)
  }

  return created as KnowledgePage
}

export async function updateKnowledgePage(
  id: string,
  data: Partial<KnowledgePageInsert>,
  changedByUserId?: string
): Promise<KnowledgePageWithRelations> {
  const supabase = await getSupabase()

  // 1. Fetch current state to save in history before updating
  const { data: current } = await supabase
    .from('knowledge_pages')
    .select('title, content')
    .eq('id', id)
    .single()

  if (current) {
    // Insert into history
    await supabase.from('knowledge_page_history').insert({
      page_id: id,
      title: current.title,
      content: current.content,
      changed_by: changedByUserId || null,
    })
  }

  // 2. Update page
  const { data: updated, error } = await supabase
    .from('knowledge_pages')
    .update(data)
    .eq('id', id)
    .select(
      `
      *,
      author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
    `
    )
    .single()

  if (error) {
    console.error('Error updating knowledge page:', error)
    throw new Error(`Error al actualizar la página: ${error.message}`)
  }

  return updated as KnowledgePageWithRelations
}

export async function deleteKnowledgePage(id: string): Promise<void> {
  const supabase = await getSupabase()

  const { error } = await supabase
    .from('knowledge_pages')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting knowledge page:', error)
    throw new Error(`Error al eliminar la página: ${error.message}`)
  }
}
