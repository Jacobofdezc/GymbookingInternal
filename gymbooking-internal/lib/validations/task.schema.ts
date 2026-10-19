import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio').max(500),
  description: z.string().max(3000).optional().nullable(),
  assignee_id: z
    .string()
    .uuid('ID de responsable inválido')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  status: z
    .enum(['pending', 'in_progress', 'blocked', 'completed', 'cancelled'])
    .default('pending'),
  due_date: z
    .string()
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  gym_id: z
    .string()
    .uuid('ID de gimnasio inválido')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  contact_id: z
    .string()
    .uuid('ID de contacto inválido')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
  issue_id: z
    .string()
    .uuid('ID de incidencia inválido')
    .optional()
    .nullable()
    .or(z.literal('').transform(() => null)),
})

export type TaskFormValues = z.infer<typeof taskSchema>
