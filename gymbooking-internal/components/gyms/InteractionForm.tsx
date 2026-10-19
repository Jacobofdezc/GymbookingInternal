'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import type { GymContact, InteractionType } from '@/types/database'

const interactionSchema = z.object({
  type: z.enum([
    'call',
    'email',
    'whatsapp',
    'meeting_in_person',
    'video_call',
    'other_platform',
    'internal_note',
  ]),
  contact_id: z.string().optional().nullable(),
  interaction_date: z.string().min(1, 'La fecha es obligatoria'),
  summary: z.string().min(2, 'El resumen es obligatorio').max(2000),
  outcome: z.string().max(1000).optional().nullable(),
  commitments: z.string().max(1000).optional().nullable(),
  next_step: z.string().max(500).optional().nullable(),
  next_step_date: z.string().optional().nullable(),
})

type InteractionFormValues = z.infer<typeof interactionSchema>

interface InteractionFormProps {
  gymId: string
  contacts: GymContact[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function InteractionForm({
  gymId,
  contacts,
  open,
  onOpenChange,
  onSuccess,
}: InteractionFormProps) {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  // Default to today formatted for datetime-local input
  const nowIso = new Date().toISOString().slice(0, 16)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      type: 'call',
      contact_id: '',
      interaction_date: nowIso,
      summary: '',
      outcome: '',
      commitments: '',
      next_step: '',
      next_step_date: '',
    },
  })

  const onSubmit = async (values: InteractionFormValues) => {
    setLoading(true)
    setServerError(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuario no autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil no encontrado')

      // 1. Insert interaction
      const { data: interaction, error: interactionError } = await supabase
        .from('interactions')
        .insert({
          organization_id: profile.organization_id,
          gym_id: gymId,
          contact_id: values.contact_id || null,
          type: values.type as InteractionType,
          interaction_date: new Date(values.interaction_date).toISOString(),
          registered_by: user.id,
          summary: values.summary,
          outcome: values.outcome || null,
          commitments: values.commitments || null,
          next_step: values.next_step || null,
          next_step_date: values.next_step_date || null,
          created_by: user.id,
        })
        .select()
        .single()

      if (interactionError) throw interactionError

      // 2. Update gym last_contact_date and next_followup_date
      const contactDateOnly = values.interaction_date.split('T')[0]
      const gymUpdatePayload: Record<string, unknown> = {
        last_contact_date: contactDateOnly,
        updated_at: new Date().toISOString(),
      }

      if (values.next_step) {
        gymUpdatePayload.next_action = values.next_step
      }
      if (values.next_step_date) {
        gymUpdatePayload.next_followup_date = values.next_step_date
      }

      await supabase.from('gyms').update(gymUpdatePayload as any).eq('id', gymId)

      // 3. If next_step_date is set, automatically create follow-up task
      if (values.next_step_date) {
        const taskTitle = values.next_step
          ? `Seguimiento: ${values.next_step}`
          : `Seguimiento comercial tras ${values.type}`

        await supabase.from('tasks').insert({
          organization_id: profile.organization_id,
          title: taskTitle,
          description: `Compromisos: ${values.commitments || 'Ninguno'}\nResultado previo: ${
            values.outcome || 'N/A'
          }`,
          assignee_id: user.id,
          priority: 'medium',
          status: 'pending',
          due_date: values.next_step_date,
          gym_id: gymId,
          contact_id: values.contact_id || null,
          created_by: user.id,
        })
      }

      reset()
      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error('Error recording interaction:', err)
      setServerError(err.message || 'Error al registrar la interacción')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Interacción Comercial</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type">Tipo de contacto *</Label>
              <select
                id="type"
                {...register('type')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="call">Llamada</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="meeting_in_person">Reunión presencial</option>
                <option value="video_call">Videollamada</option>
                <option value="other_platform">Otra plataforma</option>
                <option value="internal_note">Nota interna</option>
              </select>
            </div>

            <div>
              <Label htmlFor="interaction_date">Fecha y hora *</Label>
              <Input
                id="interaction_date"
                type="datetime-local"
                {...register('interaction_date')}
                className="mt-1"
              />
              {errors.interaction_date && (
                <p className="mt-1 text-xs text-red-500">{errors.interaction_date.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="contact_id">Contacto del centro</Label>
            <select
              id="contact_id"
              {...register('contact_id')}
              className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Seleccionar contacto (opcional)...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} {c.job_title ? `(${c.job_title})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="summary">Resumen de la conversación *</Label>
            <Textarea
              id="summary"
              {...register('summary')}
              placeholder="¿Qué se habló? Puntos clave tratados..."
              rows={3}
              className="mt-1"
            />
            {errors.summary && (
              <p className="mt-1 text-xs text-red-500">{errors.summary.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="outcome">Resultado / Reacción</Label>
              <Input
                id="outcome"
                {...register('outcome')}
                placeholder="Ej. Muy receptivo, pide propuesta"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="commitments">Compromisos acordados</Label>
              <Input
                id="commitments"
                {...register('commitments')}
                placeholder="Ej. Enviar dossier antes del viernes"
                className="mt-1"
              />
            </div>
          </div>

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 mb-2">
              Próximo Paso / Seguimiento
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="next_step">Acción a realizar</Label>
                <Input
                  id="next_step"
                  {...register('next_step')}
                  placeholder="Ej. Llamar para resolver dudas"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="next_step_date">Fecha de seguimiento</Label>
                <Input
                  id="next_step_date"
                  type="date"
                  {...register('next_step_date')}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Al fijar una fecha de seguimiento, se creará automáticamente una tarea en el sistema.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Interacción
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
