import { z } from 'zod'

const emptyStringToNull = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.string().nullable().optional()
)

export const gymSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  legal_name: emptyStringToNull,
  description: emptyStringToNull,
  website: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().url('URL inválida').nullable().optional()
  ),
  phone: emptyStringToNull,
  email: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().email('Email inválido').nullable().optional()
  ),
  address: emptyStringToNull,
  city: emptyStringToNull,
  postal_code: emptyStringToNull,
  instagram: emptyStringToNull,
  contact_source: emptyStringToNull,
  discipline_ids: z.array(z.string()).optional(),

  commercial_status_id: emptyStringToNull,
  priority: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(['low', 'medium', 'high', 'urgent']).nullable().optional()
  ),
  owner_id: emptyStringToNull,
  first_contact_date: emptyStringToNull,
  last_contact_date: emptyStringToNull,
  next_followup_date: emptyStringToNull,
  next_action: emptyStringToNull,
  interest_level: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(['unknown', 'low', 'medium', 'high', 'very_high']).nullable().optional()
  ),
  interest_reason: emptyStringToNull,
  commercial_notes: emptyStringToNull,
  gym_objections: emptyStringToNull,
  next_steps: emptyStringToNull,

  onboarding_status_id: emptyStringToNull,
  classes_expected: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).nullable().optional()
  ),
  onboarding_owner_id: emptyStringToNull,
  pending_info: emptyStringToNull,
  current_blockers: emptyStringToNull,

  business_model_proposed: emptyStringToNull,
  business_model_agreed: emptyStringToNull,
  commission_details: emptyStringToNull,
  booking_manager: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(['gym', 'gymbooking', 'mixed', 'unknown']).nullable().optional()
  ),
  schedule_manager: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(['gym', 'gymbooking', 'mixed', 'unknown']).nullable().optional()
  ),
  cancellation_policy: emptyStringToNull,
  special_conditions: emptyStringToNull,
  agreement_start_date: emptyStringToNull,
  agreement_review_date: emptyStringToNull,
  agreement_status: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.enum(['none', 'verbal', 'pending_formal', 'formalized', 'expired']).nullable().optional()
  ),
  contract_url: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.string().url('URL inválida').nullable().optional()
  ),
})

export type GymFormValues = z.infer<typeof gymSchema>
