'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  getClasses,
  togglePublishClass,
  type ClassWithDetails,
} from '@/services/operations/onboarding.service'
import { GymOnboardingChecklist } from './GymOnboardingChecklist'
import { ClassFormModal } from './ClassFormModal'
import { AppPreviewModal } from '@/components/gyms/AppPreviewModal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  Filter,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  User,
  Users,
  Smartphone,
  Edit,
  Loader2,
} from 'lucide-react'

interface ConfirmedGymItem {
  id: string
  name: string
  city?: string | null
  commercial_status?: { name: string; color: string } | null
  onboarding_status?: { name: string; color: string; slug: string } | null
}

interface OperationsClientProps {
  confirmedGyms: ConfirmedGymItem[]
  stats: {
    confirmedCount: number
    pendingOnboardingCount: number
    activeCount: number
  }
}

type TabType = 'checklist' | 'classes'

export function OperationsClient({ confirmedGyms, stats }: OperationsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('checklist')
  const [selectedGymId, setSelectedGymId] = useState<string>(
    confirmedGyms[0]?.id || ''
  )

  // Classes filters
  const [classGymFilter, setClassGymFilter] = useState('all')
  const [classStatusFilter, setClassStatusFilter] = useState('all')
  const [isClassModalOpen, setIsClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<ClassWithDetails | null>(null)
  const [isAppPreviewOpen, setIsAppPreviewOpen] = useState(false)
  const [previewGymData, setPreviewGymData] = useState<any | null>(null)
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null)

  const queryClient = useQueryClient()

  // Selected gym object
  const selectedGym = confirmedGyms.find((g) => g.id === selectedGymId)

  const handleTogglePublish = async (classId: string, currentStatus: string) => {
    try {
      setTogglingClassId(classId)
      const shouldPublish = currentStatus !== 'published'
      await togglePublishClass(classId, shouldPublish)
      queryClient.invalidateQueries({ queryKey: ['operations-classes'] })
    } catch (err: any) {
      alert(err.message || 'Error al cambiar publicación')
    } finally {
      setTogglingClassId(null)
    }
  }

  const openAppPreviewForGym = (gymId: string, gymName: string) => {
    const gymClasses = classes.filter((c) => c.gym_id === gymId)
    setPreviewGymData({
      id: gymId,
      name: gymName,
      classes: gymClasses,
    })
    setIsAppPreviewOpen(true)
  }

  // Fetch classes
  const {
    data: classes = [],
    isLoading: isLoadingClasses,
    refetch: refetchClasses,
    isFetching: isFetchingClasses,
  } = useQuery({
    queryKey: ['operations-classes', classGymFilter, classStatusFilter],
    queryFn: () =>
      getClasses({
        gym_id: classGymFilter !== 'all' ? classGymFilter : undefined,
        publication_status: classStatusFilter !== 'all' ? classStatusFilter : undefined,
      }),
  })

  const publicationBadges: Record<
    string,
    { label: string; variant: 'outline' | 'warning' | 'success' | 'secondary' }
  > = {
    received: { label: 'Recibido', variant: 'outline' },
    verified: { label: 'Verificado', variant: 'warning' },
    published: { label: 'Publicado', variant: 'success' },
    unpublished: { label: 'Despublicado', variant: 'secondary' },
    archived: { label: 'Archivado', variant: 'outline' },
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">Operaciones</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Centro de incorporación técnica, checklist de activación y validación de clases
          </p>
        </div>
      </div>

      {/* Operations Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/70 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{stats.confirmedCount}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">Gimnasios confirmados</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200/70 dark:border-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {stats.pendingOnboardingCount}
            </span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">Pendientes de onboarding</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/70 dark:border-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{stats.activeCount}</span>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">Gimnasios activos en app</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
            activeTab === 'checklist'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-2xs border border-slate-200/70 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Checklist de incorporación</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs whitespace-nowrap transition-all duration-150 cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-bold shadow-2xs border border-slate-200/70 dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60 font-medium'
          }`}
        >
          <Dumbbell className="h-4 w-4" />
          <span>Clases y horarios</span>
        </button>
      </div>

      {/* TAB 1: CHECKLIST */}
      {activeTab === 'checklist' && (
        <div className="space-y-6">
          {/* Gym Selector Bar */}
          <div className="bg-card p-4 rounded-xl border shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-xl">
              <label
                htmlFor="gym-selector"
                className="text-xs font-semibold text-muted-foreground uppercase tracking-wider shrink-0"
              >
                Seleccionar Gimnasio:
              </label>
              <Select
                id="gym-selector"
                value={selectedGymId}
                onChange={(e) => setSelectedGymId(e.target.value)}
                className="text-sm font-medium"
              >
                {confirmedGyms.length === 0 ? (
                  <option value="">No hay gimnasios confirmados o en proceso</option>
                ) : (
                  confirmedGyms.map((gym) => (
                    <option key={gym.id} value={gym.id}>
                      {gym.name} {gym.city ? `(${gym.city})` : ''} —{' '}
                      {gym.onboarding_status?.name || 'Onboarding'}
                    </option>
                  ))
                )}
              </Select>
            </div>

            {selectedGym && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/gyms/${selectedGym.id}`}>Ver ficha del gimnasio</Link>
                </Button>
              </div>
            )}
          </div>

          {selectedGymId ? (
            <GymOnboardingChecklist
              gymId={selectedGymId}
              gymName={selectedGym?.name}
              key={selectedGymId}
            />
          ) : (
            <div className="p-12 text-center bg-card rounded-xl border">
              <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold text-foreground">
                No hay gimnasios disponibles para onboarding
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-1">
                Cuando un gimnasio alcance el estado comercial de &quot;Confirmado&quot;, aparecerá
                aquí para gestionar su checklist.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLASES Y HORARIOS */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="w-56">
                <Select
                  value={classGymFilter}
                  onChange={(e) => setClassGymFilter(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="all">Todos los gimnasios</option>
                  {confirmedGyms.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="w-48">
                <Select
                  value={classStatusFilter}
                  onChange={(e) => setClassStatusFilter(e.target.value)}
                  className="text-xs h-9"
                >
                  <option value="all">Todos los estados</option>
                  <option value="published">🟢 Publicadas en App</option>
                  <option value="verified">🔵 Verificadas (Listas para publicar)</option>
                  <option value="received">⚪ Recibidas / Borradores</option>
                  <option value="unpublished">🔴 Pausadas / Despublicadas</option>
                </Select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchClasses()}
                disabled={isFetchingClasses}
                className="h-9 px-2.5"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isFetchingClasses ? 'animate-spin' : ''}`}
                />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const gymId = classGymFilter !== 'all' ? classGymFilter : (classes[0]?.gym_id || selectedGymId)
                  const targetGym = confirmedGyms.find((g) => g.id === gymId) || (classes[0]?.gym ? { id: classes[0].gym.id, name: classes[0].gym.name } : null)
                  if (targetGym) openAppPreviewForGym(targetGym.id, targetGym.name)
                  else alert('Selecciona un gimnasio para ver la previa en la app')
                }}
                className="h-9 font-bold text-xs gap-1.5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer shadow-2xs"
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Simulador App Móvil</span>
              </Button>
            </div>

            <Button
              size="sm"
              onClick={() => {
                setEditingClass(null)
                setIsClassModalOpen(true)
              }}
              className="bg-blue-600 text-white hover:bg-blue-700 cursor-pointer shadow-2xs font-bold text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Añadir clase
            </Button>
          </div>

          {/* Classes Table */}
          <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
            {isLoadingClasses ? (
              <div className="p-8 text-center text-muted-foreground space-y-2">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm">Cargando catálogo de clases...</p>
              </div>
            ) : classes.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
                  <Dumbbell className="h-8 w-8" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No se encontraron clases
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Añade las primeras clases de los gimnasios para validar su oferta deportiva.
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingClass(null)
                    setIsClassModalOpen(true)
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Añadir primera clase
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 border-b text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Gimnasio</th>
                      <th className="px-4 py-3">Clase</th>
                      <th className="px-4 py-3">Disciplina</th>
                      <th className="px-4 py-3">Horario Semanal</th>
                      <th className="px-4 py-3">Estado App</th>
                      <th className="px-4 py-3 text-right">Acción en App</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((cls) => {
                      const isPublished = cls.publication_status === 'published'
                      const schedules = (cls as any).class_schedules || []
                      const DAY_MAP: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' }
                      const daysText = schedules.length > 0
                        ? schedules.map((s: any) => DAY_MAP[s.day_of_week] || 'D').join(', ')
                        : 'Flexible'
                      const timeText = schedules[0]?.start_time
                        ? `${schedules[0].start_time.slice(0, 5)} - ${schedules[0].end_time.slice(0, 5)}`
                        : `${cls.duration_minutes || 60}m`

                      return (
                        <tr key={cls.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {cls.gym ? (
                              <Link
                                href={`/gyms/${cls.gym.id}`}
                                className="font-semibold text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                              >
                                <Building2 className="h-3.5 w-3.5 text-blue-500" />
                                {cls.gym.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-bold text-foreground">{cls.name}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span>{cls.price ? `${cls.price}€` : 'Pase'}</span>
                              <span>•</span>
                              <span>{cls.capacity ? `${cls.capacity} pl.` : 'Libre'}</span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">
                            <span className="font-medium">{cls.discipline?.name || 'General'}</span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                            <div className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Calendar className="h-3 w-3 text-blue-500" />
                              <span>{daysText}</span>
                            </div>
                            <span className="text-[11px] text-muted-foreground font-mono">{timeText}</span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                                isPublished
                                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              {isPublished ? 'Publicada' : 'Borrador'}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleTogglePublish(cls.id, cls.publication_status)}
                                disabled={togglingClassId === cls.id}
                                className={`h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                                  isPublished
                                    ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                                    : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 bg-emerald-50/60 dark:bg-emerald-950/30'
                                }`}
                              >
                                {togglingClassId === cls.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                ) : isPublished ? (
                                  'Pausar'
                                ) : (
                                  'Publicar'
                                )}
                              </Button>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingClass(cls)
                                  setIsClassModalOpen(true)
                                }}
                                className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                                title="Editar clase y horario"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>

                              {cls.gym && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => openAppPreviewForGym(cls.gym!.id, cls.gym!.name)}
                                  className="h-7 px-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 cursor-pointer"
                                  title="Ver en simulador de app"
                                >
                                  <Smartphone className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add / Edit Class Modal */}
          <ClassFormModal
            isOpen={isClassModalOpen}
            onClose={() => {
              setIsClassModalOpen(false)
              setEditingClass(null)
            }}
            onSuccess={() => {
              setIsClassModalOpen(false)
              setEditingClass(null)
              queryClient.invalidateQueries({ queryKey: ['operations-classes'] })
            }}
            preselectedGymId={selectedGymId || undefined}
            initialClass={editingClass}
          />

          {/* Mobile App Simulator Modal */}
          {previewGymData && (
            <AppPreviewModal
              gym={{
                id: previewGymData.id,
                name: previewGymData.name,
                city: previewGymData.city || 'Madrid',
                classes: previewGymData.classes || [],
              }}
              isOpen={isAppPreviewOpen}
              onClose={() => {
                setIsAppPreviewOpen(false)
                setPreviewGymData(null)
              }}
              onPublishAllSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['operations-classes'] })
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
