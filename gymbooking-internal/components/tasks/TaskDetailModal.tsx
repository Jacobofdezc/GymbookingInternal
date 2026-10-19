'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar,
  Clock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Edit2,
  Trash2,
  Send,
  Loader2,
  RotateCcw,
} from 'lucide-react'
import {
  formatDate,
  formatRelativeDate,
  isOverdue,
  cn,
} from '@/lib/utils'
import {
  getTaskComments,
  addTaskComment,
  completeTask,
  updateTask,
  deleteTask,
  type TaskWithRelations,
  type TaskComment,
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'

interface TaskDetailModalProps {
  task: TaskWithRelations | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEditTask?: (task: TaskWithRelations) => void
}

export const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' }
> = {
  pending: { label: 'Pendiente', variant: 'warning', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'En curso', variant: 'info', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  blocked: { label: 'Bloqueada', variant: 'destructive', className: 'bg-rose-50 text-rose-700 border-rose-200' },
  completed: { label: 'Completada', variant: 'success', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Cancelada', variant: 'outline', className: 'bg-slate-50 text-slate-500 border-slate-200' },
}

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  low: { label: 'Baja', className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium: { label: 'Media', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'Alta', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgente', className: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
}

export function TaskDetailModal({
  task,
  open,
  onOpenChange,
  onEditTask,
}: TaskDetailModalProps) {
  const queryClient = useQueryClient()
  const [commentText, setCommentText] = React.useState('')
  const [isDeleting, setIsDeleting] = React.useState(false)

  // Fetch comments
  const {
    data: comments = [],
    isLoading: isCommentsLoading,
    refetch: refetchComments,
  } = useQuery({
    queryKey: ['task-comments', task?.id],
    queryFn: () => (task?.id ? getTaskComments(task.id) : Promise.resolve([])),
    enabled: Boolean(task?.id && open),
  })

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (content: string) => {
      if (!task?.id) throw new Error('No task selected')
      return addTaskComment(task.id, content)
    },
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['task-comments', task?.id] })
    },
  })

  // Complete/Toggle task mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('No task selected')
      if (task.status === 'completed') {
        return updateTask(task.id, { status: 'pending' })
      } else {
        return completeTask(task.id)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      onOpenChange(false)
    },
  })

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!task?.id) throw new Error('No task selected')
      return deleteTask(task.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      setIsDeleting(false)
      onOpenChange(false)
    },
  })

  if (!task) return null

  const isTaskOverdue = isOverdue(task.due_date) && task.status !== 'completed'
  const isCompleted = task.status === 'completed'
  const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    commentMutation.mutate(commentText)
  }

  const handleDelete = () => {
    if (confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción no se puede deshacer.')) {
      setIsDeleting(true)
      deleteMutation.mutate()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full border',
                  statusInfo.className
                )}
              >
                {statusInfo.label}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold rounded border uppercase tracking-wider',
                  priorityInfo.className
                )}
              >
                {priorityInfo.label}
              </span>
            </div>

            {/* Quick action buttons in header */}
            <div className="flex items-center gap-1.5 mr-6">
              {onEditTask && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onOpenChange(false)
                    onEditTask(task)
                  }}
                  className="h-8 text-xs"
                >
                  <Edit2 className="h-3.5 w-3.5 mr-1" />
                  Editar
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive border-border"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>

          <DialogTitle className="text-xl font-bold text-foreground text-left leading-snug">
            {task.title}
          </DialogTitle>
        </DialogHeader>

        {/* Content Body */}
        <div className="space-y-5 py-2">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/40 rounded-xl border border-border/80 text-xs">
            {/* Assignee */}
            <div className="flex items-center gap-2.5">
              <Avatar className="h-7 w-7 border">
                {task.assignee?.avatar_url && (
                  <AvatarImage src={task.assignee.avatar_url} />
                )}
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {task.assignee?.full_name ? task.assignee.full_name[0] : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[11px]">Responsable</span>
                <span className="font-medium text-foreground truncate block">
                  {task.assignee?.full_name || 'Sin responsable asignado'}
                </span>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center shrink-0',
                  isTaskOverdue
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-muted-foreground block text-[11px]">Fecha límite</span>
                <span
                  className={cn(
                    'font-medium truncate block',
                    isTaskOverdue ? 'text-rose-600 font-semibold' : 'text-foreground'
                  )}
                >
                  {task.due_date ? formatDate(task.due_date) : 'Sin fecha asignada'}
                  {isTaskOverdue && ' (¡Vencida!)'}
                </span>
              </div>
            </div>

            {/* Gym Relation */}
            {task.gym && (
              <div className="flex items-center gap-2.5 sm:col-span-2 pt-1 border-t border-border/50">
                <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-muted-foreground block text-[11px]">Gimnasio vinculado</span>
                  <Link
                    href={`/gyms/${task.gym.id}`}
                    className="font-medium text-primary hover:underline truncate block"
                  >
                    {task.gym.name} {task.gym.city ? `(${task.gym.city})` : ''}
                  </Link>
                </div>
              </div>
            )}

            {/* Created info & Completed info */}
            <div className="flex items-center gap-2.5 text-muted-foreground text-[11px] pt-1 border-t border-border/50 sm:col-span-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>
                Creada por {task.creator?.full_name || 'Sistema'} el{' '}
                {formatDate(task.created_at)}
              </span>
              {task.completed_at && (
                <span className="text-emerald-600 font-medium ml-auto">
                  Completada el {formatDate(task.completed_at)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Descripción
            </h4>
            <div className="p-3.5 rounded-lg border border-border bg-card text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
              {task.description || (
                <span className="text-muted-foreground italic text-xs">
                  Sin descripción proporcionada.
                </span>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-primary" />
                Comentarios ({comments.length})
              </h4>
            </div>

            {/* Comments List */}
            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {isCommentsLoading ? (
                <p className="text-xs text-muted-foreground">Cargando comentarios...</p>
              ) : comments.length === 0 ? (
                <p className="text-xs text-muted-foreground/70 italic py-2">
                  No hay comentarios en esta tarea todavía. Sé el primero en comentar.
                </p>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-medium text-foreground">
                        <Avatar className="h-4 w-4">
                          {comment.author?.avatar_url && (
                            <AvatarImage src={comment.author.avatar_url} />
                          )}
                          <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                            {comment.author?.full_name ? comment.author.full_name[0] : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span>{comment.author?.full_name || 'Usuario'}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeDate(comment.created_at)}
                      </span>
                    </div>
                    <p className="text-foreground/90 pl-5.5 whitespace-pre-wrap leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Reply form */}
            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <Textarea
                placeholder="Escribe un comentario o actualización..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                rows={2}
                className="text-xs min-h-[50px] resize-none"
              />
              <Button
                type="submit"
                size="sm"
                disabled={commentMutation.isPending || !commentText.trim()}
                className="h-auto px-3 shrink-0"
              >
                {commentMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Modal Footer with Completion toggle */}
        <DialogFooter className="pt-3 border-t flex items-center justify-between sm:justify-between w-full">
          <Button
            type="button"
            variant={isCompleted ? 'outline' : 'default'}
            onClick={() => toggleCompleteMutation.mutate()}
            disabled={toggleCompleteMutation.isPending}
            className={cn(
              isCompleted
                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            )}
          >
            {toggleCompleteMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : isCompleted ? (
              <RotateCcw className="h-4 w-4 mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            {isCompleted ? 'Reabrir como pendiente' : 'Marcar como completada'}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
