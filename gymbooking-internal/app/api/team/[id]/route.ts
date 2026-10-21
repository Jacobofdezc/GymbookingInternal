import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'
import { NextResponse, type NextRequest } from 'next/server'

interface Params {
  params: Promise<{ id: string }>
}

/**
 * DELETE /api/team/[id]
 * Allows an admin to remove a team member from their organization.
 */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const { id: memberId } = await params
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Solo los administradores pueden eliminar miembros de la organización' },
        { status: 403 }
      )
    }

    if (currentUser.id === memberId) {
      return NextResponse.json(
        { error: 'No puedes eliminarte a ti mismo de la organización' },
        { status: 400 }
      )
    }

    const adminClient = await createAdminClient()

    // 1. Fetch target profile
    const { data: targetProfile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, full_name, email, organization_id, role')
      .eq('id', memberId)
      .single()

    if (profileError || !targetProfile) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    if (targetProfile.organization_id !== currentUser.organization_id) {
      return NextResponse.json(
        { error: 'El usuario no pertenece a tu organización' },
        { status: 403 }
      )
    }

    // 2. Unassign member from dependent records to prevent orphan/broken relations
    await Promise.all([
      adminClient.from('gyms').update({ owner_id: null }).eq('owner_id', memberId),
      adminClient.from('gyms').update({ onboarding_owner_id: null }).eq('onboarding_owner_id', memberId),
      adminClient.from('tasks').update({ assignee_id: null }).eq('assignee_id', memberId),
      adminClient.from('issues').update({ assignee_id: null }).eq('assignee_id', memberId),
      adminClient.from('gym_onboarding_items').update({ assignee_id: null }).eq('assignee_id', memberId),
    ])

    // 3. Unlink user from the organization and deactivate
    // We update is_active: false and set role to viewer, or delete profile row
    const { error: deleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', memberId)

    if (deleteError) {
      // If cascade delete failed due to other foreign keys, gracefully deactivate and unlink
      console.warn('Could not hard delete profile, falling back to unlink and deactivation:', deleteError.message)
      await adminClient
        .from('profiles')
        .update({
          is_active: false,
          role: 'viewer',
        })
        .eq('id', memberId)
    }

    // 4. Audit log
    await adminClient.from('audit_logs').insert({
      organization_id: currentUser.organization_id,
      entity_type: 'profiles',
      entity_id: memberId,
      action: 'remove_team_member',
      new_values: {
        removed_member_name: targetProfile.full_name,
        removed_member_email: targetProfile.email,
        removed_by_id: currentUser.id,
        removed_by_name: currentUser.full_name,
      },
    })

    return NextResponse.json({
      success: true,
      message: `El miembro ${targetProfile.full_name} ha sido eliminado de la organización correctamente.`,
    })
  } catch (err: any) {
    console.error('Error removing team member:', err)
    return NextResponse.json(
      { error: err.message || 'Error al eliminar miembro de la organización' },
      { status: 500 }
    )
  }
}
