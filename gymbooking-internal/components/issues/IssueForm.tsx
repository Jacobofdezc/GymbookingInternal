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
import { createIssue, updateIssue, type IssueWithDetails } from '@/services/issues/issue.service'
import { AlertCircle, Loader2 } from 'lucide-react'

interface IssueFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialIssue?: IssueWithDetails | null
  preselectedGymId?: string
}

export function IssueForm({
  isOpen,
  onClose,
  onSuccess,
  initialIssue,
  preselectedGymId,
}: IssueFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('technical_error')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [status, setStatus] = useState('open')
  const [assigneeId, setAssigneeId] = useState('')
  const [gymId, setGymId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [reproductionSteps, setReproductionSteps] = useState('')

  const [loading, setLoading] = useState(false)
  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string }>>([])
  const [notification, setNotification] = useState<NotificationState | null>(null)

  // Load gyms and profiles for dropdowns
  useEffect(() => {
    if (!isOpen) return

    const supabase = createClient()

    async function loadSelectData() {
      try {
        const [gymsRes, profilesRes] = await Promise.all([
          supabase.from('gyms').select('id, name').order('name'),
          supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
        ])
        if (gymsRes.data) setGyms(gymsRes.data)
        if (profilesRes.data) setProfiles(profilesRes.data)
      } catch (err) {
        console.error('Error loading form choices:', err)
      }
    }

    loadSelectData()
  }, [isOpen])

  // Populate fields if editing
  useEffect(() => {
    if (initialIssue) {
      setTitle(initialIssue.title || '')
      setDescription(initialIssue.description || '')
      setType(initialIssue.type || 'technical_error')
      setPriority((initialIssue.priority as any) || 'medium')
      setStatus(initialIssue.status || 'open')
      setAssigneeId(initialIssue.assignee_id || '')
      setGymId(initialIssue.gym_id || '')
      setDueDate(initialIssue.due_date || '')
      setReproductionSteps(initialIssue.reproduction_steps || '')
    } else {
      setTitle('')
      setDescription('')
      setType('technical_error')
      setPriority('medium')
      setStatus('open')
      setAssigneeId('')
      setGymId(preselectedGymId || '')
      setDueDate('')
      setReproductionSteps('')
    }
  }, [initialIssue, preselectedGymId, isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'El título es obligatorio' })
      return
    }

    try {
      setLoading(true)
      const payload: any = {
        title: title.trim(),
        description: description.trim() || null,
        type,
        priority,
        status,
        assignee_id: assigneeId || null,
        gym_id: gymId || null,
        due_date: dueDate || null,
        reproduction_steps: type === 'technical_error' ? reproductionSteps.trim() || null : null,
      }

      if (initialIssue?.id) {
        await updateIssue(initialIssue.id, payload)
      } else {
        await createIssue(payload)
      }

      setNotification({
        type: 'success',
        message: initialIssue?.id ? 'Incidencia actualizada' : 'Incidencia registrada con éxito',
      })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error al guardar la incidencia',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {initialIssue ? 'Editar Incidencia' : 'Nueva Incidencia'}
          </DialogTitle>
        </DialogHeader>

        <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="issue-title">Título *</Label>
            <Input
              id="issue-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Error en sincronización de reservas"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="issue-type">Tipo de incidencia</Label>
              <Select
                id="issue-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="technical_error">Error técnico (Bug)</option>
                <option value="commercial">Comercial</option>
                <option value="gym_data">Datos de gimnasio</option>
                <option value="schedules">Horarios</option>
                <option value="classes">Clases</option>
                <option value="bookings">Reservas</option>
                <option value="user">Usuario / Cliente</option>
                <option value="security">Seguridad</option>
                <option value="other">Otro</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issue-priority">Prioridad</Label>
              <Select
                id="issue-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="issue-assignee">Asignado a</Label>
              <Select
                id="issue-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                <option value="">Sin asignar</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="issue-gym">Gimnasio asociado (opcional)</Label>
              <Select
                id="issue-gym"
                value={gymId}
                onChange={(e) => setGymId(e.target.value)}
              >
                <option value="">Ninguno</option>
                {gyms.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issue-due-date">Fecha límite</Label>
            <Input
              id="issue-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issue-description">Descripción</Label>
            <Textarea
              id="issue-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre lo ocurrido o la petición..."
              rows={3}
            />
          </div>

          {type === 'technical_error' && (
            <div className="space-y-1.5 border-l-2 border-amber-400 pl-3">
              <Label htmlFor="issue-reproduction" className="text-amber-800 dark:text-amber-400">
                Pasos para reproducir el error
              </Label>
              <Textarea
                id="issue-reproduction"
                value={reproductionSteps}
                onChange={(e) => setReproductionSteps(e.target.value)}
                placeholder="1. Ir a la pantalla de...&#10;2. Pulsar en el botón...&#10;3. Se muestra el error..."
                rows={3}
              />
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialIssue ? 'Guardar Cambios' : 'Crear Incidencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
