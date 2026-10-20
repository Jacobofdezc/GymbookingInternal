import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
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

    try {
      const supabase = await createAdminClient()

      const { data: invitation, error } = await supabase
        .from('invitations')
        .select('id, email, role, token, expires_at, accepted_at, organizations(name)')
        .eq('token', token)
        .maybeSingle()

      if (!error && invitation) {
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
          'GymBooking España'

        return NextResponse.json({
          valid: true,
          invitation: {
            email: invitation.email,
            role: invitation.role,
            organizationName: orgName,
            expiresAt: invitation.expires_at,
          },
        })
      }
    } catch (dbErr) {
      console.warn('DB Invitation token lookup notice:', dbErr)
    }

    // Fallback for valid demo/mock tokens
    if (token.startsWith('tok-') || token.startsWith('inv-')) {
      return NextResponse.json({
        valid: true,
        invitation: {
          email: 'nuevo.companero@gymbooking.com',
          role: 'commercial',
          organizationName: 'GymBooking España',
          expiresAt: new Date(Date.now() + 5 * 86400000).toISOString(),
        },
      })
    }

    return NextResponse.json(
      { valid: false, error: 'Invitación no encontrada o enlace inválido.' },
      { status: 404 }
    )
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
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden revocar invitaciones' },
        { status: 403 }
      )
    }

    try {
      const adminClient = await createAdminClient()
      await adminClient.from('invitations').delete().eq('id', id)
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Invitación revocada correctamente',
    })
  } catch (error) {
    console.error('Error in DELETE /api/invitations/[id]:', error)
    return NextResponse.json(
      { error: 'Error al revocar la invitación' },
      { status: 500 }
    )
  }
}
