'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getGymOnboardingItems,
  updateOnboardingItem,
  initializeChecklistFromTemplate,
  publishGym,
  type GymOnboardingItemWithDetails,
} from '@/services/operations/onboarding.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { NotificationAlert, NotificationState } from '@/components/ui/notification-alert'
import { OnboardingReportModal } from './OnboardingReportModal'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileCheck2,
  FileText,
  Layers,
  Loader2,
  Printer,
  Rocket,
  Sparkles,
  User,
  XCircle,
} from 'lucide-react'

interface GymOnboardingChecklistProps {
  gymId: string
  gymName?: string
}

export function GymOnboardingChecklist({ gymId, gymName }: GymOnboardingChecklistProps) {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{
    id: string
    status: 'pending' | 'in_progress' | 'completed' | 'blocked'
    assignee_id: string
    due_date: string
    comment: string
  } | null>(null)

  const [profiles, setProfiles] = useState<Array<{ id: string; full_name: string }>>([])
  const [notification, setNotification] = useState<NotificationState | null>(null)
  const [isInitializing, setIsInitializing] = useState(false)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)

  const queryClient = useQueryClient()

  // Fetch gym status
  const { data: gymInfo } = useQuery({
    queryKey: ['gym-info-onboarding', gymId],
    queryFn: async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('gyms')
        .select('id, name, onboarding_status:onboarding_statuses(id, name, slug, color)')
        .eq('id', gymId)
        .single()
      return data
    },
    enabled: !!gymId,
  })

  // Publish gym mutation
  const publishGymMutation = useMutation({
    mutationFn: async () => {
      await publishGym(gymId)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-onboarding-items', gymId] })
      queryClient.invalidateQueries({ queryKey: ['gym-info-onboarding', gymId] })
      queryClient.invalidateQueries({ queryKey: ['operations-classes'] })
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] })
      queryClient.invalidateQueries({ queryKey: ['gyms'] })
      setIsPublishModalOpen(false)
      setNotification({
        type: 'success',
        message: '¡Gimnasio publicado exitosamente! Ya está Activo y sus clases verificadas están disponibles.',
      })
    },
    onError: (err: any) => {
      setNotification({
        type: 'error',
        message: err.message || 'Error al publicar el gimnasio',
      })
    },
  })

  // Load profiles for assignees
  useEffect(() => {
    const supabase = createClient()
    async function loadProfiles() {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('is_active', true)
        .order('full_name')
      if (data) setProfiles(data)
    }
    loadProfiles()
  }, [])

  // Fetch checklist items
  const {
    data: items = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['gym-onboarding-items', gymId],
    queryFn: () => getGymOnboardingItems(gymId),
    enabled: !!gymId,
  })

  // Quick toggle checkbox mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ id, isCompleted }: { id: string; isCompleted: boolean }) => {
      return updateOnboardingItem(id, {
        status: isCompleted ? 'completed' : 'pending',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-onboarding-items', gymId] })
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] })
      setNotification({ type: 'success', message: 'Elemento actualizado' })
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Error al actualizar el elemento' })
    },
  })

  // Update item details mutation
  const updateDetailsMutation = useMutation({
    mutationFn: async (payload: {
      id: string
      status: 'pending' | 'in_progress' | 'completed' | 'blocked'
      assignee_id?: string | null
      due_date?: string | null
      comment?: string | null
    }) => {
      return updateOnboardingItem(payload.id, {
        status: payload.status,
        assignee_id: payload.assignee_id || null,
        due_date: payload.due_date || null,
        comment: payload.comment || null,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gym-onboarding-items', gymId] })
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] })
      setExpandedItemId(null)
      setEditingItem(null)
      setNotification({ type: 'success', message: 'Detalles del elemento guardados' })
    },
    onError: (err: any) => {
      setNotification({ type: 'error', message: err.message || 'Error al guardar los cambios' })
    },
  })

  async function handleInitialize() {
    try {
      setIsInitializing(true)
      await initializeChecklistFromTemplate(gymId)
      await refetch()
      queryClient.invalidateQueries({ queryKey: ['operations-stats'] })
      setNotification({
        type: 'success',
        message: 'Checklist inicializado con los 15 pasos estándar',
      })
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error al inicializar el checklist',
      })
    } finally {
      setIsInitializing(false)
    }
  }

  // Calculate metrics
  const total = items.length
  const completed = items.filter((i) => i.status === 'completed').length
  const blockedItems = items.filter((i) => i.status === 'blocked')
  const hasBlocked = blockedItems.length > 0
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const isReadyToPublish = total > 0 && completed === total && !hasBlocked
  const isAlreadyActive = (gymInfo as any)?.onboarding_status?.slug === 'active'

  // Group by category
  const categories: Record<string, { label: string; items: GymOnboardingItemWithDetails[] }> = {
    commercial: { label: 'Comercial', items: [] },
    data: { label: 'Datos y Contenidos', items: [] },
    operations: { label: 'Operaciones y Reservas', items: [] },
    platform: { label: 'Plataforma y Lanzamiento', items: [] },
  }

  items.forEach((item) => {
    const cat = item.category || 'data'
    if (categories[cat]) {
      categories[cat].items.push(item)
    } else {
      categories.data.items.push(item)
    }
  })

  function startEditItem(item: GymOnboardingItemWithDetails) {
    if (expandedItemId === item.id) {
      setExpandedItemId(null)
      setEditingItem(null)
    } else {
      setExpandedItemId(item.id)
      setEditingItem({
        id: item.id,
        status: item.status,
        assignee_id: item.assignee_id || '',
        due_date: item.due_date || '',
        comment: item.comment || '',
      })
    }
  }

  const statusBadges: Record<
    string,
    { label: string; variant: 'outline' | 'info' | 'success' | 'danger' }
  > = {
    pending: { label: 'Pendiente', variant: 'outline' },
    in_progress: { label: 'En progreso', variant: 'info' },
    completed: { label: 'Completado', variant: 'success' },
    blocked: { label: 'Bloqueado', variant: 'danger' },
  }

  return (
    <div className="space-y-6">
      <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

      {/* Progress & Readiness Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileCheck2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              Checklist de incorporación {gymName ? `— ${gymName}` : ''}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Pasos obligatorios para validar y publicar el gimnasio en la plataforma GymBooking
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAlreadyActive ? (
              <Badge variant="success" className="gap-1 font-bold py-1 px-3 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Publicado & Activo
              </Badge>
            ) : (
              <Button
                size="sm"
                onClick={() => setIsPublishModalOpen(true)}
                disabled={items.length === 0}
                className="gap-1.5 text-xs h-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs font-semibold cursor-pointer"
                title="Publicar gimnasio en la plataforma"
              >
                <Rocket className="w-3.5 h-3.5" />
                Publicar Gimnasio
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportOpen(true)}
              disabled={items.length === 0}
              className="gap-1.5 text-xs h-8 rounded-xl border-slate-200/90 dark:border-slate-700 shadow-2xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              title="Generar e imprimir acta de incorporación"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Acta de activación
            </Button>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block">Listo para publicar</span>
              <span
                className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-0.5 rounded-full border ${
                  isReadyToPublish
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/70 dark:border-emerald-800'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200/70 dark:border-amber-800'
                }`}
              >
                {isReadyToPublish ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    SÍ (100%)
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    NO ({completed}/{total})
                  </>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {total > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progreso total: {completed} de {total} tareas completadas</span>
              <span className="font-semibold text-foreground">{percent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 rounded-full ${
                  isReadyToPublish
                    ? 'bg-emerald-500'
                    : hasBlocked
                    ? 'bg-amber-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Active Banner */}
        {isAlreadyActive && (
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 text-xs font-semibold">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <span>Este gimnasio está actualmente ACTIVO y publicado en GymBooking.</span>
                <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Las clases verificadas están disponibles para los usuarios finales.
                </p>
              </div>
            </div>
            <Badge variant="success" className="font-bold">Activo</Badge>
          </div>
        )}

        {/* Ready To Publish Callout */}
        {!isAlreadyActive && isReadyToPublish && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-blue-200 dark:border-blue-900 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 text-slate-800 dark:text-slate-200 text-xs">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs shrink-0">
                <Rocket className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">¡Onboarding 100% completado!</span>
                <p className="text-slate-600 dark:text-slate-300 text-xs mt-0.5">
                  El centro cumple todos los requisitos técnicos y operativos para activarse en la plataforma.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => setIsPublishModalOpen(true)}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs shrink-0 cursor-pointer"
            >
              <Rocket className="h-4 w-4" />
              Publicar Gimnasio
            </Button>
          </div>
        )}

        {/* Blocked Warning */}
        {hasBlocked && (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 bg-red-50 text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 text-sm animate-in fade-in">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
            <div>
              <span className="font-semibold">Atención: Hay elementos bloqueados</span>
              <p className="text-xs mt-0.5">
                {blockedItems.map((b) => b.title).join(', ')}. Resuelve estos bloqueos antes de proceder con la activación.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Checklist Content */}
      {isLoading ? (
        <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Loader2 className="h-7 w-7 animate-spin" />
          <span className="text-sm">Cargando checklist del gimnasio...</span>
        </div>
      ) : isError ? (
        <div className="p-8 text-center bg-card rounded-xl border">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-foreground font-medium">Error al cargar el checklist</p>
          <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
            Reintentar
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-card rounded-xl border space-y-4">
          <div className="inline-flex p-3 rounded-full bg-primary/10 text-primary">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            No se ha iniciado el checklist para este gimnasio
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Puedes cargar automáticamente el proceso estándar de 15 pasos de GymBooking para comenzar el onboarding.
          </p>
          <Button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="cursor-pointer"
          >
            {isInitializing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Inicializar checklist desde plantilla
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(categories).map(([catKey, cat]) => {
            if (cat.items.length === 0) return null
            const catCompleted = cat.items.filter((i) => i.status === 'completed').length

            return (
              <div key={catKey} className="rounded-xl border bg-card shadow-2xs overflow-hidden">
                <div className="bg-muted/40 px-4 py-3 border-b flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-foreground">{cat.label}</h4>
                  <span className="text-xs text-muted-foreground font-medium">
                    {catCompleted}/{cat.items.length} completados
                  </span>
                </div>

                <div className="divide-y divide-border">
                  {cat.items.map((item) => {
                    const isCompleted = item.status === 'completed'
                    const isExpanded = expandedItemId === item.id
                    const badge = statusBadges[item.status] || statusBadges.pending

                    return (
                      <div key={item.id} className="transition-colors">
                        <div
                          className="flex items-start sm:items-center justify-between p-3.5 sm:px-4 hover:bg-muted/20 gap-3 cursor-pointer"
                          onClick={() => startEditItem(item)}
                        >
                          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                            {/* Complete Toggle Checkbox */}
                            <input
                              type="checkbox"
                              checked={isCompleted}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleCompleteMutation.mutate({
                                  id: item.id,
                                  isCompleted: e.target.checked,
                                })
                              }}
                              className="h-4 w-4 rounded border-input text-primary focus:ring-primary mt-1 sm:mt-0 cursor-pointer shrink-0"
                            />

                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-sm font-medium ${
                                  isCompleted
                                    ? 'line-through text-muted-foreground'
                                    : 'text-foreground'
                                }`}
                              >
                                {item.title}
                              </span>
                              {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {item.description}
                                </p>
                              )}
                              {item.comment && (
                                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 line-clamp-1 italic">
                                  Nota: {item.comment}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <Badge variant={badge.variant}>{badge.label}</Badge>

                            {item.assignee && (
                              <span className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                                <User className="h-3 w-3" />
                                {item.assignee.full_name}
                              </span>
                            )}

                            {item.due_date && (
                              <span className="hidden sm:inline text-xs text-muted-foreground">
                                {formatDate(item.due_date)}
                              </span>
                            )}

                            <div className="text-muted-foreground">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Inline Edit Form */}
                        {isExpanded && editingItem && editingItem.id === item.id && (
                          <div className="p-4 bg-muted/30 border-t border-border space-y-4">
                            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              Editar detalles del paso
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <Label className="text-xs">Estado</Label>
                                <Select
                                  value={editingItem.status}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      status: e.target.value as any,
                                    })
                                  }
                                  className="text-xs h-8"
                                >
                                  <option value="pending">Pendiente</option>
                                  <option value="in_progress">En progreso</option>
                                  <option value="completed">Completado</option>
                                  <option value="blocked">Bloqueado</option>
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Responsable</Label>
                                <Select
                                  value={editingItem.assignee_id}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      assignee_id: e.target.value,
                                    })
                                  }
                                  className="text-xs h-8"
                                >
                                  <option value="">Sin asignar</option>
                                  {profiles.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.full_name}
                                    </option>
                                  ))}
                                </Select>
                              </div>

                              <div className="space-y-1">
                                <Label className="text-xs">Fecha límite</Label>
                                <Input
                                  type="date"
                                  value={editingItem.due_date}
                                  onChange={(e) =>
                                    setEditingItem({
                                      ...editingItem,
                                      due_date: e.target.value,
                                    })
                                  }
                                  className="text-xs h-8"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-xs">Comentario / Observaciones</Label>
                              <Textarea
                                value={editingItem.comment}
                                onChange={(e) =>
                                  setEditingItem({
                                    ...editingItem,
                                    comment: e.target.value,
                                  })
                                }
                                placeholder="Añadir notas sobre este paso..."
                                rows={2}
                                className="text-xs"
                              />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setExpandedItemId(null)
                                  setEditingItem(null)
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => updateDetailsMutation.mutate(editingItem)}
                                disabled={updateDetailsMutation.isPending}
                              >
                                {updateDetailsMutation.isPending && (
                                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                )}
                                Guardar
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Onboarding Activation Report Modal */}
      <OnboardingReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        gymName={gymName}
        gymId={gymId}
        items={items}
      />

      {/* Publish Gym Confirmation Modal */}
      <Dialog open={isPublishModalOpen} onOpenChange={setIsPublishModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <Rocket className="h-5 w-5 text-blue-600" />
              Publicar gimnasio en GymBooking
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              ¿Confirmas el lanzamiento y publicación de <strong>{gymName || 'este gimnasio'}</strong> en la plataforma?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5 text-slate-700">
              <p className="font-semibold text-slate-900">Al confirmar, el sistema ejecutará:</p>
              <ul className="list-disc pl-4 space-y-1 text-slate-600">
                <li>El estado de incorporación cambiará a <strong>Activo</strong>.</li>
                <li>Todas las clases verificadas pasarán automáticamente a <strong>Publicado</strong>.</li>
                <li>Quedará registrado el hito oficial en la auditoría de la organización.</li>
              </ul>
            </div>

            {!isReadyToPublish && (
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
                <span>
                  Atención: Hay tareas pendientes en el checklist ({completed}/{total}). Se realizará una publicación manual.
                </span>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPublishModalOpen(false)}
              disabled={publishGymMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => publishGymMutation.mutate()}
              disabled={publishGymMutation.isPending}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer"
            >
              {publishGymMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirmar Publicación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
