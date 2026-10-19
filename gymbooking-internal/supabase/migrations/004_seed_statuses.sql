-- =============================================================================
-- GymBooking Internal CRM - Migration 004: Seed Function
-- =============================================================================
-- Defines seed_organization_data(p_org_id) which populates all reference /
-- configuration data for a newly created organization:
--   • commercial_statuses
--   • onboarding_statuses
--   • disciplines
--   • default onboarding template + template items
--
-- Call this function from the bootstrap script right after creating the
-- organization row, e.g.:
--   SELECT seed_organization_data('<org-uuid>');
-- =============================================================================

CREATE OR REPLACE FUNCTION seed_organization_data(p_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_template_id uuid;
BEGIN

  -- -------------------------------------------------------------------------
  -- Commercial statuses
  -- -------------------------------------------------------------------------
  INSERT INTO public.commercial_statuses
    (organization_id, name, slug, color, sort_order, is_pipeline_stage)
  VALUES
    (p_org_id, 'Identificado',                        'identified',           '#6B7280', 1,  true),
    (p_org_id, 'Pendiente de primer contacto',         'pending_first_contact','#F59E0B', 2,  true),
    (p_org_id, 'Contactado',                           'contacted',            '#3B82F6', 3,  true),
    (p_org_id, 'Esperando respuesta',                  'waiting_response',     '#8B5CF6', 4,  true),
    (p_org_id, 'Interesado',                           'interested',           '#10B981', 5,  true),
    (p_org_id, 'Reunión pendiente',                    'meeting_pending',      '#F97316', 6,  true),
    (p_org_id, 'Reunión realizada',                    'meeting_done',         '#0EA5E9', 7,  true),
    (p_org_id, 'Negociación',                          'negotiation',          '#EAB308', 8,  true),
    (p_org_id, 'Confirmado verbalmente',               'verbal_confirmation',  '#84CC16', 9,  true),
    (p_org_id, 'Acuerdo pendiente de formalizar',      'agreement_pending',    '#22C55E', 10, true),
    (p_org_id, 'Acuerdo formalizado',                  'agreement_formalized', '#16A34A', 11, true),
    (p_org_id, 'No interesado',                        'not_interested',       '#EF4444', 12, false),
    (p_org_id, 'Descartado',                           'discarded',            '#DC2626', 13, false),
    (p_org_id, 'Pausado',                              'paused',               '#9CA3AF', 14, false);

  -- -------------------------------------------------------------------------
  -- Onboarding statuses
  -- -------------------------------------------------------------------------
  INSERT INTO public.onboarding_statuses
    (organization_id, name, slug, color, sort_order)
  VALUES
    (p_org_id, 'No iniciada',                    'not_started',       '#6B7280', 1),
    (p_org_id, 'Recopilando información',         'gathering_info',    '#F59E0B', 2),
    (p_org_id, 'Esperando horarios y clases',     'waiting_schedules', '#8B5CF6', 3),
    (p_org_id, 'Validando información',            'validating',        '#3B82F6', 4),
    (p_org_id, 'Preparado para publicar',          'ready_to_publish',  '#10B981', 5),
    (p_org_id, 'Activo',                           'active',            '#16A34A', 6),
    (p_org_id, 'Bloqueado',                        'blocked',           '#EF4444', 7),
    (p_org_id, 'Suspendido',                       'suspended',         '#9CA3AF', 8);

  -- -------------------------------------------------------------------------
  -- Default disciplines
  -- -------------------------------------------------------------------------
  INSERT INTO public.disciplines (organization_id, name, slug)
  VALUES
    (p_org_id, 'Yoga',             'yoga'),
    (p_org_id, 'Pilates',          'pilates'),
    (p_org_id, 'Spinning',         'spinning'),
    (p_org_id, 'CrossFit',         'crossfit'),
    (p_org_id, 'Boxeo',            'boxing'),
    (p_org_id, 'Natación',         'swimming'),
    (p_org_id, 'Musculación',      'weightlifting'),
    (p_org_id, 'Zumba',            'zumba'),
    (p_org_id, 'Artes marciales',  'martial_arts'),
    (p_org_id, 'Cardio',           'cardio'),
    (p_org_id, 'Funcional',        'functional'),
    (p_org_id, 'Barre',            'barre'),
    (p_org_id, 'GAP',              'gap'),
    (p_org_id, 'TRX',              'trx'),
    (p_org_id, 'Otro',             'other');

  -- -------------------------------------------------------------------------
  -- Default onboarding template
  -- -------------------------------------------------------------------------
  INSERT INTO public.onboarding_templates (organization_id, name, is_default)
  VALUES (p_org_id, 'Proceso estándar de incorporación', true)
  RETURNING id INTO v_template_id;

  -- -------------------------------------------------------------------------
  -- Default onboarding template items
  -- -------------------------------------------------------------------------
  INSERT INTO public.onboarding_template_items
    (template_id, title, description, sort_order, category)
  VALUES
    (v_template_id, 'Confirmación comercial registrada',
      'Registrar la confirmación verbal o escrita del gimnasio',                   1,  'commercial'),
    (v_template_id, 'Persona de contacto principal identificada',
      'Identificar quién será el interlocutor principal',                          2,  'commercial'),
    (v_template_id, 'Condiciones comerciales documentadas',
      'Documentar el modelo y condiciones acordadas',                              3,  'commercial'),
    (v_template_id, 'Acuerdo formalizado (si procede)',
      'Firmar o confirmar por escrito el acuerdo',                                 4,  'commercial'),
    (v_template_id, 'Información del gimnasio verificada',
      'Comprobar nombre, dirección y datos de contacto',                           5,  'data'),
    (v_template_id, 'Dirección y datos de contacto verificados',
      'Confirmar dirección exacta y teléfono/email',                               6,  'data'),
    (v_template_id, 'Disciplinas deportivas confirmadas',
      'Confirmar qué disciplinas ofrece el gimnasio',                              7,  'data'),
    (v_template_id, 'Horarios y clases recibidos',
      'Recibir la programación de clases del gimnasio',                            8,  'data'),
    (v_template_id, 'Precios y condiciones de las clases comprobados',
      'Verificar precios y política de cancelación',                               9,  'data'),
    (v_template_id, 'Disponibilidad y sistema de reservas definido',
      'Aclarar cómo se gestionarán las reservas',                                  10, 'operations'),
    (v_template_id, 'Procedimiento de cancelaciones documentado',
      'Definir el proceso de cancelación de reservas',                             11, 'operations'),
    (v_template_id, 'Información cargada en la plataforma',
      'Introducir los datos del gimnasio y clases en GymBooking',                  12, 'platform'),
    (v_template_id, 'Clases revisadas',
      'Revisar que toda la información de clases es correcta',                     13, 'platform'),
    (v_template_id, 'Publicación autorizada',
      'Obtener autorización interna para publicar',                                14, 'platform'),
    (v_template_id, 'Gimnasio activado',
      'Activar el gimnasio en la plataforma pública',                              15, 'platform');

END;
$$;
