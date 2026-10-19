import { requireAuth } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import { TeamPageClient } from '@/components/team/TeamPageClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Equipo',
  description: 'Gestión de miembros y permisos del equipo en GymBooking',
}

export default async function TeamPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const membersPromise = supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('created_at', { ascending: true })

  const invitationsPromise =
    user.role === 'admin'
      ? supabase
          .from('invitations')
          .select('*')
          .eq('organization_id', user.organization_id)
          .is('accepted_at', null)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] })

  const [{ data: members }, { data: invitations }] = await Promise.all([
    membersPromise,
    invitationsPromise,
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <TeamPageClient
        initialMembers={members || []}
        initialInvitations={invitations || []}
        currentUser={user}
      />
    </div>
  )
}
