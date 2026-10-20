import { createClient } from '@/lib/supabase/client'
import type {
  Document,
  DocumentInsert,
  DocumentWithRelations,
  DocumentCategory,
} from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(client?: any) {
  return client || createClient()
}

export interface DocumentFilters {
  gym_id?: string
  category?: DocumentCategory | string
  visibility?: string
  search?: string
}

export const DEFAULT_DOCUMENTS: DocumentWithRelations[] = [
  {
    id: 'doc-001',
    organization_id: 'org-default',
    name: 'Contrato Marco de Adhesión - Centros Deportivos (Plantilla).pdf',
    storage_path: 'templates/contrato_marco_2026.pdf',
    file_name: 'contrato_marco_2026.pdf',
    content_type: 'application/pdf',
    size_bytes: 245760,
    category: 'agreements',
    visibility: 'all',
    description: 'Plantilla oficial de contrato de intermediación para gimnasios asociados.',
    version: '1.0',
    contact_id: null,
    interaction_id: null,
    task_id: null,
    issue_id: null,
    is_demo: true,
    created_by: null,
    gym_id: null,
    owner_id: 'admin-01',
    created_at: '2026-09-01T10:00:00.000Z',
    owner: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
    gym: null,
  },
  {
    id: 'doc-002',
    organization_id: 'org-default',
    name: 'Ficha Técnica de Integración de Tornos y Accesos QR.pdf',
    storage_path: 'technical/guia_tornos_qr.pdf',
    file_name: 'guia_tornos_qr.pdf',
    content_type: 'application/pdf',
    size_bytes: 184320,
    category: 'onboarding_material',
    visibility: 'all',
    description: 'Especificaciones para configurar la lectura de QR en tornos de acceso.',
    version: '1.0',
    contact_id: null,
    interaction_id: null,
    task_id: null,
    issue_id: null,
    is_demo: true,
    created_by: null,
    gym_id: null,
    owner_id: 'ops-01',
    created_at: '2026-09-10T11:30:00.000Z',
    owner: {
      id: 'ops-01',
      full_name: 'Carlos Rivas',
      email: 'carlos.rivas@gymbooking.com',
      avatar_url: null,
    },
    gym: null,
  },
  {
    id: 'doc-003',
    organization_id: 'org-default',
    name: 'Dossier Comercial y Tarifas GymBooking 2026.pdf',
    storage_path: 'commercial/dossier_tarifas_2026.pdf',
    file_name: 'dossier_tarifas_2026.pdf',
    content_type: 'application/pdf',
    size_bytes: 1540000,
    category: 'commercial_proposals',
    visibility: 'all',
    description: 'Presentación ejecutiva para centros deportivos independientes y cadenas.',
    version: '1.0',
    contact_id: null,
    interaction_id: null,
    task_id: null,
    issue_id: null,
    is_demo: true,
    created_by: null,
    gym_id: null,
    owner_id: 'admin-01',
    created_at: '2026-09-20T14:00:00.000Z',
    owner: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
    gym: null,
  },
]

export async function getDocuments(
  filters?: DocumentFilters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
): Promise<DocumentWithRelations[]> {
  try {
    const supabase = getSupabase(client)

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

    if (!error && data && data.length > 0) {
      return data as DocumentWithRelations[]
    }
  } catch (err) {
    console.warn('Documents query notice (using fallback documents):', err)
  }

  // Fallback to sample documents
  let filtered = [...DEFAULT_DOCUMENTS]

  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter((d) => d.category === filters.category)
  }

  if (filters?.search && filters.search.trim() !== '') {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter((d) => d.name.toLowerCase().includes(s))
  }

  return filtered
}

export async function uploadDocument(
  file: File,
  metadata: DocumentInsert
): Promise<Document> {
  const supabase = getSupabase()

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
  const supabase = getSupabase()

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
  const supabase = getSupabase()

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
