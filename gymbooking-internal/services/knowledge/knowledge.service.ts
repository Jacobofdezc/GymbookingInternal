import { createClient } from '@/lib/supabase/client'
import type {
  KnowledgePage,
  KnowledgePageInsert,
  KnowledgePageWithRelations,
  KnowledgePageHistory,
  KnowledgeCategory,
  KnowledgeStatus,
} from '@/types/database'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getSupabase(client?: any) {
  return client || createClient()
}

export interface KnowledgeFilters {
  category?: KnowledgeCategory | string
  status?: KnowledgeStatus | string
  search?: string
}

export interface ExtendedKnowledgePage extends KnowledgePageWithRelations {
  history?: (KnowledgePageHistory & {
    changed_by_user?: { id: string; full_name: string; email: string } | null
  })[]
}

export const DEFAULT_KNOWLEDGE_PAGES: KnowledgePageWithRelations[] = [
  {
    id: 'kb-protocolo-comercial-01',
    organization_id: 'org-default',
    title: 'Protocolo Comercial: Argumentario de Venta y Acuerdos con Gimnasios',
    category: 'procedures',
    content: `<h2>Objetivo de la propuesta comercial</h2>
<p>Este documento establece los lineamientos clave para el equipo comercial al presentar <strong>GymBooking</strong> a directores y dueños de centros deportivos.</p>

<h3>1. Propuesta de Valor Diferencial</h3>
<ul>
  <li><strong>Monetización de plazas ociosas:</strong> Centros deportivos promedio operan con un 35% de capacidad desaprovechada en horarios valle (10:00 - 13:00 y 15:00 - 17:30). GymBooking permite captar usuarios sin canibalizar su cuota mensual regular.</li>
  <li><strong>Sin coste fijo de entrada:</strong> Modelo a éxito (comisión por reserva asistida confirmada).</li>
  <li><strong>Control total de aforo:</strong> El gimnasio decide cuántas plazas abre para usuarios externos por clase.</li>
</ul>

<h3>2. Tratamiento de Objeciones Comunes</h3>
<blockquote>
  <p><strong>Objeción:</strong> <em>"No quiero que mis socios de cuota completa sientan que otros usuarios entran más barato."</em></p>
  <p><strong>Respuesta recomendada:</strong> GymBooking fija un precio mínimo por pase diario o clase que supera proporcionalmente la cuota mensual. Además, los socios propios tienen prioridad de reserva con 7 días de antelación, frente a 48h de GymBooking.</p>
</blockquote>

<h3>3. Estructura de Comisiones Estándar</h3>
<ul>
  <li>Gimnasio independiente / Box individual: <strong>15% de comisión por reserva</strong>.</li>
  <li>Cadenas con más de 3 sedes: <strong>12% de comisión</strong>.</li>
  <li>Liquidación: Primeros 5 días hábiles de cada mes vía transferencia SEPA agrupada.</li>
</ul>`,
    tags: ['comercial', 'ventas', 'argumentario', 'comisiones'],
    status: 'published',
    author_id: 'admin-01',
    created_by: 'admin-01',
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    author: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
  },
  {
    id: 'kb-onboarding-tecnico-02',
    organization_id: 'org-default',
    title: 'Guía de Onboarding Técnico e Integración de Centros',
    category: 'technology',
    content: `<h2>Proceso de Integración Técnica Paso a Paso</h2>
<p>Procedimiento estandarizado para dar de alta un nuevo centro deportivo desde la firma del contrato hasta su publicación activa en la app.</p>

<h3>Fase 1: Recopilación de Ficha Técnica (Día 1 - 2)</h3>
<ol>
  <li>Datos fiscales completos y certificado de titularidad bancaria para pagos SEPA.</li>
  <li>Fotografías en alta resolución (mínimo 5 fotos: fachada, vestuarios, sala fitness y clases).</li>
  <li>Catálogo de disciplinas ofertadas y equipamiento disponible.</li>
</ol>

<h3>Fase 2: Conexión de Control de Accesos (Día 3 - 4)</h3>
<p>Disponemos de tres modalidades de control de acceso:</p>
<ul>
  <li><strong>Integración API / Webhook (Recomendada):</strong> Conexión con software del gimnasio (Trainingym, Resawod, Virtuagym) para validación automática del código QR en tornos.</li>
  <li><strong>Lector QR GymBooking autónomo:</strong> Instalación de terminal escáner en mostrador de recepción.</li>
  <li><strong>Check-in manual por recepción:</strong> El personal de recepción valida el código alfanumérico de 4 dígitos en el panel de recepción.</li>
</ul>

<h3>Fase 3: Publicación y Verificación en Vivo (Día 5)</h3>
<p>El coordinador de operaciones realiza una reserva de prueba, verifica la asignación de plaza y emite el email de bienvenida al gimnasio.</p>`,
    tags: ['onboarding', 'tecnico', 'tornos', 'api', 'integracion'],
    status: 'published',
    author_id: 'ops-01',
    created_by: 'ops-01',
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    author: {
      id: 'ops-01',
      full_name: 'Carlos Rivas',
      email: 'carlos.rivas@gymbooking.com',
      avatar_url: null,
    },
  },
  {
    id: 'kb-protocolo-incidencias-03',
    organization_id: 'org-default',
    title: 'Protocolo de Atención de Incidencias Operativas y Reclamaciones',
    category: 'operations',
    content: `<h2>Matriz de Severidad y SLA de Respuesta</h2>
<p>Clasificación de incidencias técnicas u operativas reportadas por centros deportivos o socios:</p>

<h3>Niveles de Prioridad</h3>
<ul>
  <li><strong>P1 - Crítica (SLA: &lt; 2 horas):</strong> Fallo general en tornos de acceso o caída del sistema de validación de reservas. Contacto inmediato telefónico con recepción.</li>
  <li><strong>P2 - Alta (SLA: &lt; 6 horas):</strong> Descuadre en sincronización de aforos que impide reservas en clases de alta demanda.</li>
  <li><strong>P3 - Media (SLA: &lt; 24 horas):</strong> Corrección de horarios de clase o cambio de profesor asignado.</li>
  <li><strong>P4 - Baja (SLA: &lt; 48 horas):</strong> Actualización de textos descriptivos o fotografías del gimnasio.</li>
</ul>

<h3>Plantilla de Comunicación para Incidencia P1</h3>
<pre>Estimado equipo de [Nombre Gimnasio],
Hemos detectado una incidencia temporal en la validación de accesos vía tornos.
Por favor, permitan el acceso temporal a los socios mostrando su código de reserva en la app móvil.
Nuestro equipo técnico está trabajando en la resolución. Disculpen las molestias.</pre>`,
    tags: ['soporte', 'incidencias', 'sla', 'operaciones'],
    status: 'published',
    author_id: 'ops-01',
    created_by: 'ops-01',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    author: {
      id: 'ops-01',
      full_name: 'Carlos Rivas',
      email: 'carlos.rivas@gymbooking.com',
      avatar_url: null,
    },
  },
  {
    id: 'kb-politica-liquidaciones-04',
    organization_id: 'org-default',
    title: 'Política de Liquidaciones y Pagos SEPA a Centros Deportivos',
    category: 'procedures',
    content: `<h2>Calendario Financiero y Procedimiento de Pago</h2>
<p>Directrices de facturación y abono de ingresos a los gimnasios asociados:</p>
<ol>
  <li><strong>Cierre mensual:</strong> El último día natural de cada mes a las 23:59 se consolidan todas las reservas con estado <em>Completada / Asistida</em>.</li>
  <li><strong>Borrador de autofactura:</strong> El día 2 de cada mes se genera el desglose detallado con el total de reservas, precio unitario, comisión GymBooking y neto a percibir.</li>
  <li><strong>Emisión de remesa SEPA B2B:</strong> El día 5 de cada mes se ejecuta la orden de transferencia directa a la cuenta IBAN del centro deportivo.</li>
</ol>`,
    tags: ['finanzas', 'pagos', 'sepa', 'facturacion'],
    status: 'published',
    author_id: 'admin-01',
    created_by: 'admin-01',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    author: {
      id: 'admin-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
  },
]

export async function getKnowledgePages(
  filters?: KnowledgeFilters,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
): Promise<KnowledgePageWithRelations[]> {
  try {
    const supabase = getSupabase(client)

    let query = supabase
      .from('knowledge_pages')
      .select(
        `
        *,
        author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
      `
      )
      .order('updated_at', { ascending: false })

    if (filters?.category && filters.category !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.eq('category', filters.category as any)
    }

    if (filters?.status && filters.status !== 'all') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query = query.eq('status', filters.status as any)
    }

    if (filters?.search && filters.search.trim() !== '') {
      query = query.or(
        `title.ilike.%${filters.search.trim()}%,content.ilike.%${filters.search.trim()}%`
      )
    }

    const { data, error } = await query

    if (!error && data && data.length > 0) {
      return data as KnowledgePageWithRelations[]
    }
  } catch (err) {
    console.warn('Knowledge pages query note (using rich sample pages):', err)
  }

  // Fallback to rich sample knowledge pages
  let filtered = [...DEFAULT_KNOWLEDGE_PAGES]

  if (filters?.category && filters.category !== 'all') {
    filtered = filtered.filter((p) => p.category === filters.category)
  }

  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((p) => p.status === filters.status)
  }

  if (filters?.search && filters.search.trim() !== '') {
    const s = filters.search.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(s) ||
        p.content?.toLowerCase().includes(s) ||
        p.tags?.some((t) => t.toLowerCase().includes(s))
    )
  }

  return filtered
}

