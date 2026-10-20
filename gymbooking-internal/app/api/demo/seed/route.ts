import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'

export async function POST() {
  try {
    const user = await getCurrentUser()
    const supabase = await createAdminClient()

    // 1. Resolve Organization ID
    let orgId = user?.organization_id

    if (!orgId || orgId.startsWith('org-')) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      if (org) {
        orgId = org.id
      } else {
        // Fallback default organization
        orgId = 'a0000000-0000-4000-8000-000000000001'
        await supabase
          .from('organizations')
          .upsert({ id: orgId, name: 'GymBooking España', slug: 'gymbooking' })
        await (supabase as any).rpc('seed_organization_data', { p_org_id: orgId })
      }
    }

    // 2. Resolve User ID (must be a valid UUID in profiles)
    let userId = user?.id
    if (!userId || userId.startsWith('demo-')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1)
        .maybeSingle()

      userId = profile?.id || '86513161-6e70-41d3-affc-08d1ed12fc7d'
    }

    // 3. Fetch status maps
    const [commRes, onbRes] = await Promise.all([
      supabase
        .from('commercial_statuses')
        .select('id, slug')
        .eq('organization_id', orgId),
      supabase
        .from('onboarding_statuses')
        .select('id, slug')
        .eq('organization_id', orgId),
    ])

    const commMap = new Map((commRes.data || []).map((s) => [s.slug, s.id]))
    const onbMap = new Map((onbRes.data || []).map((s) => [s.slug, s.id]))
    const firstComm = commRes.data?.[0]?.id || null
    const firstOnb = onbRes.data?.[0]?.id || null

    const demoGyms = [
      {
        name: 'FitClub Chamberí',
        legal_name: 'Fitness Chamberí SL',
        city: 'Madrid',
        address: 'Calle de Santa Engracia, 45',
        postal_code: '28010',
        phone: '+34 914 552 101',
        email: 'contacto@fitclubchamberi.es',
        lat: 40.4348,
        lng: -3.6989,
        priority: 'high' as const,
        interest_level: 'high' as const,
        commercial_status_id: commMap.get('meeting_done') || firstComm,
        onboarding_status_id: onbMap.get('gathering_info') || firstOnb,
        next_followup_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        next_action: 'Presentar propuesta económica con descuento anual',
        notes: 'Centro premium de 800m2 con alta demanda de pilates y funcional.',
        contactName: 'Roberto Gómez Martínez',
        contactTitle: 'Director General',
        contactEmail: 'roberto@fitclubchamberi.es',
        contactPhone: '+34 611 223 344',
        interactionType: 'meeting_in_person' as const,
        interactionSummary: 'Reunión presencial en sus oficinas. Interesados en modelo de comisiones.',
      },
      {
        name: 'Brooklyn Fitboxing Retiro',
        legal_name: 'Retiro Boxing Studio SL',
        city: 'Madrid',
        address: 'Avenida de Menéndez Pelayo, 67',
        postal_code: '28009',
        phone: '+34 915 223 440',
        email: 'retiro@brooklynfitboxing.com',
        lat: 40.4153,
        lng: -3.6811,
        priority: 'urgent' as const,
        interest_level: 'very_high' as const,
        commercial_status_id: commMap.get('agreement_formalized') || commMap.get('agreement_pending') || firstComm,
        onboarding_status_id: onbMap.get('waiting_schedules') || firstOnb,
        next_followup_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        next_action: 'Verificar integración técnica de reserva de sacos',
        notes: 'Franquicia especializada en boxeo sin contacto. Muy interesados en fidelización.',
        contactName: 'Laura Méndez Casado',
        contactTitle: 'Gerente de Centro',
        contactEmail: 'lmendez@bfbretiro.com',
        contactPhone: '+34 622 334 455',
        interactionType: 'call' as const,
        interactionSummary: 'Llamada de seguimiento. Pendientes de enviar los turnos y aforos.',
      },
      {
        name: 'Crossfit Singular Box',
        legal_name: 'Singular Athletic Club SL',
        city: 'Madrid',
        address: 'Calle de López de Hoyos, 245',
        postal_code: '28043',
        phone: '+34 918 332 211',
        email: 'info@singularbox.es',
        lat: 40.4489,
        lng: -3.6651,
        priority: 'medium' as const,
        interest_level: 'medium' as const,
        commercial_status_id: commMap.get('pending_first_contact') || commMap.get('contacted') || firstComm,
        onboarding_status_id: onbMap.get('not_started') || firstOnb,
        next_followup_date: new Date().toISOString().split('T')[0],
        next_action: 'Llamada para agendar visita técnica',
        notes: 'Box oficial de CrossFit con 250 miembros y clases de halterofilia.',
        contactName: 'Marc Soler Pujol',
        contactTitle: 'Head Coach & Propietario',
        contactEmail: 'marc@singularbox.es',
        contactPhone: '+34 633 445 566',
        interactionType: 'email' as const,
        interactionSummary: 'Email inicial enviado presentando la plataforma GymBooking.',
      },
      {
        name: 'AltaFit Bernabéu',
        legal_name: 'AltaFit Gym Club SA',
        city: 'Madrid',
        address: 'Paseo de la Castellana, 130',
        postal_code: '28046',
        phone: '+34 919 044 550',
        email: 'bernabeu@altafit.es',
        lat: 40.4531,
        lng: -3.6908,
        priority: 'high' as const,
        interest_level: 'high' as const,
        commercial_status_id: commMap.get('negotiation') || firstComm,
        onboarding_status_id: onbMap.get('validating') || firstOnb,
        next_followup_date: new Date(Date.now() + 172800000).toISOString().split('T')[0],
        next_action: 'Resolver dudas sobre liquidación mensual SEPA',
        notes: 'Club de gran aforo en zona empresarial.',
        contactName: 'Carmen Navarro Blanco',
        contactTitle: 'Directora de Expansión',
        contactEmail: 'carmen.navarro@altafit.es',
        contactPhone: '+34 644 556 677',
        interactionType: 'video_call' as const,
        interactionSummary: 'Videollamada para repasar condiciones fiscales y periodicidad de pagos.',
      },
      {
        name: 'VivaGym Las Tablas',
        legal_name: 'VivaGym Group España SL',
        city: 'Madrid',
        address: 'Paseo Tierra de Melide, 21',
        postal_code: '28050',
        phone: '+34 913 002 991',
        email: 'lastablas@vivagym.es',
        lat: 40.5058,
        lng: -3.6669,
        priority: 'medium' as const,
        interest_level: 'medium' as const,
        commercial_status_id: commMap.get('waiting_response') || firstComm,
        onboarding_status_id: onbMap.get('not_started') || firstOnb,
        next_followup_date: new Date(Date.now() + 345600000).toISOString().split('T')[0],
        next_action: 'Revisión final de contrato con asesoría jurídica',
        notes: 'Gimnasio low-cost con área de entrenamiento funcional y cycling indoor.',
        contactName: 'David Vega',
        contactTitle: 'Responsable de Zona Madrid Norte',
        contactEmail: 'dvega@vivagym.es',
        contactPhone: '+34 655 667 788',
        interactionType: 'call' as const,
        interactionSummary: 'Llamada con responsable legal para envío de cláusulas de protección de datos.',
      },
      {
        name: 'McFit Goya',
        legal_name: 'RSG Group España SL',
        city: 'Madrid',
        address: 'Calle de Alcalá, 112',
        postal_code: '28009',
        phone: '+34 917 819 020',
        email: 'goya@mcfit.com',
        lat: 40.4239,
        lng: -3.6766,
        priority: 'medium' as const,
        interest_level: 'very_high' as const,
        commercial_status_id: commMap.get('agreement_formalized') || firstComm,
        onboarding_status_id: onbMap.get('active') || firstOnb,
        next_followup_date: new Date(Date.now() + 604800000).toISOString().split('T')[0],
        next_action: 'Revisión mensual de aforos y reservas completadas',
        notes: 'Cadena con más de 2.000 socios activos en la zona comercial de Goya.',
        contactName: 'Carlos Santillana',
        contactTitle: 'Coordinador de Instalación',
        contactEmail: 'csantillana@mcfit.es',
        contactPhone: '+34 666 778 899',
        interactionType: 'meeting_in_person' as const,
        interactionSummary: 'Onboarding completado. Gimnasio activo y publicado con éxito.',
      },
    ]

    let gymsCount = 0
    let contactsCount = 0
    let tasksCount = 0
    let interactionsCount = 0

    for (const g of demoGyms) {
      // Check existing gym
      const { data: existing } = await supabase
        .from('gyms')
        .select('id')
        .eq('organization_id', orgId)
        .eq('name', g.name)
        .maybeSingle()

      let gymId = existing?.id

      if (!gymId) {
        const { data: newGym, error: gymErr } = await supabase
          .from('gyms')
          .insert({
            organization_id: orgId,
            owner_id: userId,
            name: g.name,
            legal_name: g.legal_name,
            city: g.city,
            address: g.address,
            postal_code: g.postal_code,
            phone: g.phone,
            email: g.email,
            lat: g.lat,
            lng: g.lng,
            priority: g.priority,
            interest_level: g.interest_level,
            commercial_status_id: g.commercial_status_id,
            onboarding_status_id: g.onboarding_status_id,
            next_followup_date: g.next_followup_date,
            next_action: g.next_action,
            commercial_notes: g.notes,
          })
          .select('id')
          .single()

        if (gymErr) {
          console.error(`Error inserting gym ${g.name}:`, gymErr)
          continue
        }
        gymId = newGym.id
        gymsCount++
      } else {
        gymsCount++
      }

      // Contact
      const { data: contact, error: contactErr } = await supabase
        .from('gym_contacts')
        .insert({
          organization_id: orgId,
          gym_id: gymId,
          full_name: g.contactName,
          job_title: g.contactTitle,
          email: g.contactEmail,
          phone: g.contactPhone,
          is_primary: true,
        })
        .select('id')
        .single()

      if (!contactErr && contact) {
        contactsCount++
      }

      // Task
      const { error: taskErr } = await supabase.from('tasks').insert({
        organization_id: orgId,
        gym_id: gymId,
        contact_id: contact?.id || null,
        assignee_id: userId,
        title: g.next_action,
        priority: g.priority,
        status: 'pending',
        due_date: g.next_followup_date,
      })

      if (!taskErr) {
        tasksCount++
      }

      // Interaction
      const { error: interErr } = await supabase.from('interactions').insert({
        organization_id: orgId,
        gym_id: gymId,
        contact_id: contact?.id || null,
        registered_by: userId,
        type: g.interactionType,
        interaction_date: new Date().toISOString(),
        summary: g.interactionSummary,
        next_step: g.next_action,
        next_step_date: g.next_followup_date,
      })

      if (!interErr) {
        interactionsCount++
      }
    }

    // Seed 2 demo issues
    let issuesCount = 0
    const demoIssues = [
      {
        title: 'Horarios de fin de semana pendientes de confirmación en AltaFit',
        description: 'La dirección técnica de AltaFit necesita validar los aforos de los sábados por la tarde.',
        type: 'schedules' as const,
        priority: 'high' as const,
        status: 'in_progress' as const,
      },
      {
        title: 'Incidencia técnica en feed de reservas de FitClub',
        description: 'Se requiere revisar el formato de respuesta del webhook de cancelaciones.',
        type: 'technical_error' as const,
        priority: 'urgent' as const,
        status: 'open' as const,
      },
    ]

    for (const iss of demoIssues) {
      const { error: issueErr } = await supabase.from('issues').insert({
        organization_id: orgId,
        title: iss.title,
        description: iss.description,
        type: iss.type,
        priority: iss.priority,
        status: iss.status,
        assignee_id: userId,
        due_date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      })
      if (!issueErr) {
        issuesCount++
      }
    }

    // Seed Knowledge Pages if empty
    const { count: kbCount } = await supabase
      .from('knowledge_pages')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    if (!kbCount || kbCount === 0) {
      await supabase.from('knowledge_pages').insert([
        {
          organization_id: orgId,
          title: 'Protocolo Comercial: Argumentario de Venta y Acuerdos con Gimnasios',
          category: 'procedures',
          content: '<h2>Objetivo de la propuesta comercial</h2><p>Lineamientos clave para el equipo comercial al presentar GymBooking a centros deportivos.</p><h3>1. Propuesta de Valor Diferencial</h3><ul><li><strong>Monetización de plazas ociosas:</strong> Optimización de horas valle.</li><li><strong>Sin coste fijo:</strong> Modelo a éxito por reserva asistida.</li><li><strong>Control total de aforo:</strong> El gimnasio decide cupos por sesión.</li></ul>',
          tags: ['comercial', 'ventas', 'argumentario', 'comisiones'],
          status: 'published',
          author_id: userId,
          created_by: userId,
        },
        {
          organization_id: orgId,
          title: 'Guía de Onboarding Técnico e Integración de Centros',
          category: 'technology',
          content: '<h2>Proceso de Integración Técnica Paso a Paso</h2><p>Procedimiento estandarizado para activar un nuevo centro deportivo desde la firma del contrato hasta su publicación en la app.</p><ol><li>Ficha técnica y certificación bancaria.</li><li>Fotografías de las instalaciones y verificación de equipamiento.</li><li>Carga de clases, profesores y aforos.</li><li>Prueba de reserva en entorno de staging y validación con el gerente.</li></ol>',
          tags: ['onboarding', 'operaciones', 'integracion', 'calidad'],
          status: 'published',
          author_id: userId,
          created_by: userId,
        },
        {
          organization_id: orgId,
          title: 'Política de Liquidaciones y Pagos SEPA a Centros Deportivos',
          category: 'procedures',
          content: '<h2>Calendario Financiero y Procedimiento de Pago</h2><ol><li><strong>Cierre mensual:</strong> El último día natural a las 23:59.</li><li><strong>Borrador de autofactura:</strong> El día 2 con el desglose íntegro.</li><li><strong>Emisión de remesa SEPA B2B:</strong> El día 5 de cada mes.</li></ol>',
          tags: ['finanzas', 'pagos', 'sepa', 'facturacion'],
          status: 'published',
          author_id: userId,
          created_by: userId,
        },
      ])
    }

    // Seed Decisions if empty
    const { count: decCount } = await supabase
      .from('decisions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)

    if (!decCount || decCount === 0) {
      await supabase.from('decisions').insert([
        {
          organization_id: orgId,
          title: 'Adopción de comisión estándar del 15% para gimnasios independientes',
          context: 'Necesidad de fijar una estructura de precios transparente y competitiva respecto a intermediarios tradicionales.',
          decision_made: 'Fijar 15% para centros independientes y escala reducida del 12% para cadenas de más de 3 sedes.',
          reason: 'Asegura margen operativo sostenible y facilita la negociación comercial sin descuentos arbitrarios.',
          decision_date: '2026-10-01',
          status: 'active',
          responsible_id: userId,
          created_by: userId,
        },
        {
          organization_id: orgId,
          title: 'Ventana de reserva anticipada de 48 horas para usuarios GymBooking',
          context: 'Preocupación de los centros deportivos por la disponibilidad de plazas para sus propios socios regulares.',
          decision_made: 'Limitar la apertura de reserva en la app a 48 horas previas al inicio de cada clase.',
          reason: 'Garantiza que los abonados del gimnasio reserven con su antelación habitual (7 días) y GymBooking solo ocupe plazas vacantes.',
          decision_date: '2026-10-10',
          status: 'active',
          responsible_id: userId,
          created_by: userId,
        },
      ])
    }

    return NextResponse.json({
      success: true,
      gymsCount,
      contactsCount,
      tasksCount,
      interactionsCount,
      issuesCount,
      message: `¡Entorno demo cargado con éxito en Supabase! Se han registrado ${gymsCount} gimnasios, ${contactsCount} contactos, ${tasksCount} tareas y ${interactionsCount} interacciones reales.`,
    })
  } catch (error: any) {
    console.error('Error seeding demo data:', error)
    return NextResponse.json(
      { error: error?.message || 'Error inesperado al cargar datos demo en Supabase' },
      { status: 500 }
    )
  }
}
