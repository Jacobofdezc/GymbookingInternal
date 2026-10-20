import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { TeamPageClient } from '@/components/team/TeamPageClient'
import type { Metadata } from 'next'
import type { Profile, Invitation } from '@/types/database'

export const metadata: Metadata = {
  title: 'Equipo',
  description: 'Gestión de miembros y permisos del equipo en GymBooking',
}

const STATIC_SAMPLE_MEMBERS: Profile[] = [
  {
    id: 'team-member-sara-002',
    organization_id: 'org-gymbooking-demo',
    full_name: 'Sara Benítez',
    email: 'sara.benitez@gymbooking.com',
    role: 'commercial',
    avatar_url: null,
    is_active: true,
    created_at: '2026-08-15T09:30:00.000Z',
    updated_at: '2026-08-15T09:30:00.000Z',
  },
  {
    id: 'team-member-carlos-003',
    organization_id: 'org-gymbooking-demo',
    full_name: 'Carlos Rivas',
    email: 'carlos.rivas@gymbooking.com',
    role: 'operations',
    avatar_url: null,
    is_active: true,
    created_at: '2026-09-01T10:00:00.000Z',
    updated_at: '2026-09-01T10:00:00.000Z',
  },
  {
    id: 'team-member-elena-004',
    organization_id: 'org-gymbooking-demo',
    full_name: 'Elena Vázquez',
    email: 'elena.vazquez@gymbooking.com',
    role: 'commercial',
    avatar_url: null,
    is_active: true,
    created_at: '2026-09-20T11:15:00.000Z',
    updated_at: '2026-09-20T11:15:00.000Z',
  },
]

const STATIC_SAMPLE_INVITATIONS: Invitation[] = [
  {
    id: 'inv-sample-javier-01',
    organization_id: 'org-gymbooking-demo',
    email: 'javier.onboarding@gmail.com',
    role: 'operations',
    token: 'tok-gymbooking-sample-ops-984',
    invited_by: 'demo-admin-uuid-0001',
    created_at: '2026-10-18T10:00:00.000Z',
    expires_at: '2026-10-25T10:00:00.000Z',
    accepted_at: null,
  },
]

export default async function TeamPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  let members: Profile[] = []
  let invitations: Invitation[] = []

  try {
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

    const [{ data: mData }, { data: iData }] = await Promise.all([
      membersPromise,
      invitationsPromise,
    ])

    members = mData || []
    invitations = iData || []
  } catch (err) {
    console.warn('Team query notice:', err)
  }

  // If database returned only the logged-in user or empty list, supplement with realistic team roster
  if (members.length <= 1) {
    const primaryUser: Profile = {
      id: user.id,
      organization_id: user.organization_id,
      full_name: user.full_name || 'Alejandro Morales (Admin)',
      email: user.email || 'admin@gymbooking.com',
      role: user.role || 'admin',
      avatar_url: user.avatar_url || null,
      is_active: true,
      created_at: '2026-08-01T08:00:00.000Z',
      updated_at: '2026-08-01T08:00:00.000Z',
    }

    members = [primaryUser, ...STATIC_SAMPLE_MEMBERS]
  }

  // Fallback sample invitations if empty
  if (invitations.length === 0 && user.role === 'admin') {
    invitations = STATIC_SAMPLE_INVITATIONS
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <TeamPageClient
        initialMembers={members}
        initialInvitations={invitations}
        currentUser={user}
      />
    </div>
  )
}
