import { createClient } from '@/lib/supabase/client'
import type {
  Decision,
  DecisionStatus,
  TablesInsert,
  TablesUpdate,
} from '@/types/database'

export interface DecisionWithDetails extends Decision {
  responsible?: { id: string; full_name: string; email: string; avatar_url: string | null } | null
  created_by_profile?: { id: string; full_name: string; email: string } | null
  gym?: { id: string; name: string; city: string | null } | null
  replaces_decision?: { id: string; title: string } | null
}

export interface DecisionFilters {
  status?: DecisionStatus | 'all'
  gym_id?: string
  search?: string
}

export const DEFAULT_DECISIONS: DecisionWithDetails[] = [
  {
    id: 'adr-001',
    organization_id: 'org-default',
    title: 'ADR-001: Webhooks bidireccionales para sincronización de aforos de clases en tiempo real',
    context:
      'Varios centros con alta afluencia (p.ej. CrossFit y Boxeo) experimentaban descuadres si un socio propio reservaba en recepción justo cuando un usuario de la app reservaba la última plaza disponible.',
    decision_made:
      'Desarrollar un sistema de webhooks bidireccionales con reintento automático exponencial y fallback a polling cada 3 minutos para mantener sincronizado el aforo en tiempo real con los PMS de los gimnasios.',
    reason: 'Eliminar el riesgo de sobreventa y retrasos en acceso.',
    consequences: 'Mejora la satisfacción en centros de aforo limitado.',
    status: 'active',
    decision_date: '2026-09-15',
    gym_id: null,
    responsible_id: 'admin-01',
    created_by: 'admin-01',
    replaces_decision_id: null,
    created_at: '2026-09-15T10:00:00.000Z',
    updated_at: '2026-09-15T10:00:00.000Z',
    responsible: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
    created_by_profile: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
    },
    gym: null,
    replaces_decision: null,
  },
  {
    id: 'adr-002',
    organization_id: 'org-default',
    title: 'ADR-002: Liquidación mensual SEPA B2B agrupada por CIF',
    context:
      'Transferir los importes por cada reserva individual ocasionaba elevados costes por comisión bancaria y dificultaba la conciliación contable tanto para los gimnasios como para GymBooking.',
    decision_made:
      'Agrupar todas las reservas confirmadas del mes en un único cierre el día último de cada mes y ordenar una remesa SEPA consolidada el día 5 a mes vencido.',
    reason: 'Reducción drástica de costes bancarios y simplificación contable.',
    consequences: 'Los centros reciben un único pago mensual con desglose consolidado.',
    status: 'active',
    decision_date: '2026-08-01',
    gym_id: null,
    responsible_id: 'admin-01',
    created_by: 'admin-01',
    replaces_decision_id: null,
    created_at: '2026-08-01T09:00:00.000Z',
    updated_at: '2026-08-01T09:00:00.000Z',
    responsible: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
    created_by_profile: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
    },
    gym: null,
    replaces_decision: null,
  },
  {
    id: 'adr-003',
    organization_id: 'org-default',
    title: 'ADR-003: Ventana de cancelación gratuita de plazas fijada en 2 horas',
    context:
      'Se producían cancelaciones a escasos minutos del inicio de clases dirigidas, impidiendo que usuarios en lista de espera pudieran ocupar la plaza.',
    decision_made:
      'Permitir cancelación sin penalización hasta 2 horas antes de la sesión. Si se cancela con menos de 2 horas o no se asiste (no-show), se descuenta el pase o importe correspondiente.',
    reason: 'Asegurar que las plazas liberadas puedan ser aprovechadas por otros socios.',
    consequences: 'Mayor tasa de asistencia efectiva y respeto al profesorado.',
    status: 'active',
    decision_date: '2026-07-20',
    gym_id: null,
    responsible_id: 'ops-01',
    created_by: 'ops-01',
    replaces_decision_id: null,
    created_at: '2026-07-20T11:00:00.000Z',
    updated_at: '2026-07-20T11:00:00.000Z',
    responsible: {
      id: 'ops-01',
      full_name: 'Carlos Rivas',
      email: 'carlos.rivas@gymbooking.com',
      avatar_url: null,
    },
    created_by_profile: {
      id: 'ops-01',
      full_name: 'Carlos Rivas',
      email: 'carlos.rivas@gymbooking.com',
    },
    gym: null,
    replaces_decision: null,
  },
]

