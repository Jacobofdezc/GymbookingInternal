import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

interface Params {
  params: Promise<{ token: string }>
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { token: gymId } = await params
    const adminSupabase = await createAdminClient()

    const { data: gym, error: gymError } = await adminSupabase
      .from('gyms')
      .select('id, name, organization_id, owner_id')
      .eq('id', gymId)
      .single()

    if (gymError || !gym) {
      return NextResponse.json({ error: 'Gimnasio no encontrado' }, { status: 404 })
    }

    const body = await req.json()
    const { action, comments, confirmedBy } = body

    if (action === 'approve_schedules') {
      // 1. Record interaction in CRM
      await adminSupabase.from('interactions').insert({
        organization_id: gym.organization_id,
        gym_id: gym.id,
        type: 'email',
        summary: `Aprobación de Horarios por el Gimnasio (Portal): El responsable del gimnasio (${confirmedBy || 'Dueño'}) ha revisado y aprobado las clases y horarios publicados en el portal.`,
        next_step: 'Proceder a activación final en app',
        registered_by: gym.owner_id || null,
        interaction_date: new Date().toISOString(),
      })

      // 2. Mark onboarding item "Clases revisadas" as completed if exists
      await adminSupabase
        .from('gym_onboarding_items')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          comment: `Aprobado por el cliente desde el portal web el ${new Date().toLocaleDateString('es-ES')}`,
        })
        .eq('gym_id', gym.id)
        .ilike('title', '%Clases revisadas%')

      // 3. Audit log
      await adminSupabase.from('audit_logs').insert({
        organization_id: gym.organization_id,
        entity_type: 'gyms',
        entity_id: gym.id,
        action: 'portal_schedule_approval',
        new_values: {
          gym_name: gym.name,
          confirmed_by: confirmedBy,
        },
      })

      return NextResponse.json({ success: true, message: 'Horarios confirmados con éxito' })
    }

    if (action === 'send_comment') {
      if (!comments || !comments.trim()) {
        return NextResponse.json({ error: 'El comentario no puede estar vacío' }, { status: 400 })
      }

      await adminSupabase.from('interactions').insert({
        organization_id: gym.organization_id,
        gym_id: gym.id,
        type: 'internal_note',
        summary: `[Mensaje recibido desde el Portal por ${confirmedBy || 'Dueño'}]: ${comments.trim()}`,
        next_step: 'Revisar petición del cliente',
        registered_by: gym.owner_id || null,
        interaction_date: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, message: 'Comentario enviado a tu asesor de GymBooking' })
    }

    return NextResponse.json({ error: 'Acción no reconocida' }, { status: 400 })
  } catch (err: any) {
    console.error('Portal feedback route error:', err)
    return NextResponse.json({ error: err.message || 'Error al procesar la solicitud' }, { status: 500 })
  }
}
