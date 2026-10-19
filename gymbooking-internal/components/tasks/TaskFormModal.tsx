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
import { Loader2 } from 'lucide-react'

interface TaskFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function TaskFormModal({ isOpen, onClose, onSuccess }: TaskFormModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [gymId, setGymId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium')
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0])

  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()

    async function loadChoices() {
      const [gymsRes, profsRes] = await Promise.all([
        supabase.from('gyms').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
      ])
      if (gymsRes.data) setGyms(gymsRes.data)
      if (profsRes.data) setProfiles(profsRes.data)
    }

    loadChoices()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setTitle('')
      setDescription('')
      setGymId('')
      setAssigneeId('')
      setPriority('medium')
      setDueDate(new Date().toISOString().split('T')[0])
      setNotification(null)
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'El título de la tarea es obligatorio' })
      return
    }

    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let orgId: string | undefined
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (profile) orgId = profile.organization_id
      }

      const { error } = await supabase.from('tasks').insert({
        organization_id: orgId || '',
        title: title.trim(),
        description: description.trim() || null,
        gym_id: gymId || null,
        assignee_id: assigneeId || null,
        priority,
        status: 'pending',
        due_date: dueDate || null,
        created_by: user?.id || null,
      })

      if (error) throw error

      setNotification({ type: 'success', message: 'Tarea creada con éxito' })
      setTimeout(() => {
        if (onSuccess) onSuccess()
        onClose()
      }, 500)
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al crear la tarea' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva Tarea</DialogTitle>
        </DialogHeader>

        <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="task-title">Título *</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar propuesta comercial con el gimnasio"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-gym">Gimnasio relacionado</Label>
            <Select
              id="task-gym"
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
            >
              <option value="">Ninguno (Tarea general)</option>
              {gyms.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task-priority">Prioridad</Label>
              <Select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task-due-date">Fecha límite</Label>
              <Input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task-assignee">Asignar a</Label>
            <Select
              id="task-assignee"
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
            <Label htmlFor="task-desc">Descripción</Label>
            <Textarea
              id="task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instrucciones o notas adicionales..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Crear Tarea
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
