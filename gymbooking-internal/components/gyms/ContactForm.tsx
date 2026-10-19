'use client'

import React, { useState, useEffect } from 'react'
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
import type { GymContact, ContactPreferredChannel, ContactDecisionMaker } from '@/types/database'

const contactSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  job_title: z.string().max(100).optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable().or(z.literal('')),
  phone: z.string().max(50).optional().nullable(),
  preferred_channel: z.enum(['email', 'phone', 'whatsapp', 'instagram', 'other']).optional().nullable(),
  is_decision_maker: z.enum(['yes', 'no', 'unknown']).default('unknown'),
  is_primary: z.boolean().default(false),
  notes: z.string().max(1000).optional().nullable(),
})

type ContactFormValues = z.infer<typeof contactSchema>

interface ContactFormProps {
  gymId: string
  contact?: GymContact | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ContactForm({
  gymId,
  contact,
  open,
  onOpenChange,
  onSuccess,
}: ContactFormProps) {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema) as any,
    defaultValues: {
      full_name: '',
      job_title: '',
      email: '',
      phone: '',
      preferred_channel: 'phone',
      is_decision_maker: 'unknown',
      is_primary: false,
      notes: '',
    },
  })

  useEffect(() => {
    if (contact) {
      reset({
        full_name: contact.full_name || '',
        job_title: contact.job_title || '',
        email: contact.email || '',
        phone: contact.phone || '',
        preferred_channel: (contact.preferred_channel as ContactPreferredChannel) || 'phone',
        is_decision_maker: (contact.is_decision_maker as ContactDecisionMaker) || 'unknown',
        is_primary: contact.is_primary || false,
        notes: contact.notes || '',
      })
    } else {
      reset({
        full_name: '',
        job_title: '',
        email: '',
        phone: '',
        preferred_channel: 'phone',
        is_decision_maker: 'unknown',
        is_primary: false,
        notes: '',
      })
    }
    setServerError(null)
  }, [contact, reset, open])

  const onSubmit = async (values: ContactFormValues) => {
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

      // If marked as primary, reset other contacts primary flag
      if (values.is_primary) {
        await supabase
          .from('gym_contacts')
          .update({ is_primary: false })
          .eq('gym_id', gymId)
      }

      const payload = {
        organization_id: profile.organization_id,
        gym_id: gymId,
        full_name: values.full_name,
        job_title: values.job_title || null,
        email: values.email || null,
        phone: values.phone || null,
        preferred_channel: values.preferred_channel || null,
        is_decision_maker: values.is_decision_maker || 'unknown',
        is_primary: values.is_primary,
        notes: values.notes || null,
        updated_at: new Date().toISOString(),
      }

      if (contact?.id) {
        // Update
        const { error } = await supabase
          .from('gym_contacts')
          .update(payload)
          .eq('id', contact.id)

        if (error) throw error
      } else {
        // Insert
        const { error } = await supabase.from('gym_contacts').insert({
          ...payload,
          created_by: user.id,
        })

        if (error) throw error
      }

      onOpenChange(false)
      onSuccess()
    } catch (err: any) {
      console.error('Error saving contact:', err)
      setServerError(err.message || 'Error al guardar el contacto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {contact ? 'Editar Contacto' : 'Añadir Contacto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {serverError}
            </div>
          )}

          <div>
            <Label htmlFor="full_name">Nombre completo *</Label>
            <Input
              id="full_name"
              {...register('full_name')}
              placeholder="Ej. Carlos Martínez"
              className="mt-1"
            />
            {errors.full_name && (
              <p className="mt-1 text-xs text-red-500">{errors.full_name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="job_title">Cargo / Puesto</Label>
            <Input
              id="job_title"
              {...register('job_title')}
              placeholder="Ej. Director de Operaciones / Dueño"
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contacto@gym.es"
                className="mt-1"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Teléfono / Móvil</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="+34 600 000 000"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="preferred_channel">Canal preferido</Label>
              <select
                id="preferred_channel"
                {...register('preferred_channel')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="phone">Teléfono</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Email</option>
                <option value="instagram">Instagram</option>
                <option value="other">Otro</option>
              </select>
            </div>

            <div>
              <Label htmlFor="is_decision_maker">Toma decisiones</Label>
              <select
                id="is_decision_maker"
                {...register('is_decision_maker')}
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="yes">Sí</option>
                <option value="no">No</option>
                <option value="unknown">Por verificar</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="is_primary"
              {...register('is_primary')}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="is_primary" className="cursor-pointer font-normal text-sm">
              Contacto principal de este centro
            </Label>
          </div>

          <div>
            <Label htmlFor="notes">Notas adicionales</Label>
            <Textarea
              id="notes"
              {...register('notes')}
              placeholder="Horarios en los que prefiere llamadas, contexto adicional..."
              rows={3}
              className="mt-1"
            />
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
              {contact ? 'Actualizar' : 'Guardar Contacto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
