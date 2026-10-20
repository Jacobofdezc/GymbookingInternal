import { createClient } from '@/lib/supabase/client'

export interface SeedResult {
  gymsCount: number
  contactsCount: number
  tasksCount: number
  interactionsCount: number
  issuesCount: number
}

/**
 * Seeds a realistic set of Spanish gyms, contacts, pipeline stages,
 * tasks, and issues into the active user's organization.
 */
export async function seedDemoDataForOrganization(): Promise<SeedResult> {
  const supabase = createClient()

  // 1. Get current authenticated user and profile
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Debes estar autenticado para cargar datos de demostración.')
  }

  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('id, organization_id, full_name')
    .eq('id', user.id)
    .single()

  if (profileErr || !profile?.organization_id) {
    throw new Error('No se pudo verificar la organización del usuario.')
  }

  const orgId = profile.organization_id
  const userId = profile.id

  // 2. Fetch commercial and onboarding statuses
  const [commRes, onbRes] = await Promise.all([
    supabase
      .from('commercial_statuses')
      .select('id, slug, name')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('onboarding_statuses')
      .select('id, slug, name')
      .eq('organization_id', orgId)
      .order('sort_order', { ascending: true }),
  ])

  const commMap = new Map((commRes.data || []).map((s) => [s.slug, s.id]))
  const onbMap = new Map((onbRes.data || []).map((s) => [s.slug, s.id]))

  // Fallback to first available status if specific slug doesn't exist
  const firstCommId = commRes.data?.[0]?.id || null
  const firstOnbId = onbRes.data?.[0]?.id || null

  const today = new Date()
  const formatDate = (offsetDays: number) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offsetDays)
    return d.toISOString().split('T')[0]
  }

  // Sample Gym Definitions
  const demoGyms = [
    {
      name: 'FitClub Chamberí',
      legal_name: 'Fitness Chamberí SL',
      city: 'Madrid',
      address: 'Calle de Santa Engracia, 45',
      postal_code: '28010',
      phone: '+34 914 552 101',
      email: 'contacto@fitclubchamberi.es',
      priority: 'high' as const,
      commercial_status_id: commMap.get('meeting_done') || firstCommId,
      onboarding_status_id: onbMap.get('pending') || firstOnbId,
      next_followup_date: formatDate(1),
      next_action: 'Presentar propuesta económica con descuento anual',
      notes: 'Centro premium de 800m2 con alta demanda de pilates y funcional.',
      contact: {
        full_name: 'Roberto Gómez Martínez',
        job_title: 'Director General & Socio',
        email: 'roberto@fitclubchamberi.es',
        phone: '+34 611 223 344',
        is_decision_maker: 'yes' as const,
      },
      task: {
        title: 'Enviar borrador de propuesta comercial ajustada',
        priority: 'high' as const,
        due_date: formatDate(1),
      },
      interaction: {
        type: 'meeting_in_person' as const,
        summary: 'Reunión inicial en el centro con el director',
        notes: 'Muy receptivo a la integración con el sistema de reservas. Piden 15 días de prueba.',
      },
    },
    {
      name: 'Brooklyn Fitboxing Retiro',
      legal_name: 'Retiro Boxing Studio SL',
      city: 'Madrid',
      address: 'Avenida de Menéndez Pelayo, 67',
      postal_code: '28009',
      phone: '+34 915 223 440',
      email: 'retiro@brooklynfitboxing.com',
      priority: 'urgent' as const,
      commercial_status_id: commMap.get('agreement_signed') || commMap.get('agreement_sent') || firstCommId,
      onboarding_status_id: onbMap.get('in_progress') || firstOnbId,
      next_followup_date: formatDate(2),
      next_action: 'Verificar integración del sistema de reservas de sacos',
      notes: 'Franquicia especializada en boxeo sin contacto. Acuerdo cerrado al 12% de comisión.',
      contact: {
        full_name: 'Laura Méndez Casado',
        job_title: 'Gerente de Centro',
        email: 'lmendez@bfbretiro.com',
        phone: '+34 622 334 455',
        is_decision_maker: 'yes' as const,
      },
      task: {
        title: 'Revisar subida del catálogo de clases de boxeo',
        priority: 'urgent' as const,
        due_date: formatDate(0),
      },
      interaction: {
        type: 'video_call' as const,
        summary: 'Videollamada de onboarding técnico',
        notes: 'Explicado el panel de reservas. Nos pasan los horarios definitivos mañana.',
      },
    },
    {
      name: 'McFit Goya',
      legal_name: 'RSG Group España SL',
      city: 'Madrid',
      address: 'Calle de Alcalá, 112',
      postal_code: '28009',
      phone: '+34 917 819 020',
      email: 'goya@mcfit.com',
      priority: 'medium' as const,
      commercial_status_id: commMap.get('active') || firstCommId,
      onboarding_status_id: onbMap.get('completed') || firstOnbId,
      next_followup_date: formatDate(7),
      next_action: 'Revisión mensual de volumen de reservas',
      notes: 'Cadena con más de 2.000 socios activos. Alta conversión.',
      contact: {
        full_name: 'Carlos Santillana',
        job_title: 'Coordinador de Instalación',
        email: 'csantillana@mcfit.es',
        phone: '+34 633 445 566',
        is_decision_maker: 'no' as const,
      },
      issue: {
        title: 'Descuadre en sincronización de aforo en horas punta',
        description: 'Varios usuarios reportan que la app marca clase llena cuando quedan 3 plazas.',
        type: 'technical_error' as const,
        priority: 'medium' as const,
        status: 'in_progress' as const,
      },
      task: {
        title: 'Revisar webhook de aforo en tiempo real con RSG API',
        priority: 'medium' as const,
        due_date: formatDate(3),
      },
      interaction: {
        type: 'call' as const,
        summary: 'Llamada de seguimiento de incidencia técnica',
        notes: 'Coordinado con su departamento de soporte para reiniciar token de API.',
      },
    },
    {
      name: 'Crossfit Singular Box',
      legal_name: 'Singular Athletic Club SL',
      city: 'Madrid',
      address: 'Calle de López de Hoyos, 245',
      postal_code: '28043',
      phone: '+34 918 332 211',
      email: 'info@singularbox.es',
      priority: 'medium' as const,
      commercial_status_id: commMap.get('first_contact') || commMap.get('prospect') || firstCommId,
      onboarding_status_id: onbMap.get('pending') || firstOnbId,
      next_followup_date: formatDate(0),
      next_action: 'Llamada para agendar visita presencial',
      notes: 'Box oficial de CrossFit con 250 miembros y clases de halterofilia y gimnásticos.',
      contact: {
        full_name: 'Marc Soler Pujol',
        job_title: 'Head Coach & Propietario',
        email: 'marc@singularbox.es',
        phone: '+34 644 556 677',
        is_decision_maker: 'yes' as const,
      },
      task: {
        title: 'Llamar a Marc Soler para presentar modelo GymBooking',
        priority: 'medium' as const,
        due_date: formatDate(0),
      },
      interaction: {
        type: 'email' as const,
        summary: 'Email de contacto frío enviado con presentación',
        notes: 'Mostró interés en captar usuarios de paso en fines de semana.',
      },
    },
    {
      name: 'AltaFit Bernabéu',
      legal_name: 'AltaFit Gym Club SA',
      city: 'Madrid',
      address: 'Paseo de la Castellana, 130',
      postal_code: '28046',
      phone: '+34 919 044 550',
      email: 'bernabeu@altafit.es',
      priority: 'high' as const,
      commercial_status_id: commMap.get('proposal_sent') || firstCommId,
      onboarding_status_id: onbMap.get('pending') || firstOnbId,
      next_followup_date: formatDate(2),
      next_action: 'Resolver dudas sobre liquidación mensual',
      notes: 'Club de gran aforo. Pendientes de aprobación por comité central.',
      contact: {
        full_name: 'Carmen Navarro Blanco',
        job_title: 'Directora de Expansión',
        email: 'carmen.navarro@altafit.es',
        phone: '+34 655 667 788',
        is_decision_maker: 'yes' as const,
      },
      task: {
        title: 'Enviar anexo de condiciones de cobro SEPA mensual',
        priority: 'high' as const,
        due_date: formatDate(2),
      },
      interaction: {
        type: 'call' as const,
        summary: 'Llamada telefónica con Carmen Navarro',
        notes: 'Pide confirmar si la facturación es a mes vencido.',
      },
    },
    {
      name: 'VivaGym Las Tablas',
      legal_name: 'VivaGym Group España SL',
      city: 'Madrid',
      address: 'Paseo Tierra de Melide, 21',
      postal_code: '28050',
      phone: '+34 913 002 991',
      email: 'lastablas@vivagym.es',
      priority: 'medium' as const,
      commercial_status_id: commMap.get('negotiation') || firstCommId,
      onboarding_status_id: onbMap.get('pending') || firstOnbId,
      next_followup_date: formatDate(4),
      next_action: 'Revisión final de contrato con asesoría legal',
      notes: 'Gimnasio low-cost con área de entrenamiento funcional y cycling indoor.',
      contact: {
        full_name: 'David Vega',
        job_title: 'Responsable de Zona Madrid Norte',
        email: 'dvega@vivagym.es',
        phone: '+34 666 778 899',
        is_decision_maker: 'no' as const,
      },
      task: {
        title: 'Verificar exclusividad territorial en zona Las Tablas',
        priority: 'medium' as const,
        due_date: formatDate(4),
      },
      interaction: {
        type: 'video_call' as const,
        summary: 'Reunión de negociación contractual',
        notes: 'Aceptan las tarifas estándar pero solicitan revisión en 6 meses.',
      },
    },
  ]

  let gymsCount = 0
  let contactsCount = 0
  let tasksCount = 0
  let interactionsCount = 0
  let issuesCount = 0

  for (const item of demoGyms) {
    // 1. Insert gym
    const { data: gym, error: gymErr } = await supabase
      .from('gyms')
      .insert({
        organization_id: orgId,
        owner_id: userId,
        name: item.name,
        legal_name: item.legal_name,
        city: item.city,
        address: item.address,
        postal_code: item.postal_code,
        phone: item.phone,
        email: item.email,
        priority: item.priority,
        commercial_status_id: item.commercial_status_id,
        onboarding_status_id: item.onboarding_status_id,
        next_followup_date: item.next_followup_date,
        next_action: item.next_action,
        commercial_notes: item.notes,
      })
      .select('id')
      .single()

    if (gymErr || !gym) {
      console.warn('Error inserting demo gym:', gymErr?.message)
      continue
    }

    gymsCount++

    // 2. Insert primary contact
    if (item.contact) {
      const { error: contactErr } = await supabase.from('gym_contacts').insert({
        organization_id: orgId,
        gym_id: gym.id,
        full_name: item.contact.full_name,
        job_title: item.contact.job_title,
        email: item.contact.email,
        phone: item.contact.phone,
        is_primary: true,
        is_decision_maker: item.contact.is_decision_maker,
      })

      if (!contactErr) contactsCount++
    }

    // 3. Insert task
    if (item.task) {
      const { error: taskErr } = await supabase.from('tasks').insert({
        organization_id: orgId,
        gym_id: gym.id,
        assignee_id: userId,
        created_by: userId,
        title: item.task.title,
        priority: item.task.priority,
        status: 'pending',
        due_date: item.task.due_date,
      })

      if (!taskErr) tasksCount++
    }

    // 4. Insert interaction
    if (item.interaction) {
      const { error: interErr } = await supabase.from('interactions').insert({
        organization_id: orgId,
        gym_id: gym.id,
        registered_by: userId,
        type: item.interaction.type,
        interaction_date: new Date().toISOString(),
        summary: item.interaction.summary,
        outcome: 'successful',
      })

      if (!interErr) interactionsCount++
    }

    // 5. Insert issue if defined
    if ('issue' in item && item.issue) {
      const { error: issueErr } = await supabase.from('issues').insert({
        organization_id: orgId,
        gym_id: gym.id,
        created_by: userId,
        title: item.issue.title,
        description: item.issue.description,
        type: item.issue.type,
        priority: item.issue.priority,
        status: item.issue.status,
      })

      if (!issueErr) issuesCount++
    }
  }

  // Record audit log
  await supabase.from('audit_logs').insert({
    organization_id: orgId,
    actor_user_id: userId,
    entity_type: 'gyms',
    action: 'seed_demo_data',
    new_values: {
      seeded_gyms: gymsCount,
      seeded_contacts: contactsCount,
      seeded_tasks: tasksCount,
    },
  })

  return {
    gymsCount,
    contactsCount,
    tasksCount,
    interactionsCount,
    issuesCount,
  }
}