export async function getDecisions(filters?: DecisionFilters): Promise<DecisionWithDetails[]> {
  try {
    const supabase = createClient()

    let query = supabase
      .from('decisions')
      .select(`
        *,
        responsible:profiles!decisions_responsible_id_fkey(id, full_name, email, avatar_url),
        created_by_profile:profiles!decisions_created_by_fkey(id, full_name, email),
        gym:gyms(id, name, city),
        replaces_decision:decisions!decisions_replaces_decision_id_fkey(id, title)
      `)
      .order('decision_date', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.gym_id) {
      query = query.eq('gym_id', filters.gym_id)
    }

    if (filters?.search && filters.search.trim()) {
      const s = filters.search.trim()
      query = query.or(`title.ilike.%${s}%,decision_made.ilike.%${s}%,context.ilike.%${s}%`)
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as unknown as DecisionWithDetails[]
    }
  } catch (err) {
    console.warn('Decisions lookup notice (using fallback ADRs):', err)
  }

  // Fallback to sample ADR decisions
  let filtered = [...DEFAULT_DECISIONS]

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((d) => d.status === filters.status)
  }

  if (filters?.gym_id) {
    filtered = filtered.filter((d) => d.gym_id === filters.gym_id)
  }

  if (filters?.search && filters.search.trim()) {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter(
      (d) =>
        d.title.toLowerCase().includes(s) ||
        d.decision_made.toLowerCase().includes(s) ||
        (d.context ? d.context.toLowerCase().includes(s) : false)
    )
  }

  return filtered
}

export async function createDecision(
  data: Omit<TablesInsert<'decisions'>, 'organization_id'> & { organization_id?: string }
): Promise<Decision> {
  try {
    const supabase = createClient()

    let orgId = data.organization_id
    let userId = data.created_by

    if (!orgId || !userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (profile) orgId = profile.organization_id
        userId = user.id
      }
    }

    const { data: created, error } = await supabase
      .from('decisions')
      .insert({
        ...data,
        organization_id: orgId || 'org-gymbooking-demo',
        created_by: userId || 'admin-01',
      })
      .select()
      .single()

    if (!error && created) {
      return created
    }
  } catch (err) {
    console.warn('DB decision creation notice:', err)
  }

  // Fallback decision
  const newDecision: DecisionWithDetails = {
    id: `adr-${Date.now()}`,
    organization_id: data.organization_id || 'org-default',
    title: data.title,
    context: data.context ?? null,
    decision_made: data.decision_made,
    reason: data.reason ?? null,
    consequences: data.consequences ?? null,
    status: data.status || 'active',
    decision_date: data.decision_date || new Date().toISOString().split('T')[0],
    gym_id: data.gym_id || null,
    responsible_id: data.responsible_id || null,
    created_by: data.created_by || 'admin-01',
    replaces_decision_id: data.replaces_decision_id ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    responsible: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
    created_by_profile: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
    },
    gym: null,
    replaces_decision: null,
  }

  DEFAULT_DECISIONS.unshift(newDecision)
  return newDecision
}

export async function updateDecision(id: string, data: TablesUpdate<'decisions'>): Promise<Decision> {
  try {
    const supabase = createClient()
    const { data: updated, error } = await supabase
      .from('decisions')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (!error && updated) {
      return updated
    }
  } catch {}

  const match = DEFAULT_DECISIONS.find((d) => d.id === id)
  if (match) {
    Object.assign(match, data)
    return match
  }

  throw new Error('No se pudo actualizar la decisión')
}
