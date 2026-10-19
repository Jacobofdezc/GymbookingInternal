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
import { createClass, type ClassInsert } from '@/services/operations/onboarding.service'
import { Loader2 } from 'lucide-react'

interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedGymId?: string
}

export function ClassFormModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedGymId,
}: ClassFormModalProps) {
  const [gymId, setGymId] = useState(preselectedGymId || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels')
  const [capacity, setCapacity] = useState('20')
  const [price, setPrice] = useState('15')
  const [publicationStatus, setPublicationStatus] = useState<'received' | 'verified' | 'published'>('received')

  const [gyms, setGyms] = useState<Array<{ id: string; name: string }>>([])
  const [disciplines, setDisciplines] = useState<Array<{ id: string; name: string }>>([])
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const supabase = createClient()

    async function loadSelects() {
      const [gymsRes, discRes] = await Promise.all([
        supabase.from('gyms').select('id, name').order('name'),
        supabase.from('disciplines').select('id, name').order('name'),
      ])
      if (gymsRes.data) setGyms(gymsRes.data)
      if (discRes.data) setDisciplines(discRes.data)
    }

    loadSelects()
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setGymId(preselectedGymId || '')
      setName('')
      setDescription('')
      setDisciplineId('')
      setLevel('all_levels')
      setCapacity('20')
      setPrice('15')
      setPublicationStatus('received')
      setNotification(null)
    }
  }, [isOpen, preselectedGymId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!gymId) {
      setNotification({ type: 'error', message: 'Debes seleccionar un gimnasio' })
      return
    }
    if (!name.trim()) {
      setNotification({ type: 'error', message: 'El nombre de la clase es obligatorio' })
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

      await createClass({
        organization_id: orgId || '',
        gym_id: gymId,
        discipline_id: disciplineId || null,
        name: name.trim(),
        description: description.trim() || null,
        level,
        capacity: capacity ? parseInt(capacity, 10) : null,
        price: price ? parseFloat(price) : null,
        publication_status: publicationStatus,
      })

      setNotification({ type: 'success', message: 'Clase añadida con éxito' })
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 500)
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al guardar la clase' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nueva Clase</DialogTitle>
        </DialogHeader>

        <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="class-gym">Gimnasio *</Label>
            <Select
              id="class-gym"
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
            <Label htmlFor="class-name">Nombre de la clase *</Label>
            <Input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Crossfit WOD matinal"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class-disc">Disciplina</Label>
              <Select
                id="class-disc"
                value={disciplineId}
                onChange={(e) => setDisciplineId(e.target.value)}
              >
                <option value="">General</option>
                {disciplines.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-level">Nivel</Label>
              <Select
                id="class-level"
                value={level}
                onChange={(e) => setLevel(e.target.value as any)}
              >
                <option value="all_levels">Todos los niveles</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class-capacity">Aforo máx.</Label>
              <Input
                id="class-capacity"
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="class-price">Precio (€)</Label>
              <Input
                id="class-price"
                type="number"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class-status">Estado de publicación</Label>
            <Select
              id="class-status"
              value={publicationStatus}
              onChange={(e) => setPublicationStatus(e.target.value as any)}
            >
              <option value="received">Recibido (Pendiente de verificación)</option>
              <option value="verified">Verificado</option>
              <option value="published">Publicado</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class-desc">Descripción</Label>
            <Textarea
              id="class-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre equipamiento necesario, requisitos..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Clase
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
