import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { SettingsClient } from '@/components/settings/SettingsClient'
import { getAuditLogs, AuditLogWithActor } from '@/services/audit/audit.service'
import type { Metadata } from 'next'
import type { Organization, CommercialStatus, OnboardingStatus, Discipline } from '@/types/database'

export const metadata: Metadata = {
  title: 'Configuración',
  description: 'Configuración general de GymBooking CRM',
}

const DEFAULT_COMMERCIAL_STATUSES: CommercialStatus[] = [
  { id: 'comm-1', organization_id: 'org-default', name: 'Identificado', slug: 'identified', color: '#64748B', sort_order: 1, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
  { id: 'comm-2', organization_id: 'org-default', name: 'Primer Contacto', slug: 'contacted', color: '#3B82F6', sort_order: 2, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
  { id: 'comm-3', organization_id: 'org-default', name: 'Reunión Realizada', slug: 'meeting_done', color: '#8B5CF6', sort_order: 3, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
  { id: 'comm-4', organization_id: 'org-default', name: 'Propuesta Enviada', slug: 'proposal_sent', color: '#F59E0B', sort_order: 4, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
  { id: 'comm-5', organization_id: 'org-default', name: 'Negociación Contractual', slug: 'negotiating', color: '#EC4899', sort_order: 5, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
  { id: 'comm-6', organization_id: 'org-default', name: 'Acuerdo Firmado', slug: 'confirmed', color: '#10B981', sort_order: 6, is_active: true, is_pipeline_stage: true, created_at: new Date().toISOString() },
]

const DEFAULT_ONBOARDING_STATUSES: OnboardingStatus[] = [
  { id: 'onb-1', organization_id: 'org-default', name: 'Pendiente de Documentación', slug: 'pending', color: '#64748B', sort_order: 1, is_active: true, created_at: new Date().toISOString() },
  { id: 'onb-2', organization_id: 'org-default', name: 'Integración Técnica en Curso', slug: 'in_progress', color: '#3B82F6', sort_order: 2, is_active: true, created_at: new Date().toISOString() },
  { id: 'onb-3', organization_id: 'org-default', name: 'Publicado & En Producción', slug: 'active', color: '#10B981', sort_order: 3, is_active: true, created_at: new Date().toISOString() },
]

const DEFAULT_DISCIPLINES: Discipline[] = [
  { id: 'disc-1', organization_id: 'org-default', name: 'CrossFit & Funcional', slug: 'crossfit', created_at: new Date().toISOString() },
  { id: 'disc-2', organization_id: 'org-default', name: 'Pilates Reformer & Mat', slug: 'pilates', created_at: new Date().toISOString() },
  { id: 'disc-3', organization_id: 'org-default', name: 'Boxeo sin contacto', slug: 'boxing', created_at: new Date().toISOString() },
  { id: 'disc-4', organization_id: 'org-default', name: 'Sala de Fitness & Musculación', slug: 'fitness', created_at: new Date().toISOString() },
  { id: 'disc-5', organization_id: 'org-default', name: 'Cycling Indoor / Spin', slug: 'cycling', created_at: new Date().toISOString() },
  { id: 'disc-6', organization_id: 'org-default', name: 'Yoga Vinyasa & Hatha', slug: 'yoga', created_at: new Date().toISOString() },
]

export default async function SettingsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  let org: Organization | null = null
  let comm: CommercialStatus[] = []
  let onb: OnboardingStatus[] = []
  let disc: Discipline[] = []

  try {
    const orgPromise = supabase
      .from('organizations')
      .select('*')
      .eq('id', user.organization_id)
      .maybeSingle()

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

    const [orgRes, commRes, onbRes, discRes] = await Promise.all([
      orgPromise,
      commPromise,
      onbPromise,
      discPromise,
    ])

    org = orgRes.data
    comm = commRes.data || []
    onb = onbRes.data || []
    disc = discRes.data || []
  } catch (err) {
    console.warn('Settings load notice:', err)
  }

  // Fallbacks if database is empty or demo mode
  const effectiveOrg: Organization = org || {
    id: user.organization_id || 'org-gymbooking-demo',
    name: 'GymBooking España',
    slug: 'gymbooking-spain',
    created_at: new Date().toISOString(),
  }

  const effectiveComm = comm.length > 0 ? comm : DEFAULT_COMMERCIAL_STATUSES
  const effectiveOnb = onb.length > 0 ? onb : DEFAULT_ONBOARDING_STATUSES
  const effectiveDisc = disc.length > 0 ? disc : DEFAULT_DISCIPLINES

  // If user is admin, fetch initial audit logs and team members
  let initialAuditLogs: AuditLogWithActor[] = []
  let teamMembers: Array<{ id: string; full_name: string; email: string }> = []

  if (user.role === 'admin') {
    try {
      const [logs, { data: members }] = await Promise.all([
        getAuditLogs({ limit: 50 }, supabase).catch(() => []),
        supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', user.organization_id)
          .order('full_name'),
      ])
      initialAuditLogs = logs
      teamMembers = members || [
        { id: user.id, full_name: user.full_name, email: user.email },
      ]
    } catch (err) {
      console.warn('Could not load initial audit logs:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <SettingsClient
        currentUser={user}
        organization={effectiveOrg}
        initialCommercialStatuses={effectiveComm}
        initialOnboardingStatuses={effectiveOnb}
        initialDisciplines={effectiveDisc}
        initialAuditLogs={initialAuditLogs}
        teamMembers={teamMembers}
      />
    </div>
  )
}
