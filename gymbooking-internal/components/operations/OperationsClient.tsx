'use client'

import React, { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  getClasses,
  type ClassWithDetails,
} from '@/services/operations/onboarding.service'
import { GymOnboardingChecklist } from './GymOnboardingChecklist'
import { ClassFormModal } from './ClassFormModal'
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

  const queryClient = useQueryClient()

  // Selected gym object
  const selectedGym = confirmedGyms.find((g) => g.id === selectedGymId)

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
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Operaciones</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Centro de incorporación técnica, checklist de activación y validación de clases
          </p>
        </div>
      </div>

      {/* Operations Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-xl border shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">{stats.confirmedCount}</span>
            <p className="text-xs text-muted-foreground">Gimnasios confirmados</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">
              {stats.pendingOnboardingCount}
            </span>
            <p className="text-xs text-muted-foreground">Pendientes de completar onboarding</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border shadow-2xs flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-foreground">{stats.activeCount}</span>
            <p className="text-xs text-muted-foreground">Gimnasios activos en plataforma</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab('checklist')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'checklist'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Checklist de incorporación</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
            activeTab === 'classes'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
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
            <div className="flex flex-wrap items-center gap-3">
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
                  <option value="received">Recibido</option>
                  <option value="verified">Verificado</option>
                  <option value="published">Publicado</option>
                  <option value="unpublished">Despublicado</option>
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
            </div>

            <Button
              size="sm"
              onClick={() => setIsClassModalOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
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
                <Button size="sm" onClick={() => setIsClassModalOpen(true)} className="mt-2">
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
                      <th className="px-4 py-3">Nombre de la clase</th>
                      <th className="px-4 py-3">Disciplina</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Última verificación</th>
                      <th className="px-4 py-3">Verificado por</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {classes.map((cls) => {
                      const badge =
                        publicationBadges[cls.publication_status] || publicationBadges.received
                      return (
                        <tr key={cls.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {cls.gym ? (
                              <Link
                                href={`/gyms/${cls.gym.id}`}
                                className="font-medium text-foreground hover:text-primary hover:underline flex items-center gap-1.5"
                              >
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                {cls.gym.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <span className="font-semibold text-foreground">{cls.name}</span>
                            {cls.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                {cls.description}
                              </p>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">
                            {cls.discipline?.name || 'General'}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {cls.last_verified_at ? formatDate(cls.last_verified_at) : 'Sin verificar'}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {cls.verified_by_profile?.full_name || '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add Class Modal */}
          <ClassFormModal
            isOpen={isClassModalOpen}
            onClose={() => setIsClassModalOpen(false)}
            onSuccess={() => {
              queryClient.invalidateQueries({ queryKey: ['operations-classes'] })
            }}
            preselectedGymId={selectedGymId || undefined}
          />
        </div>
      )}
    </div>
  )
}