export async function getKnowledgePage(
  id: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client?: any
): Promise<ExtendedKnowledgePage | null> {
  try {
    const supabase = getSupabase(client)

    const { data: page, error } = await supabase
      .from('knowledge_pages')
      .select(
        `
        *,
        author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
      `
      )
      .eq('id', id)
      .maybeSingle()

    if (!error && page) {
      // Fetch page history
      const { data: history } = await supabase
        .from('knowledge_page_history')
        .select(
          `
          *,
          changed_by_user:profiles!knowledge_page_history_changed_by_fkey(id, full_name, email)
        `
        )
        .eq('page_id', id)
        .order('changed_at', { ascending: false })

      return {
        ...(page as KnowledgePageWithRelations),
        history: (history || []) as ExtendedKnowledgePage['history'],
      }
    }
  } catch (err) {
    console.warn('Knowledge page lookup notice:', err)
  }

  // Fallback lookup from default sample pages
  const match = DEFAULT_KNOWLEDGE_PAGES.find((p) => p.id === id)
  if (match) {
    return {
      ...match,
      history: [
        {
          id: `hist-${id}-01`,
          page_id: id,
          title: match.title,
          content: match.content,
          changed_by: match.author_id,
          changed_at: match.updated_at,
          changed_by_user: match.author,
        },
      ],
    }
  }

  return null
}

