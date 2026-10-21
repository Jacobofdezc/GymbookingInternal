import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { DocumentCategory } from '@/types/database'

interface Params {
  params: Promise<{ token: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token: gymId } = await params
    const adminSupabase = await createAdminClient()

    // 1. Validate gym
    const { data: gym, error: gymError } = await adminSupabase
      .from('gyms')
      .select('id, name, organization_id')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
    }

    // 2. Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const categoryInput = (formData.get('category') as string) || 'gym_info'
    const name = (formData.get('name') as string) || file?.name || 'Archivo del gimnasio'

    if (!file) {
      return NextResponse.json({ error: 'No se ha adjuntado ningún archivo' }, { status: 400 })
    }

    // Map portal categories to DocumentCategory
    let category: DocumentCategory = 'gym_info'
    if (categoryInput === 'photos' || categoryInput === 'logo') {
      category = 'gym_info'
    } else if (categoryInput === 'contract') {
      category = 'agreements'
    } else {
      category = 'onboarding_material'
    }

    // 3. Upload to Supabase Storage bucket 'documents'
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const storagePath = `gyms/${gym.id}/portal_${Date.now()}_${cleanFileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await adminSupabase.storage
      .from('documents')
      .upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
    }

    // 4. Get public URL
    const { data: publicUrlData } = adminSupabase.storage
      .from('documents')
      .getPublicUrl(storagePath)

    // 5. Insert record in 'documents' table
    const { data: newDoc, error: docError } = await adminSupabase
      .from('documents')
      .insert({
        organization_id: gym.organization_id,
        gym_id: gym.id,
        name: name,
        category: category,
        storage_path: storagePath,
        file_name: cleanFileName,
        size_bytes: file.size,
        content_type: file.type,
        visibility: 'all',
      })
      .select()
      .single()

    if (docError) {
      console.error('Doc insert error:', docError)
      return NextResponse.json({ error: docError.message }, { status: 500 })
    }

    // 6. Record interaction & audit log in the CRM
    await adminSupabase.from('audit_logs').insert({
      organization_id: gym.organization_id,
      entity_type: 'documents',
      entity_id: newDoc.id,
      action: 'portal_upload',
      new_values: {
        gym_name: gym.name,
        document_name: name,
        category,
        uploaded_by: 'Dueño del Gimnasio (Portal)',
      },
    })

    return NextResponse.json({
      success: true,
      document: newDoc,
      publicUrl: publicUrlData.publicUrl,
    })
  } catch (err: any) {
    console.error('Portal upload route error:', err)
    return NextResponse.json({ error: err.message || 'Error al subir el archivo' }, { status: 500 })
  }
}
