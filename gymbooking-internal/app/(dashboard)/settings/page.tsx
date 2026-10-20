import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { getAuditLogs, AuditLogWithActor } from '@/services/audit/audit.service'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Configuración general de GymBooking CRM',
}

export default async function SettingsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const orgPromise = supabase
    .from('organizations')
    .select('*')
    .eq('id', user.organization_id)
    .single()

  const commPromise = supabase
    .from('commercial_statuses')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('sort_order', { ascending: true })

  const onbPromise = supabase
    .from('onboarding_statuses')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('sort_order', { ascending: true })

  const discPromise = supabase
    .from('disciplines')
    .select('*')
    .eq('organization_id', user.organization_id)
    .order('name', { ascending: true })

  const [{ data: org }, { data: comm }, { data: onb }, { data: disc }] =
    await Promise.all([orgPromise, commPromise, onbPromise, discPromise])

  if (!org) {
    redirect('/login')
  }

  // If user is admin, fetch initial audit logs and team members
  let initialAuditLogs: AuditLogWithActor[] = []
  let teamMembers: Array<{ id: string; full_name: string; email: string }> = []

  if (user.role === 'admin') {
    try {
      const [logs, { data: members }] = await Promise.all([
        getAuditLogs({ limit: 50 }, supabase),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', user.organization_id)
          .order('full_name'),
      ])
      initialAuditLogs = logs
      teamMembers = members || []
    } catch (err) {
      console.warn('Could not load initial audit logs:', err)
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <SettingsClient
        currentUser={user}
        organization={org}
        initialCommercialStatuses={comm || []}
        initialOnboardingStatuses={onb || []}
        initialDisciplines={disc || []}
        initialAuditLogs={initialAuditLogs}
        teamMembers={teamMembers}
      />
    </div>
  )
}
