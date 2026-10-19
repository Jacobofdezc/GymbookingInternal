import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

// GET /api/invitations/[id]
// Used to validate an invitation by token string (the token is passed as [id] segment)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: token } = await params

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Token de invitación no proporcionado.' },
        { status: 400 }
      )
    }

    const supabase = await createAdminClient()

    const { data: invitation, error } = await supabase
      .from('invitations')
      .select('id, email, role, token, expires_at, accepted_at, organizations(name)')
      .eq('token', token)
      .maybeSingle()

    if (error || !invitation) {
      return NextResponse.json(
        { valid: false, error: 'Invitación no encontrada o enlace inválido.' },
        { status: 404 }
      )
    }

    if (invitation.accepted_at) {
      return NextResponse.json(
        { valid: false, error: 'Esta invitación ya ha sido aceptada.', alreadyAccepted: true },
        { status: 410 }
      )
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: 'Esta invitación ha expirado. Solicita una nueva al administrador.', expired: true },
        { status: 410 }
      )
    }

    const orgName =
      (invitation.organizations as unknown as { name: string } | null)?.name ??
      'GymBooking Internal'

    return NextResponse.json({
      valid: true,
      invitation: {
        email: invitation.email,
        role: invitation.role,
        organizationName: orgName,
        expiresAt: invitation.expires_at,
      },
    })
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Error del servidor al verificar la invitación.' },
      { status: 500 }
    )
  }
}

// DELETE /api/invitations/[id] — revoke invitation by UUID (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden revocar invitaciones' },
        { status: 403 }
      )
    }

    const adminClient = await createAdminClient()
    const { error } = await adminClient
      .from('invitations')
      .delete()
      .eq('id', id)
      .eq('organization_id', profile.organization_id)

    if (error) {
      return NextResponse.json(
        { error: `Error al revocar invitación: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'Invitación revocada correctamente' })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
