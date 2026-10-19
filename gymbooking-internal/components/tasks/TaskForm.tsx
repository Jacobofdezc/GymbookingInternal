'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, Tag as TagIcon, X } from 'lucide-react'
import { taskSchema, type TaskFormValues } from '@/lib/validations/task.schema'
import {
  createTask,
  updateTask,
  getTeamMembers,
  getGymsForSelect,
  type TaskWithRelations,
} from '@/services/tasks/task.service'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface TaskFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskToEdit?: TaskWithRelations | null
  defaultGymId?: string
}

export function TaskForm({
  open,
  onOpenChange,
  taskToEdit,
  defaultGymId,
}: TaskFormProps) {
  const queryClient = useQueryClient()
  const isEditing = Boolean(taskToEdit)

  // Fetch team members and gyms for select dropdowns
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: getTeamMembers,
    enabled: open,
  })

  const { data: gyms = [] } = useQuery({
    queryKey: ['gyms-select'],
    queryFn: getGymsForSelect,
    enabled: open,
  })

  // Tag list state
  const [tags, setTags] = React.useState<string[]>([])
  const [tagInput, setTagInput] = React.useState('')

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      assignee_id: null,
      priority: 'medium',
      status: 'pending',
      due_date: '',
      gym_id: defaultGymId || null,
    },
  })

  // Sync form when opening or changing taskToEdit
  React.useEffect(() => {
    if (open) {
      if (taskToEdit) {
        reset({
          title: taskToEdit.title,
          description: taskToEdit.description || '',
          assignee_id: taskToEdit.assignee_id || null,
          priority: taskToEdit.priority,
          status: taskToEdit.status,
          due_date: taskToEdit.due_date || '',
          gym_id: taskToEdit.gym_id || null,
        })
        setTags(taskToEdit.tags?.map((t) => t.name) || [])
      } else {
        reset({
          title: '',
          description: '',
          assignee_id: null,
          priority: 'medium',
          status: 'pending',
          due_date: '',
          gym_id: defaultGymId || null,
        })
        setTags([])
      }
      setTagInput('')
    }
  }, [open, taskToEdit, defaultGymId, reset])

  const mutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      if (isEditing && taskToEdit) {
        return updateTask(taskToEdit.id, {
          ...values,
          tags,
        })
      } else {
        return createTask({
          ...values,
          tags,
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false)
    },
  })

  const onSubmit = (data: TaskFormValues) => {
    mutation.mutate(data)
  }

  const handleAddTag = () => {
    const trimmed = tagInput.trim()
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Tarea' : 'Crear Nueva Tarea'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifica los detalles y asignación de la tarea seleccionada.'
              : 'Asigna una tarea a un miembro del equipo o vincúlala a un gimnasio.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Título <span className="text-destructive">*</span>
            </label>
            <Input
              placeholder="Ej. Llamar para confirmar reunión de onboarding"
              {...register('title')}
              className={errors.title ? 'border-destructive focus-visible:ring-destructive' : ''}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Descripción
            </label>
            <Textarea
              placeholder="Detalles adicionales, objetivos o notas relevantes..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Responsable
              </label>
              <select
                {...register('assignee_id')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">Sin responsable</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Fecha límite
              </label>
              <Input type="date" {...register('due_date')} />
            </div>
          </div>

          {/* Priority & Status Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Prioridad
              </label>
              <select
                {...register('priority')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Estado
              </label>
              <select
                {...register('status')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pending">Pendiente</option>
                <option value="in_progress">En curso</option>
                <option value="blocked">Bloqueada</option>
                <option value="completed">Completada</option>
                <option value="cancelled">Cancelada</option>
              </select>
            </div>
          </div>

          {/* Associated Gym */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Gimnasio vinculado
            </label>
            <select
              {...register('gym_id')}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Ninguno / General</option>
              {gyms.map((gym) => (
                <option key={gym.id} value={gym.id}>
                  {gym.name} {gym.city ? `(${gym.city})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />
              Etiquetas
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Nueva etiqueta (ej. Comercial, Urgente)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddTag}
                className="h-8 text-xs shrink-0"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Añadir
              </Button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 text-xs py-0.5 px-2 font-normal"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {mutation.isError && (
            <p className="text-xs text-destructive bg-destructive/10 p-2.5 rounded-md">
              {(mutation.error as Error)?.message || 'Ocurrió un error al guardar la tarea'}
            </p>
          )}

          <DialogFooter className="pt-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {isEditing ? 'Guardar Cambios' : 'Crear Tarea'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
