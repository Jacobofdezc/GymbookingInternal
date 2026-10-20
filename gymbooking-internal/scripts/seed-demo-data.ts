// Script to seed rich demo data into GymBooking Internal CRM
// Run: npx tsx scripts/seed-demo-data.ts
// Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

async function seedDemoData() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey || serviceRoleKey.includes('RELLENA_TU')) {
    console.error('ERROR: Debes configurar SUPABASE_SERVICE_ROLE_KEY en .env.local para ejecutar este script.')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('Obteniendo organización activa...')
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1)
    .single()

  if (orgError || !org) {
    console.error('ERROR: No se encontró ninguna organización. Ejecuta primero `npx tsx scripts/bootstrap.ts`.')
    process.exit(1)
  }

  console.log(`Organización encontrada: ${org.name} (${org.id})`)

  // Get admin profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('organization_id', org.id)
    .limit(5)

  const adminUser = profiles?.[0]
  const adminId = adminUser?.id || null

  // Get commercial statuses
  const { data: commercialStatuses } = await supabase
    .from('commercial_statuses')
    .select('id, name, slug')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true })

  // Get onboarding statuses
  const { data: onboardingStatuses } = await supabase
    .from('onboarding_statuses')
    .select('id, name, slug')
    .eq('organization_id', org.id)
    .order('sort_order', { ascending: true })

  // Get disciplines
  const { data: disciplines } = await supabase
    .from('disciplines')
    .select('id, name, slug')
    .eq('organization_id', org.id)

  const commMap = new Map((commercialStatuses || []).map((s) => [s.slug.toLowerCase(), s.id]))
  const onbMap = new Map((onboardingStatuses || []).map((s) => [s.slug.toLowerCase(), s.id]))
  const discMap = new Map((disciplines || []).map((d) => [d.slug.toLowerCase(), d.id]))

  // Helper to find status by keywords
  const getCommId = (keys: string[]) => {
    for (const k of keys) {
      for (const [slug, id] of commMap.entries()) {
        if (slug.includes(k)) return id
      }
    }
    return commercialStatuses?.[0]?.id || null
  }

  const getOnbId = (keys: string[]) => {
    for (const k of keys) {
      for (const [slug, id] of onbMap.entries()) {
        if (slug.includes(k)) return id
      }
    }
    return null
  }

  const idIdentificado = getCommId(['identificado', 'primer_contacto'])
  const idContactado = getCommId(['contactado', 'esperando'])
  const idInteresado = getCommId(['interesado'])
  const idReunion = getCommId(['reunion'])
  const idConfirmado = getCommId(['confirmado', 'acuerdo'])
  const idOnbRecopilando = getOnbId(['recopilando', 'documentacion'])
  const idOnbActivo = getOnbId(['activo', 'publicado'])

  console.log('Insertando gimnasios demo...')

  const DEMO_GYMS = [
    {
      name: 'Metropolitan Gran Vía',
      legal_name: 'Club Metropolitan Gran Vía SL',
      city: 'Madrid',
      address: 'Gran Vía 42',
      postal_code: '28013',
      phone: '915220011',
      email: 'granvia@clubmetropolitan.net',
      website: 'https://clubmetropolitan.net',
      priority: 'urgent',
      commercial_status_id: idConfirmado,
      onboarding_status_id: idOnbActivo,
      interest_level: 'very_high',
      proposed_model: 'commission',
      reservation_handler: 'gymbooking',
      cancellation_policy: 'free_12h',
      contact: {
        name: 'Roberto Valdés',
        role_title: 'Director General',
        phone: '611223344',
        email: 'rvaldes@clubmetropolitan.net',
      },
      classes: [
        { name: 'Cycling Masterclass', duration: 45, capacity: 30, price: 15, level: 'all_levels', disc: 'spinning' },
        { name: 'Power Yoga & Core', duration: 60, capacity: 20, price: 18, level: 'intermediate', disc: 'yoga' },
      ],
    },
    {
      name: 'Club Deportivo Retiro',
      legal_name: 'Retiro Sport Club SL',
      city: 'Madrid',
      address: 'Calle Menéndez Pelayo 67',
      postal_code: '28009',
      phone: '914090909',
      email: 'info@clubretiro.com',
      website: 'https://clubretiro.com',
      priority: 'high',
      commercial_status_id: idConfirmado,
      onboarding_status_id: idOnbRecopilando,
      interest_level: 'high',
      proposed_model: 'hybrid',
      reservation_handler: 'mixed',
      cancellation_policy: 'free_24h',
      contact: {
        name: 'Carlos Martínez',
        role_title: 'Director Deportivo',
        phone: '600111222',
        email: 'carlos@clubretiro.com',
      },
      classes: [
        { name: 'Pádel Técnico', duration: 90, capacity: 4, price: 25, level: 'intermediate', disc: 'padel' },
        { name: 'CrossTraining Pro', duration: 60, capacity: 16, price: 20, level: 'advanced', disc: 'crossfit' },
      ],
    },
    {
      name: 'CrossFit Castellana',
      legal_name: 'Castellana Box SL',
      city: 'Madrid',
      address: 'Paseo de la Castellana 85',
      postal_code: '28046',
      phone: '913456789',
      email: 'contacto@cfcastellana.es',
      website: 'https://cfcastellana.es',
      priority: 'urgent',
      commercial_status_id: idConfirmado,
      onboarding_status_id: idOnbRecopilando,
      interest_level: 'very_high',
      proposed_model: 'commission',
      reservation_handler: 'gymbooking',
      contact: {
        name: 'Laura Gómez',
        role_title: 'Head Coach y Socia',
        phone: '600333444',
        email: 'laura@cfcastellana.es',
      },
    },
    {
      name: 'Reformer Pilates Chamberí',
      legal_name: 'Estudio Pilates Chamberí CB',
      city: 'Madrid',
      address: 'Calle Santa Engracia 45',
      postal_code: '28010',
      phone: '914567890',
      email: 'chamberi@pilatesreformer.es',
      priority: 'high',
      commercial_status_id: idInteresado,
      interest_level: 'high',
      contact: {
        name: 'Marta Ruiz',
        role_title: 'Propietaria',
        phone: '600555666',
        email: 'marta@pilatesreformer.es',
      },
    },
    {
      name: 'Boutique Boxing Salamanca',
      legal_name: 'Salamanca Fight & Fitness SL',
      city: 'Madrid',
      address: 'Calle Claudio Coello 34',
      postal_code: '28001',
      phone: '917654321',
      email: 'salamanca@boxingboutique.com',
      priority: 'medium',
      commercial_status_id: idReunion,
      interest_level: 'high',
      contact: {
        name: 'Javier Navarro',
        role_title: 'Gerente',
        phone: '622445566',
        email: 'jnavarro@boxingboutique.com',
      },
    },
    {
      name: 'BCN Fitness Born',
      legal_name: 'Barcelona Fitness Center SL',
      city: 'Barcelona',
      address: 'Carrer de la Princesa 18',
      postal_code: '08003',
      phone: '932112233',
      email: 'info@bcnfitnessborn.cat',
      priority: 'medium',
      commercial_status_id: idContactado,
      interest_level: 'medium',
      contact: {
        name: 'Jordi Soler',
        role_title: 'Responsable de Ventas',
        phone: '633778899',
        email: 'jordi@bcnfitnessborn.cat',
      },
    },
    {
      name: 'CrossFit Poble Nou',
      legal_name: 'Poble Nou Training SL',
      city: 'Barcelona',
      address: 'Carrer de Pallars 110',
      postal_code: '08018',
      phone: '933445566',
      email: 'admin@cfpoblenou.com',
      priority: 'high',
      commercial_status_id: idReunion,
      interest_level: 'high',
      contact: {
        name: 'Arnau Puig',
        role_title: 'Socio Fundador',
        phone: '644889900',
        email: 'arnau@cfpoblenou.com',
      },
    },
    {
      name: 'Valencia Beach Yoga & Pilates',
      legal_name: 'Valencia Wellness SL',
      city: 'Valencia',
      address: 'Paseo Marítimo 15',
      postal_code: '46011',
      phone: '963112233',
      email: 'hola@valenciabeachyoga.es',
      priority: 'low',
      commercial_status_id: idIdentificado,
      interest_level: 'low',
      contact: {
        name: 'Carmen Vicente',
        role_title: 'Instructora Jefe',
        phone: '655112233',
        email: 'carmen@valenciabeachyoga.es',
      },
    },
  ]

  for (const g of DEMO_GYMS) {
    const { contact, classes, ...gymData } = g

    const { data: gym, error } = await supabase
      .from('gyms')
      .insert({
        ...gymData,
        organization_id: org.id,
        owner_id: adminId,
        created_by: adminId,
      })
      .select()
      .single()

    if (error || !gym) {
      console.warn(`Aviso al insertar ${g.name}:`, error?.message)
      continue
    }

    console.log(`✓ Gimnasio creado: ${gym.name}`)

    // Create contact
    if (contact) {
      await supabase.from('gym_contacts').insert({
        organization_id: org.id,
        gym_id: gym.id,
        name: contact.name,
        role_title: contact.role_title,
        phone: contact.phone,
        email: contact.email,
        is_decision_maker: true,
        is_primary: true,
      })
    }

    // Create interaction
    await supabase.from('interactions').insert({
      organization_id: org.id,
      gym_id: gym.id,
      type: 'call',
      interaction_date: new Date().toISOString(),
      summary: `Contacto inicial y presentación de la propuesta de valor de GymBooking con ${contact?.name || 'responsable'}.`,
      outcome: 'Interés confirmado para estudiar el modelo de reservas y porcentaje por usuario.',
      next_step: 'Enviar documento informativo y coordinar siguiente revisión.',
      next_step_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      registered_by: adminId,
    })

    // Create classes if defined
    if (classes && classes.length > 0) {
      for (const cl of classes) {
        const discId = discMap.get(cl.disc) || null
        const { data: createdClass } = await supabase
          .from('classes')
          .insert({
            organization_id: org.id,
            gym_id: gym.id,
            discipline_id: discId,
            name: cl.name,
            duration_minutes: cl.duration,
            max_capacity: cl.capacity,
            price_dropin: cl.price,
            level: cl.level,
            publication_status: 'published',
            is_active: true,
          })
          .select()
          .single()

        if (createdClass) {
          // Add default schedule
          await supabase.from('class_schedules').insert([
            {
              class_id: createdClass.id,
              day_of_week: 1, // Lunes
              start_time: '10:00',
              end_time: '11:00',
              timezone: 'Europe/Madrid',
            },
            {
              class_id: createdClass.id,
              day_of_week: 3, // Miércoles
              start_time: '18:00',
              end_time: '19:00',
              timezone: 'Europe/Madrid',
            },
          ])
        }
      }
    }
  }

  // Insert sample tasks
  console.log('Insertando tareas demo...')
  await supabase.from('tasks').insert([
    {
      organization_id: org.id,
      title: 'Verificar póliza de seguro de responsabilidad civil',
      description: 'Solicitar copia actualizada al gestor de Metropolitan Gran Vía para el expediente de activación.',
      priority: 'high',
      status: 'in_progress',
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: adminId,
      created_by: adminId,
    },
    {
      organization_id: org.id,
      title: 'Validar fotografías de salas y equipamiento',
      description: 'Revisar resolución mínima de 1920x1080 antes de autorizar la publicación en el portal.',
      priority: 'medium',
      status: 'pending',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assigned_to: adminId,
      created_by: adminId,
    },
    {
      organization_id: org.id,
      title: 'Revisión técnica de cuotas y pasarela',
      description: 'Asegurar que la liquidación bancaria tiene el IBAN validado en finanzas.',
      priority: 'urgent',
      status: 'pending',
      due_date: new Date().toISOString().split('T')[0],
      assigned_to: adminId,
      created_by: adminId,
    },
  ])

  // Insert sample issue
  console.log('Insertando incidencias demo...')
  await supabase.from('issues').insert([
    {
      organization_id: org.id,
      issue_number: 'INC-1001',
      title: 'Descuadre en el aforo máximo de la sala de Spinning',
      description: 'El gimnasio reporta que se han reservado 32 plazas cuando el aforo físico de bicicletas es 30.',
      type: 'technical_error',
      priority: 'urgent',
      status: 'in_progress',
      reported_by: adminId,
      assigned_to: adminId,
    },
    {
      organization_id: org.id,
      issue_number: 'INC-1002',
      title: 'Solicitud de actualización de profesor en clase de Yoga',
      description: 'Cambio de instructor para las sesiones de los jueves a las 18:00.',
      type: 'operational_change',
      priority: 'low',
      status: 'open',
      reported_by: adminId,
      assigned_to: adminId,
    },
  ])

  // Insert sample notifications
  if (adminId) {
    console.log('Insertando notificaciones demo...')
    await supabase.from('notifications').insert([
      {
        organization_id: org.id,
        user_id: adminId,
        type: 'urgent_issue',
        title: 'Incidencia Urgente: INC-1001',
        message: 'Descuadre en el aforo máximo de la sala de Spinning reportado por el centro.',
        entity_type: 'issue',
        is_read: false,
      },
      {
        organization_id: org.id,
        user_id: adminId,
        type: 'gym_confirmed',
        title: 'Gimnasio Confirmado',
        message: 'Club Deportivo Retiro ha aceptado las condiciones comerciales.',
        entity_type: 'gym',
        is_read: false,
      },
      {
        organization_id: org.id,
        user_id: adminId,
        type: 'task_assigned',
        title: 'Nueva tarea asignada',
        message: 'Verificar póliza de seguro de responsabilidad civil vence mañana.',
        entity_type: 'task',
        is_read: true,
      },
    ])
  }

  console.log('✓ Siembra de datos demo completada con éxito.')
}

seedDemoData().catch((err) => {
  console.error('Error durante la siembra de datos demo:', err)
  process.exit(1)
})