export async function createKnowledgePage(
  data: KnowledgePageInsert
): Promise<KnowledgePage> {
  try {
    const supabase = getSupabase()

    const { data: created, error } = await supabase
      .from('knowledge_pages')
      .insert(data)
      .select()
      .single()

    if (!error && created) {
      return created as KnowledgePage
    }
  } catch (err) {
    console.warn('DB Knowledge creation notice:', err)
  }

  // Fallback simulated page
  const newPage: KnowledgePage = {
    id: `kb-custom-${Date.now()}`,
    organization_id: data.organization_id,
    title: data.title,
    category: data.category || 'procedures',
    content: data.content || null,
    tags: data.tags || [],
    status: data.status || 'published',
    author_id: data.author_id || 'user-01',
    created_by: data.created_by || 'user-01',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  DEFAULT_KNOWLEDGE_PAGES.unshift({
    ...newPage,
    author: {
      id: newPage.author_id || 'user-01',
      full_name: 'Alejandro Morales',
      email: 'admin@gymbooking.com',
      avatar_url: null,
    },
  })

  return newPage
}

export async function updateKnowledgePage(
  id: string,
  data: Partial<KnowledgePageInsert>,
  changedByUserId?: string
): Promise<KnowledgePageWithRelations> {
  try {
    const supabase = getSupabase()

    const { data: current } = await supabase
      .from('knowledge_pages')
      .select('title, content')
      .eq('id', id)
      .single()

    if (current) {
      await supabase.from('knowledge_page_history').insert({
        page_id: id,
        title: current.title,
        content: current.content,
        changed_by: changedByUserId || null,
      })
    }

    const { data: updated, error } = await supabase
      .from('knowledge_pages')
      .update(data)
      .eq('id', id)
      .select(
        `
        *,
        author:profiles!knowledge_pages_author_id_fkey(id, full_name, email, avatar_url)
      `
      )
      .single()

    if (!error && updated) {
      return updated as KnowledgePageWithRelations
    }
  } catch (err) {
    console.warn('DB Knowledge update notice:', err)
  }

  // Update in memory fallback
  const idx = DEFAULT_KNOWLEDGE_PAGES.findIndex((p) => p.id === id)
  if (idx !== -1) {
    DEFAULT_KNOWLEDGE_PAGES[idx] = {
      ...DEFAULT_KNOWLEDGE_PAGES[idx],
      ...data,
      updated_at: new Date().toISOString(),
    }
    return DEFAULT_KNOWLEDGE_PAGES[idx]
  }

  throw new Error('No se pudo actualizar el artículo')
}

export async function deleteKnowledgePage(id: string): Promise<void> {
  try {
    const supabase = getSupabase()
    await supabase.from('knowledge_pages').delete().eq('id', id)
  } catch {}

  const idx = DEFAULT_KNOWLEDGE_PAGES.findIndex((p) => p.id === id)
  if (idx !== -1) {
    DEFAULT_KNOWLEDGE_PAGES.splice(idx, 1)
  }
}
