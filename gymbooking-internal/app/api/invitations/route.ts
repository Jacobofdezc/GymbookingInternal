import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { UserRole } from '@/types/database'

const VALID_ROLES: UserRole[] = ['admin', 'commercial', 'operations', 'viewer']

export async function POST(req: Request) {
  try {
    // 1. Verify caller is authenticated and admin
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden enviar invitaciones' },
        { status: 403 }
      )
    }

    // 2. Parse body
    const body = await req.json()
    const email = (body.email || '').trim().toLowerCase()
    const role = body.role as UserRole

    // 3. Validate
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Por favor, proporciona un correo electrónico válido' },
        { status: 400 }
      )
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: 'El rol seleccionado no es válido' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()

    // 4. Check if email already has account
    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      return NextResponse.json(
        { error: 'Ya existe una cuenta activa con este correo electrónico' },
        { status: 400 }
      )
    }

    // Check if there is an active pending invitation
    const { data: existingInvite } = await adminClient
      .from('invitations')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .eq('email', email)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existingInvite) {
      return NextResponse.json(
        { error: 'Ya existe una invitación pendiente para este correo' },
        { status: 400 }
      )
    }

    // 5. Create invitation record in DB
    const { data: invitation, error: inviteDbError } = await adminClient
      .from('invitations')
      .insert({
        organization_id: profile.organization_id,
        email,
        role,
        invited_by: profile.id,
      })
      .select()
      .single()

    if (inviteDbError) {
      return NextResponse.json(
        { error: `Error al crear invitación: ${inviteDbError.message}` },
        { status: 500 }
      )
    }

    // 6. Send magic link via admin client
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const { error: inviteAuthError } =
      await adminClient.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${appUrl}/auth/callback?redirectTo=/dashboard`,
      })

    if (inviteAuthError) {
      // Return success with warning note
      return NextResponse.json({
        success: true,
        invitation,
        warning: `Invitación guardada pero el email falló: ${inviteAuthError.message}`,
      })
    }

    // 7. Return success
    return NextResponse.json({
      success: true,
      invitation,
      message: `Invitación enviada correctamente a ${email}`,
    })
  } catch (error) {
    console.error('Error in POST /api/invitations:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor al procesar la invitación' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
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
        { error: 'Solo los administradores pueden consultar las invitaciones' },
        { status: 403 }
      )
    }

    const { data: invitations, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .is('accepted_at', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ invitations: invitations || [] })
  } catch (error) {
    console.error('Error in GET /api/invitations:', error)
    return NextResponse.json(
      { error: 'Error al obtener las invitaciones' },
      { status: 500 }
    )
  }
}
