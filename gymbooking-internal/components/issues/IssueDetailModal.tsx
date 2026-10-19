'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { NotificationAlert, NotificationState } from '@/components/ui/notification-alert'
import {
  getIssueById,
  updateIssue,
  resolveIssue,
  addIssueComment,
  type IssueWithDetails,
} from '@/services/issues/issue.service'
import { formatDate } from '@/lib/utils'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Paperclip,
  Send,
  ShieldAlert,
  User,
  Check,
  Ban,
  Search,
} from 'lucide-react'
import Link from 'next/link'

interface IssueDetailModalProps {
  issueId: string | null
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function IssueDetailModal({
  issueId,
  isOpen,
  onClose,
  onUpdate,
}: IssueDetailModalProps) {
  const [issue, setIssue] = useState<IssueWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)
  const [resolvingMode, setResolvingMode] = useState(false)
  const [solutionText, setSolutionText] = useState('')
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  useEffect(() => {
    if (!isOpen || !issueId) {
      setIssue(null)
      setResolvingMode(false)
      setSolutionText('')
      return
    }

    async function load() {
      try {
        setLoading(true)
        const data = await getIssueById(issueId!)
        setIssue(data)
        if (data?.solution_applied) {
          setSolutionText(data.solution_applied)
        }
      } catch (err: any) {
        setNotification({
          type: 'error',
          message: err.message || 'Error al cargar detalles de la incidencia',
        })
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [isOpen, issueId])

  async function handleStatusChange(newStatus: string) {
    if (!issue) return

    if (newStatus === 'resolved') {
      setResolvingMode(true)
      return
    }

    try {
      setUpdatingStatus(true)
      await updateIssue(issue.id, { status: newStatus })
      const updated = await getIssueById(issue.id)
      setIssue(updated)
      onUpdate()
      setNotification({ type: 'success', message: `Estado actualizado a "${newStatus}"` })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al cambiar estado' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleConfirmResolve() {
    if (!issue) return
    if (!solutionText.trim()) {
      setNotification({ type: 'error', message: 'Por favor detalla la solución aplicada' })
      return
    }

    try {
      setUpdatingStatus(true)
      await resolveIssue(issue.id, solutionText.trim())
      const updated = await getIssueById(issue.id)
      setIssue(updated)
      setResolvingMode(false)
      onUpdate()
      setNotification({ type: 'success', message: 'Incidencia resuelta correctamente' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al resolver la incidencia' })
    } finally {
      setUpdatingStatus(false)
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault()
    if (!issue || !newComment.trim()) return

    try {
      setSubmittingComment(true)
      await addIssueComment(issue.id, newComment.trim())
      setNewComment('')
      const updated = await getIssueById(issue.id)
      setIssue(updated)
      setNotification({ type: 'success', message: 'Comentario añadido' })
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Error al enviar comentario' })
    } finally {
      setSubmittingComment(false)
    }
  }

  const priorityBadges: Record<string, { label: string; variant: 'outline' | 'info' | 'warning' | 'danger' }> = {
    low: { label: 'Baja', variant: 'outline' },
    medium: { label: 'Media', variant: 'info' },
    high: { label: 'Alta', variant: 'warning' },
    urgent: { label: 'Urgente', variant: 'danger' },
  }

  const statusLabels: Record<string, string> = {
    open: 'Abierta',
    investigating: 'Investigando',
    in_progress: 'En progreso',
    blocked: 'Bloqueada',
    resolved: 'Resuelta',
    closed: 'Cerrada',
  }

  const typeLabels: Record<string, string> = {
    technical_error: 'Error técnico',
    commercial: 'Comercial',
    gym_data: 'Datos gimnasio',
    schedules: 'Horarios',
    classes: 'Clases',
    bookings: 'Reservas',
    user: 'Usuario',
    security: 'Seguridad',
    other: 'Otro',
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2 pr-8">
            {issue && (
              <>
                <Badge variant={priorityBadges[issue.priority]?.variant || 'outline'}>
                  {priorityBadges[issue.priority]?.label || issue.priority}
                </Badge>
                <Badge variant="outline">{typeLabels[issue.type] || issue.type}</Badge>
                <Badge
                  variant={
                    issue.status === 'resolved'
                      ? 'success'
                      : issue.status === 'blocked'
                      ? 'danger'
                      : issue.status === 'in_progress'
                      ? 'warning'
                      : 'outline'
                  }
                >
                  {statusLabels[issue.status] || issue.status}
                </Badge>
              </>
            )}
          </div>
          <DialogTitle className="text-xl mt-1">
            {loading ? 'Cargando incidencia...' : issue?.title || 'Detalle de Incidencia'}
          </DialogTitle>
        </DialogHeader>

        <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Cargando detalles...</p>
          </div>
        ) : !issue ? (
          <div className="py-12 text-center text-muted-foreground">
            No se encontró la incidencia.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Action Bar for Status Changes */}
            <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-3 rounded-lg border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-1">
                Cambiar estado:
              </span>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'open' ? 'secondary' : 'outline'}
                onClick={() => handleStatusChange('open')}
                disabled={updatingStatus || issue.status === 'open'}
              >
                Abierta
              </Button>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'investigating' ? 'secondary' : 'outline'}
                onClick={() => handleStatusChange('investigating')}
                disabled={updatingStatus || issue.status === 'investigating'}
              >
                <Search className="h-3.5 w-3.5 mr-1" />
                Investigando
              </Button>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'in_progress' ? 'secondary' : 'outline'}
                onClick={() => handleStatusChange('in_progress')}
                disabled={updatingStatus || issue.status === 'in_progress'}
              >
                <Clock className="h-3.5 w-3.5 mr-1" />
                En progreso
              </Button>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'blocked' ? 'destructive' : 'outline'}
                onClick={() => handleStatusChange('blocked')}
                disabled={updatingStatus || issue.status === 'blocked'}
              >
                <Ban className="h-3.5 w-3.5 mr-1" />
                Bloqueada
              </Button>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'resolved' ? 'default' : 'outline'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setResolvingMode(true)}
                disabled={updatingStatus || issue.status === 'resolved'}
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Resolver
              </Button>
              <Button
                type="button"
                size="sm"
                variant={issue.status === 'closed' ? 'secondary' : 'outline'}
                onClick={() => handleStatusChange('closed')}
                disabled={updatingStatus || issue.status === 'closed'}
              >
                Cerrar
              </Button>
            </div>

            {/* Resolving Box Form */}
            {resolvingMode && (
              <div className="p-4 rounded-lg border-2 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold text-sm">
                  <CheckCircle2 className="h-5 w-5" />
                  Indica la solución aplicada para resolver la incidencia
                </div>
                <Textarea
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Detalla qué cambios o corrección se han realizado..."
                  rows={3}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setResolvingMode(false)}
                    disabled={updatingStatus}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={handleConfirmResolve}
                    disabled={updatingStatus}
                  >
                    {updatingStatus && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmar resolución
                  </Button>
                </div>
              </div>
            )}

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-card p-4 rounded-lg border text-sm">
              <div>
                <span className="text-xs text-muted-foreground block">Gimnasio</span>
                {issue.gym ? (
                  <Link
                    href={`/gyms/${issue.gym.id}`}
                    className="font-medium text-primary hover:underline flex items-center gap-1.5 mt-0.5"
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    {issue.gym.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">General</span>
                )}
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Asignado a</span>
                <span className="font-medium flex items-center gap-1.5 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  {issue.assignee?.full_name || 'Sin asignar'}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Fecha límite</span>
                <span className="font-medium flex items-center gap-1.5 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(issue.due_date) || 'Sin fecha'}
                </span>
              </div>

              <div>
                <span className="text-xs text-muted-foreground block">Registrada el</span>
                <span className="font-medium flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(issue.created_at)}
                </span>
              </div>
            </div>

            {/* Description */}
            {issue.description && (
              <div className="space-y-1.5">
                <h4 className="text-sm font-semibold text-foreground">Descripción</h4>
                <div className="p-3 bg-muted/30 rounded-md text-sm whitespace-pre-wrap border">
                  {issue.description}
                </div>
              </div>
            )}

            {/* Reproduction steps if any */}
            {issue.reproduction_steps && (
              <div className="space-y-1.5 border-l-2 border-amber-500 pl-3">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                  Pasos de reproducción
                </h4>
                <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-md text-sm whitespace-pre-wrap border border-amber-200 dark:border-amber-900">
                  {issue.reproduction_steps}
                </div>
              </div>
            )}

            {/* Solution Applied */}
            {issue.solution_applied && (
              <div className="space-y-1.5 border-l-2 border-emerald-500 pl-3">
                <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  Solución aplicada
                </h4>
                <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-md text-sm whitespace-pre-wrap border border-emerald-200 dark:border-emerald-900">
                  {issue.solution_applied}
                </div>
                {issue.resolved_at && (
                  <span className="text-xs text-muted-foreground block mt-1">
                    Resuelta el {formatDate(issue.resolved_at)}
                  </span>
                )}
              </div>
            )}

            {/* Linked Tasks */}
            {issue.linked_tasks && issue.linked_tasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Tareas vinculadas ({issue.linked_tasks.length})
                </h4>
                <div className="space-y-1.5">
                  {issue.linked_tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2.5 rounded-md border bg-card text-sm"
                    >
                      <span className="font-medium">{task.title}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{task.status}</Badge>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground">
                            {formatDate(task.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {issue.attachments && issue.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Paperclip className="h-4 w-4 text-primary" />
                  Archivos adjuntos ({issue.attachments.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {issue.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-2 rounded border bg-card text-xs text-muted-foreground"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>{att.file_name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />
                Comentarios ({issue.comments?.length || 0})
              </h4>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {issue.comments && issue.comments.length > 0 ? (
                  issue.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 rounded-lg bg-muted/40 border space-y-1 text-sm"
                    >
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {comment.created_by_profile?.full_name || 'Usuario'}
                        </span>
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="whitespace-pre-wrap text-foreground/90">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No hay comentarios aún. Sé el primero en comentar.
                  </p>
                )}
              </div>

              {/* Add Comment Input */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escribe un comentario..."
                  rows={2}
                  className="text-sm"
                />
                <Button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="self-end"
                >
                  {submittingComment ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  <span className="sr-only">Enviar</span>
                </Button>
              </form>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
