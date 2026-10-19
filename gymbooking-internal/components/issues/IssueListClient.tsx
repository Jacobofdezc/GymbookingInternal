'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  getIssues,
  type IssueWithDetails,
} from '@/services/issues/issue.service'
import { IssueForm } from './IssueForm'
import { IssueDetailModal } from './IssueDetailModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { NotificationAlert, NotificationState } from '@/components/ui/notification-alert'
import { formatDate, isOverdue } from '@/lib/utils'
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  User,
} from 'lucide-react'

type TabKey = 'open' | 'urgent' | 'blocked' | 'resolved' | 'all'

export function IssueListClient() {
  const searchParams = useSearchParams()
  const initialNew = searchParams.get('new') === 'true'

  const [activeTab, setActiveTab] = useState<TabKey>('open')
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [gymFilter, setGymFilter] = useState('all')

  const [isFormOpen, setIsFormOpen] = useState(initialNew)
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const queryClient = useQueryClient()

  const {
    data: issues = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['issues'],
    queryFn: () => getIssues(),
  })

  // Extract unique gyms & assignees for filter dropdowns
  const { filterGyms, filterAssignees } = useMemo(() => {
    const gymsMap = new Map<string, string>()
    const assigneesMap = new Map<string, string>()

    issues.forEach((i) => {
      if (i.gym) gymsMap.set(i.gym.id, i.gym.name)
      if (i.assignee) assigneesMap.set(i.assignee.id, i.assignee.full_name)
    })

    return {
      filterGyms: Array.from(gymsMap.entries()).map(([id, name]) => ({ id, name })),
      filterAssignees: Array.from(assigneesMap.entries()).map(([id, name]) => ({ id, name })),
    }
  }, [issues])

  // Filter items
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      // Tab filter
      if (activeTab === 'open' && (issue.status === 'resolved' || issue.status === 'closed')) {
        return false
      }
      if (activeTab === 'urgent' && issue.priority !== 'urgent') {
        return false
      }
      if (activeTab === 'blocked' && issue.status !== 'blocked') {
        return false
      }
      if (activeTab === 'resolved' && issue.status !== 'resolved' && issue.status !== 'closed') {
        return false
      }

      // Type filter
      if (typeFilter !== 'all' && issue.type !== typeFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== 'all' && issue.priority !== priorityFilter) {
        return false
      }

      // Assignee filter
      if (assigneeFilter !== 'all' && issue.assignee_id !== assigneeFilter) {
        return false
      }

      // Gym filter
      if (gymFilter !== 'all' && issue.gym_id !== gymFilter) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchTitle = issue.title.toLowerCase().includes(query)
        const matchDesc = issue.description?.toLowerCase().includes(query)
        const matchGym = issue.gym?.name?.toLowerCase().includes(query)
        const matchAssignee = issue.assignee?.full_name?.toLowerCase().includes(query)
        if (!matchTitle && !matchDesc && !matchGym && !matchAssignee) {
          return false
        }
      }

      return true
    })
  }, [issues, activeTab, typeFilter, priorityFilter, assigneeFilter, gymFilter, searchQuery])

  // Tab counts
  const counts = useMemo(() => {
    return {
      open: issues.filter((i) => i.status !== 'resolved' && i.status !== 'closed').length,
      urgent: issues.filter((i) => i.priority === 'urgent').length,
      blocked: issues.filter((i) => i.status === 'blocked').length,
      resolved: issues.filter((i) => i.status === 'resolved' || i.status === 'closed').length,
      all: issues.length,
    }
  }, [issues])

  const priorityBadges: Record<string, { label: string; variant: 'outline' | 'info' | 'warning' | 'danger' }> = {
    low: { label: 'Baja', variant: 'outline' },
    medium: { label: 'Media', variant: 'info' },
    high: { label: 'Alta', variant: 'warning' },
    urgent: { label: 'Urgente', variant: 'danger' },
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

  const statusLabels: Record<string, { label: string; variant: 'outline' | 'warning' | 'danger' | 'success' }> = {
    open: { label: 'Abierta', variant: 'outline' },
    investigating: { label: 'Investigando', variant: 'warning' },
    in_progress: { label: 'En progreso', variant: 'warning' },
    blocked: { label: 'Bloqueada', variant: 'danger' },
    resolved: { label: 'Resuelta', variant: 'success' },
    closed: { label: 'Cerrada', variant: 'outline' },
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Incidencias</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Gestión y seguimiento de problemas técnicos, comerciales y operativos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nueva incidencia
          </Button>
        </div>
      </div>

      <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-border gap-1">
        {(
          [
            { key: 'open', label: 'Abiertas', count: counts.open },
            { key: 'urgent', label: 'Urgentes', count: counts.urgent },
            { key: 'blocked', label: 'Bloqueadas', count: counts.blocked },
            { key: 'resolved', label: 'Resueltas', count: counts.resolved },
            { key: 'all', label: 'Todas', count: counts.all },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.key
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 bg-card p-3 rounded-xl border shadow-2xs">
        <div className="relative md:col-span-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar incidencia..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 text-sm"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="text-sm"
        >
          <option value="all">Todos los tipos</option>
          <option value="technical_error">Error técnico</option>
          <option value="commercial">Comercial</option>
          <option value="gym_data">Datos de gimnasio</option>
          <option value="schedules">Horarios</option>
          <option value="classes">Clases</option>
          <option value="bookings">Reservas</option>
          <option value="user">Usuario</option>
          <option value="security">Seguridad</option>
          <option value="other">Otro</option>
        </Select>

        <Select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="text-sm"
        >
          <option value="all">Todas las prioridades</option>
          <option value="urgent">Urgente</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </Select>

        <Select
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          className="text-sm"
        >
          <option value="all">Todos los asignados</option>
          {filterAssignees.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </Select>

        <Select
          value={gymFilter}
          onChange={(e) => setGymFilter(e.target.value)}
          className="text-sm"
        >
          <option value="all">Todos los gimnasios</option>
          {filterGyms.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {/* Issues Table */}
      <div className="rounded-xl border bg-card shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Cargando incidencias...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-foreground font-medium">Error al cargar las incidencias</p>
            <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              No hay incidencias en esta vista
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {searchQuery || typeFilter !== 'all' || priorityFilter !== 'all'
                ? 'Prueba a cambiar o limpiar los filtros seleccionados.'
                : '¡Todo en orden! No hay problemas reportados actualmente en este estado.'}
            </p>
            <Button size="sm" onClick={() => setIsFormOpen(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" />
              Crear una incidencia
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/40 border-b text-xs font-semibold uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Gimnasio</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Fecha límite</th>
                  <th className="px-4 py-3">Creada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredIssues.map((issue) => {
                  const overdue = isOverdue(issue.due_date) && issue.status !== 'resolved' && issue.status !== 'closed'
                  return (
                    <tr
                      key={issue.id}
                      onClick={() => setSelectedIssueId(issue.id)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant={priorityBadges[issue.priority]?.variant || 'outline'}>
                          {priorityBadges[issue.priority]?.label || issue.priority}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1 max-w-xs sm:max-w-md">
                          {issue.title}
                        </div>
                        {issue.description && (
                          <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {issue.description}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge variant="outline" className="font-normal">
                          {typeLabels[issue.type] || issue.type}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <Badge
                          variant={statusLabels[issue.status]?.variant || 'outline'}
                          className="font-medium"
                        >
                          {statusLabels[issue.status]?.label || issue.status}
                        </Badge>
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {issue.gym ? (
                          <span
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 text-xs text-foreground hover:text-primary"
                          >
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            <Link href={`/gyms/${issue.gym.id}`} className="hover:underline">
                              {issue.gym.name}
                            </Link>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">General</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">
                        {issue.assignee ? (
                          <span className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                            {issue.assignee.full_name}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Sin asignar</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                        {issue.due_date ? (
                          <span className={overdue ? 'text-red-600 font-semibold' : 'text-muted-foreground'}>
                            {formatDate(issue.due_date)}
                            {overdue && ' (Vencida)'}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                        {formatDate(issue.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <IssueForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['issues'] })
          setNotification({ type: 'success', message: 'Incidencia guardada con éxito' })
        }}
      />

      {/* Detail Modal */}
      <IssueDetailModal
        issueId={selectedIssueId}
        isOpen={!!selectedIssueId}
        onClose={() => setSelectedIssueId(null)}
        onUpdate={() => {
          queryClient.invalidateQueries({ queryKey: ['issues'] })
        }}
      />
    </div>
  )
}
