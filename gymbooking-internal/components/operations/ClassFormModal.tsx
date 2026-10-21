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
import {
  createClass,
  updateClass,
  saveClassSchedules,
  type ClassInsert,
  type ClassWithDetails,
} from '@/services/operations/onboarding.service'
import { Loader2, Sparkles, Clock, Calendar } from 'lucide-react'

interface ClassFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  preselectedGymId?: string
  initialClass?: ClassWithDetails | null
}

const WEEKDAYS = [
  { day: 1, label: 'L', name: 'Lun' },
  { day: 2, label: 'M', name: 'Mar' },
  { day: 3, label: 'X', name: 'Mié' },
  { day: 4, label: 'J', name: 'Jue' },
  { day: 5, label: 'V', name: 'Vie' },
  { day: 6, label: 'S', name: 'Sáb' },
  { day: 0, label: 'D', name: 'Dom' },
]

export function ClassFormModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedGymId,
  initialClass,
}: ClassFormModalProps) {
  const isEditing = !!initialClass
  const [gymId, setGymId] = useState(preselectedGymId || '')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [disciplineId, setDisciplineId] = useState('')
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'all_levels'>('all_levels')
  const [capacity, setCapacity] = useState('20')
  const [price, setPrice] = useState('15')
  const [durationMinutes, setDurationMinutes] = useState('60')
  const [publicationStatus, setPublicationStatus] = useState<'received' | 'verified' | 'published' | 'unpublished'>('published')

  // Weekly schedule
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 3, 5]) // Mon, Wed, Fri by default
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')

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
      if (initialClass) {
        setGymId(initialClass.gym_id || preselectedGymId || '')
        setName(initialClass.name || '')
        setDescription(initialClass.description || '')
        setDisciplineId(initialClass.discipline_id || '')
        setLevel((initialClass.level as any) || 'all_levels')
        setCapacity(initialClass.capacity ? String(initialClass.capacity) : '20')
        setPrice(initialClass.price ? String(initialClass.price) : '15')
        setDurationMinutes(initialClass.duration_minutes ? String(initialClass.duration_minutes) : '60')
        setPublicationStatus((initialClass.publication_status as any) || 'published')

        const schedules = (initialClass as any).class_schedules || []
        if (schedules.length > 0) {
          setSelectedDays(schedules.map((s: any) => s.day_of_week))
          if (schedules[0].start_time) setStartTime(schedules[0].start_time.slice(0, 5))
          if (schedules[0].end_time) setEndTime(schedules[0].end_time.slice(0, 5))
        } else {
          setSelectedDays([1, 3, 5])
          setStartTime('10:00')
          setEndTime('11:00')
        }
      } else {
        setGymId(preselectedGymId || '')
        setName('')
        setDescription('')
        setDisciplineId('')
        setLevel('all_levels')
        setCapacity('20')
        setPrice('15')
        setDurationMinutes('60')
        setPublicationStatus('published')
        setSelectedDays([1, 3, 5])
        setStartTime('10:00')
        setEndTime('11:00')
      }
      setNotification(null)
    }
  }, [isOpen, initialClass, preselectedGymId])

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    )
  }

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

      const classPayload: Partial<ClassInsert> = {
        organization_id: orgId || '',
        gym_id: gymId,
        discipline_id: disciplineId || null,
        name: name.trim(),
        description: description.trim() || null,
        level,
        capacity: capacity ? parseInt(capacity, 10) : null,
        price: price ? parseFloat(price) : null,
        duration_minutes: durationMinutes ? parseInt(durationMinutes, 10) : 60,
        publication_status: publicationStatus,
        booking_method: 'app',
      }

      if (publicationStatus === 'published') {
        classPayload.last_verified_at = new Date().toISOString()
        if (user?.id) classPayload.verified_by = user.id
      }

      let classId: string

      if (isEditing && initialClass) {
        const updated = await updateClass(initialClass.id, classPayload)
        classId = updated.id
      } else {
        const created = await createClass(classPayload as ClassInsert)
        classId = created.id
      }

      // Save recurring schedules for selected days
      if (classId && selectedDays.length > 0 && startTime && endTime) {
        const schedules = selectedDays.map((d) => ({
          day_of_week: d,
          start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
          end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        }))
        await saveClassSchedules(classId, schedules)
      }

      setNotification({
        type: 'success',
        message: isEditing ? 'Clase actualizada con éxito' : 'Clase añadida y configurada con éxito',
      })

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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            {isEditing ? 'Editar Clase y Horarios' : 'Añadir Nueva Clase'}
          </DialogTitle>
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
              disabled={isEditing}
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
              placeholder="Ej. Crossfit WOD matinal, Vinyasa Yoga, Spinning Pro..."
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
                <option value="">General / Fitness</option>
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

          {/* Horario Semanal Recurrente */}
          <div className="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Horario Semanal Recurrente (Parrilla de la App)
              </Label>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                {selectedDays.length} días seleccionados
              </span>
            </div>

            {/* Weekday buttons */}
            <div className="flex items-center justify-between gap-1">
              {WEEKDAYS.map((w) => {
                const isSelected = selectedDays.includes(w.day)
                return (
                  <button
                    key={w.day}
                    type="button"
                    onClick={() => toggleDay(w.day)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {w.label}
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hora inicio</span>
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Hora fin</span>
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="class-duration">Duración (min)</Label>
              <Input
                id="class-duration"
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
              />
            </div>

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

          {/* Estado de Publicación con Switch Visual */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="class-status" className="font-bold text-xs text-slate-900 dark:text-white">
                  Estado en la App Móvil
                </Label>
                <p className="text-[11px] text-slate-500">
                  Controla si los usuarios pueden ver y reservar esta clase.
                </p>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                  publicationStatus === 'published'
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                }`}
              >
                {publicationStatus === 'published' ? '🟢 Publicada en App' : '🟡 Borrador / Oculta'}
              </span>
            </div>

            <Select
              id="class-status"
              value={publicationStatus}
              onChange={(e) => setPublicationStatus(e.target.value as any)}
              className="text-xs h-9"
            >
              <option value="published">🟢 Publicada (Visible en App para reservas)</option>
              <option value="verified">🔵 Verificada (Revisada por operaciones, lista para publicar)</option>
              <option value="received">⚪ Recibida / Borrador (Solo interna)</option>
              <option value="unpublished">🔴 Pausada / Despublicada de la App</option>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="class-desc">Descripción / Requisitos</Label>
            <Textarea
              id="class-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles sobre equipamiento necesario (toalla, guantes), requisitos o intensidades..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Publicar / Guardar Clase'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
