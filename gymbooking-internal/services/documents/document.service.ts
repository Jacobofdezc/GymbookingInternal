import type {
  Document,
  DocumentInsert,
  DocumentWithRelations,
  DocumentCategory,
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

export interface DocumentFilters {
  gym_id?: string
  category?: DocumentCategory | string
  visibility?: string
  search?: string
}

export async function getDocuments(
  filters?: DocumentFilters
): Promise<DocumentWithRelations[]> {
  const supabase = await getSupabase()

  let query = supabase
    .from('documents')
    .select(
      `
      *,
      owner:profiles!documents_owner_id_fkey(id, full_name, email, avatar_url),
      gym:gyms!documents_gym_id_fkey(id, name)
    `
    )
    .order('created_at', { ascending: false })

  if (filters?.gym_id && filters.gym_id !== 'all') {
    query = query.eq('gym_id', filters.gym_id)
  }

  if (filters?.category && filters.category !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('category', filters.category as any)
  }

  if (filters?.visibility && filters.visibility !== 'all') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query = query.eq('visibility', filters.visibility as any)
  }

  if (filters?.search && filters.search.trim() !== '') {
    query = query.ilike('name', `%${filters.search.trim()}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching documents:', error)
    throw new Error(`Error al obtener documentos: ${error.message}`)
  }

  return (data || []) as DocumentWithRelations[]
}

export async function uploadDocument(
  file: File,
  metadata: DocumentInsert
): Promise<Document> {
  const supabase = await getSupabase()

  // Generate unique path: {org_id}/{category}/{uuid}-{filename}
  const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const fileUuid = crypto.randomUUID()
  const categoryFolder = metadata.category || 'other'
  const storagePath = `${metadata.organization_id}/${categoryFolder}/${fileUuid}-${cleanFileName}`

  // 1. Upload to Supabase Storage
  const { error: uploadError } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    throw new Error(`Error al subir el archivo al almacenamiento: ${uploadError.message}`)
  }

  // 2. Insert document record in DB
  const insertPayload: DocumentInsert = {
    organization_id: metadata.organization_id,
    name: metadata.name || file.name,
    category: metadata.category || 'other',
    description: metadata.description || null,
    storage_path: storagePath,
    file_name: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
    visibility: metadata.visibility || 'all',
    version: metadata.version || '1.0',
    owner_id: metadata.owner_id || null,
    gym_id: metadata.gym_id || null,
    contact_id: metadata.contact_id || null,
    interaction_id: metadata.interaction_id || null,
    task_id: metadata.task_id || null,
    issue_id: metadata.issue_id || null,
    created_by: metadata.created_by || metadata.owner_id || null,
  }

  const { data, error: insertError } = await supabase
    .from('documents')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError) {
    console.error('Database insert error for document:', insertError)
    // Clean up uploaded file if DB insert fails
    await supabase.storage.from('documents').remove([storagePath])
    throw new Error(`Error al guardar el registro del documento: ${insertError.message}`)
  }

  return data as Document
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const supabase = await getSupabase()

  const { data, error } = await supabase.storage
    .from('documents')
    .createSignedUrl(storagePath, 3600) // 1 hour expiry

  if (error || !data?.signedUrl) {
    console.error('Error creating signed URL:', error)
    throw new Error(`Error al generar enlace de descarga: ${error?.message || 'URL no encontrada'}`)
  }

  return data.signedUrl
}

export async function deleteDocument(id: string, storagePath: string): Promise<void> {
  const supabase = await getSupabase()

  // Remove from storage
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from('documents')
      .remove([storagePath])

    if (storageError) {
      console.warn('Storage delete warning:', storageError.message)
    }
  }

  // Delete from DB
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('Database delete error:', dbError)
    throw new Error(`Error al eliminar el documento: ${dbError.message}`)
  }
}
