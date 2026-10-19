import { z } from 'zod'

export const gymSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(200),
  legal_name: z.string().max(200).optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  website: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  postal_code: z.string().max(10).optional().nullable(),
  instagram: z.string().max(100).optional().nullable(),
  contact_source: z.string().max(200).optional().nullable(),
  discipline_ids: z.array(z.string()).optional(),

  commercial_status_id: z.string().uuid().optional().nullable().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional().nullable(),
  owner_id: z.string().uuid().optional().nullable().or(z.literal('')),
  first_contact_date: z.string().optional().nullable(),
  last_contact_date: z.string().optional().nullable(),
  next_followup_date: z.string().optional().nullable(),
  next_action: z.string().max(500).optional().nullable(),
  interest_level: z.enum(['unknown', 'low', 'medium', 'high', 'very_high']).optional().nullable(),
  interest_reason: z.string().max(1000).optional().nullable(),
  commercial_notes: z.string().max(3000).optional().nullable(),
  gym_objections: z.string().max(1000).optional().nullable(),
  next_steps: z.string().max(1000).optional().nullable(),

  onboarding_status_id: z.string().uuid().optional().nullable().or(z.literal('')),
  classes_expected: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? null : Number(v)),
    z.number().int().min(0).optional().nullable()
  ),
  onboarding_owner_id: z.string().uuid().optional().nullable().or(z.literal('')),
  pending_info: z.string().max(1000).optional().nullable(),
  current_blockers: z.string().max(1000).optional().nullable(),

  business_model_proposed: z.string().max(500).optional().nullable(),
  business_model_agreed: z.string().max(500).optional().nullable(),
  commission_details: z.string().max(500).optional().nullable(),
  booking_manager: z.enum(['gym', 'gymbooking', 'mixed', 'unknown']).optional().nullable(),
  schedule_manager: z.enum(['gym', 'gymbooking', 'mixed', 'unknown']).optional().nullable(),
  cancellation_policy: z.string().max(1000).optional().nullable(),
  special_conditions: z.string().max(1000).optional().nullable(),
  agreement_start_date: z.string().optional().nullable(),
  agreement_review_date: z.string().optional().nullable(),
  agreement_status: z.enum(['none', 'verbal', 'pending_formal', 'formalized', 'expired']).optional().nullable(),
  contract_url: z.string().url('URL inválida').optional().nullable().or(z.literal('')),
})

export type GymFormValues = z.infer<typeof gymSchema>
