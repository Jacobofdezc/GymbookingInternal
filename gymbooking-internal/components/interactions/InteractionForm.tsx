'use client'

import React, { useState, useEffect } from 'react'
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
import { Select } from '@/components/ui/select'
import { NotificationAlert, NotificationState } from '@/components/ui/notification-alert'
import { createClient } from '@/lib/supabase/client'
import { createInteraction } from '@/services/interactions/interaction.service'
import type { InteractionType } from '@/types/database'
import { Loader2 } from 'lucide-react'

interface InteractionFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedGymId?: string
}

export function InteractionForm({
  isOpen,
  onClose,
  onSuccess,
  preselectedGymId,
}: InteractionFormProps) {
  const [gymId, setGymId] = useState(preselectedGymId || '')
  const [contactId, setContactId] = useState('')
  const [type, setType] = useState<InteractionType>('call')
  const [interactionDate, setInteractionDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [summary, setSummary] = useState('')
  const [outcome, setOutcome] = useState('')
  const [commitments, setCommitments] = useState('')
  const [nextStep, setNextStep] = useState('')
  const [nextStepDate, setNextStepDate] = useState('')
  const [relatedLinks, setRelatedLinks] = useState('')
  const [createTask, setCreateTask] = useState(false)

  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [contacts, setContacts] = useState<Array<{ id: string; full_name: string; job_title?: string | null }>>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  // Load gyms
  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()

    async function loadGyms() {
      const { data } = await supabase.from('gyms').select('id, name').order('name')
      if (data) setGyms(data)
    }

    loadGyms()
  }, [isOpen])

  // Load contacts when gymId changes
  useEffect(() => {
    if (!gymId) {
      setContacts([])
      setContactId('')
      return
    }

    const supabase = createClient()
    async function loadContacts() {
      const { data } = await supabase
        .from('gym_contacts')
        .select('id, full_name, job_title')
        .eq('gym_id', gymId)
        .order('full_name')
      if (data) setContacts(data)
    }

    loadContacts()
  }, [gymId])

  // Reset form when opening
  useEffect(() => {
    if (isOpen) {
      setGymId(preselectedGymId || '')
      setContactId('')
      setType('call')
      setInteractionDate(new Date().toISOString().slice(0, 16))
      setSummary('')
      setOutcome('')
      setCommitments('')
      setNextStep('')
      setNextStepDate('')
      setRelatedLinks('')
      setCreateTask(false)
      setNotification(null)
    }
  }, [isOpen, preselectedGymId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gymId) {
      setNotification({ type: 'error', message: 'Debes seleccionar un gimnasio' })
      return
    }
    if (!summary.trim()) {
      setNotification({ type: 'error', message: 'El resumen de la interacción es obligatorio' })
      return
    }

    try {
      setLoading(true)
      await createInteraction(
        {
          gym_id: gymId,
          contact_id: contactId || null,
          type,
          interaction_date: new Date(interactionDate).toISOString(),
          summary: summary.trim(),
          outcome: outcome.trim() || null,
          commitments: commitments.trim() || null,
          next_step: nextStep.trim() || null,
          next_step_date: nextStepDate || null,
          related_links: relatedLinks.trim() || null,
        },
        createTask
      )

      setNotification({ type: 'success', message: 'Interacción registrada con éxito' })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error al guardar la interacción',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Registrar Interacción</DialogTitle>
        </DialogHeader>

        <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interaction-gym">Gimnasio *</Label>
              <Select
                id="interaction-gym"
                value={gymId}
                onChange={(e) => setGymId(e.target.value)}
                required
              >
                <option value="">Seleccionar gimnasio...</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interaction-contact">Persona de contacto</Label>
              <Select
                id="interaction-contact"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                disabled={!gymId || contacts.length === 0}
              >
                <option value="">
                  {!gymId
                    ? 'Selecciona un gimnasio primero'
                    : contacts.length === 0
                    ? 'Sin contactos guardados'
                    : 'Seleccionar contacto...'}
                </option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} {c.job_title ? `(${c.job_title})` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interaction-type">Tipo de canal</Label>
              <Select
                id="interaction-type"
                value={type}
                onChange={(e) => setType(e.target.value as InteractionType)}
              >
                <option value="call">Llamada telefónica</option>
                <option value="email">Correo electrónico</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="meeting_in_person">Reunión presencial</option>
                <option value="video_call">Videollamada</option>
                <option value="other_platform">Otra plataforma</option>
                <option value="internal_note">Nota interna</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interaction-date">Fecha y hora</Label>
              <Input
                id="interaction-date"
                type="datetime-local"
                value={interactionDate}
                onChange={(e) => setInteractionDate(e.target.value)}
                required
              >
              </Input>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interaction-summary">Resumen de la conversación *</Label>
            <Textarea
              id="interaction-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="¿Qué se ha hablado con el gimnasio?"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interaction-outcome">Resultado / Respuesta</Label>
              <Input
                id="interaction-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="Ej. Interesado, pide propuesta"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interaction-commitments">Compromisos adquiridos</Label>
              <Input
                id="interaction-commitments"
                value={commitments}
                onChange={(e) => setCommitments(e.target.value)}
                placeholder="Ej. Enviar dossier de condiciones"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="interaction-next-step">Próximo paso</Label>
              <Input
                id="interaction-next-step"
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                placeholder="Ej. Llamar para resolver dudas"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="interaction-next-date">Fecha próximo paso</Label>
              <Input
                id="interaction-next-date"
                type="date"
                value={nextStepDate}
                onChange={(e) => setNextStepDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="interaction-links">Enlaces o documentos relacionados</Label>
            <Input
              id="interaction-links"
              value={relatedLinks}
              onChange={(e) => setRelatedLinks(e.target.value)}
              placeholder="https://drive.google.com/..."
            />
          </div>

          {nextStep && (
            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="create-task-checkbox"
                checked={createTask}
                onChange={(e) => setCreateTask(e.target.checked)}
                className="rounded border-input text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <Label
                htmlFor="create-task-checkbox"
                className="text-xs font-normal text-muted-foreground cursor-pointer"
              >
                Crear automáticamente una tarea pendiente para este próximo paso
              </Label>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
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
