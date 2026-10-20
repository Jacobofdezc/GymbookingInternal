'use client'

import React, { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import {
  getInteractions,
  type InteractionWithDetails,
} from '@/services/interactions/interaction.service'
import { InteractionForm } from './InteractionForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { NotificationAlert, NotificationState } from '@/components/ui/notification-alert'
import { formatDate } from '@/lib/utils'
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Download,
  Filter,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  User,
  Video,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react'

const PAGE_SIZE = 15

export function InteractionListClient() {
  const [gymSearch, setGymSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [registeredByFilter, setRegisteredByFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [notification, setNotification] = useState<NotificationState | null>(null)

  const queryClient = useQueryClient()

  const {
    data: interactions = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['interactions', typeFilter, registeredByFilter, dateFrom, dateTo],
    queryFn: () =>
      getInteractions({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        registered_by: registeredByFilter !== 'all' ? registeredByFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      }),
  })

  // Extract users and gyms for dropdowns
  const { registeredByUsers } = useMemo(() => {
    const userMap = new Map<string, string>()
    interactions.forEach((i) => {
      if (i.registered_by_profile) {
        userMap.set(i.registered_by_profile.id, i.registered_by_profile.full_name)
      }
    })
    return {
      registeredByUsers: Array.from(userMap.entries()).map(([id, name]) => ({ id, name })),
    }
  }, [interactions])

  // Filter by gym search query
  const filteredInteractions = useMemo(() => {
    if (!gymSearch.trim()) return interactions
    const q = gymSearch.toLowerCase()
    return interactions.filter(
      (item) =>
        item.gym?.name?.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.contact?.full_name?.toLowerCase().includes(q)
    )
  }, [interactions, gymSearch])

  // Pagination
  const totalPages = Math.ceil(filteredInteractions.length / PAGE_SIZE) || 1
  const paginatedInteractions = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredInteractions.slice(start, start + PAGE_SIZE)
  }, [filteredInteractions, currentPage])

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  const typeConfig: Record<
    string,
    { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
  > = {
    call: { label: 'Llamada', icon: Phone, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
    email: { label: 'Email', icon: Mail, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
    whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
    meeting_in_person: { label: 'Presencial', icon: Building2, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
    video_call: { label: 'Videollamada', icon: Video, color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' },
    other_platform: { label: 'Otra', icon: ExternalLink, color: 'text-slate-600 bg-slate-50 dark:bg-slate-950/40' },
    internal_note: { label: 'Nota interna', icon: MessageSquare, color: 'text-zinc-600 bg-zinc-50 dark:bg-zinc-950/40' },
  }

  const exportToCSV = () => {
    if (filteredInteractions.length === 0) return

    const headers = [
      'Gimnasio',
      'Canal',
      'Fecha',
      'Contacto',
      'Resumen',
      'Resultado',
      'Compromisos',
      'Próximo Paso',
      'Fecha Próximo Paso',
      'Registrado Por',
    ]

    const rows = filteredInteractions.map((item) => [
      `"${(item.gym?.name || '').replace(/"/g, '""')}"`,
      `"${item.type || ''}"`,
      `"${item.interaction_date || ''}"`,
      `"${(item.contact?.full_name || '').replace(/"/g, '""')}"`,
      `"${(item.summary || '').replace(/"/g, '""')}"`,
      `"${(item.outcome || '').replace(/"/g, '""')}"`,
      `"${(item.commitments || '').replace(/"/g, '""')}"`,
      `"${(item.next_step || '').replace(/"/g, '""')}"`,
      `"${item.next_step_date || ''}"`,
      `"${(item.registered_by_profile?.full_name || '').replace(/"/g, '""')}"`,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `interacciones_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">Interacciones</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Historial de comunicaciones, llamadas, notas y compromisos comerciales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="cursor-pointer rounded-xl border-slate-200/90 shadow-2xs font-semibold hover:bg-slate-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            disabled={filteredInteractions.length === 0}
            className="cursor-pointer rounded-xl border-slate-200/90 shadow-2xs font-semibold hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar CSV
          </Button>
          <Button
            size="sm"
            onClick={() => setIsFormOpen(true)}
            className="cursor-pointer rounded-xl font-bold shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Registrar interacción
          </Button>
        </div>
      </div>

      <NotificationAlert notification={notification} onClose={() => setNotification(null)} />

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Buscar por gimnasio, resumen..."
            value={gymSearch}
            onChange={(e) => {
              setGymSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-8 text-xs rounded-xl border-slate-200/90 bg-slate-50/50 hover:bg-white focus:bg-white"
          />
        </div>

        <Select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="text-xs rounded-xl border-slate-200/90 bg-white"
        >
          <option value="all">Todos los canales</option>
          <option value="call">Llamada</option>
          <option value="email">Correo</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="meeting_in_person">Presencial</option>
          <option value="video_call">Videollamada</option>
          <option value="internal_note">Nota interna</option>
          <option value="other_platform">Otra plataforma</option>
        </Select>

        <Select
          value={registeredByFilter}
          onChange={(e) => {
            setRegisteredByFilter(e.target.value)
            setCurrentPage(1)
          }}
          className="text-xs rounded-xl border-slate-200/90 bg-white"
        >
          <option value="all">Registrado por: Todos</option>
          {registeredByUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium shrink-0">Desde:</span>
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value)
              setCurrentPage(1)
            }}
            className="text-xs h-9 rounded-xl border-slate-200/90 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium shrink-0">Hasta:</span>
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value)
              setCurrentPage(1)
            }}
            className="text-xs h-9 rounded-xl border-slate-200/90 bg-white"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground py-8">
              <RefreshCw className="h-5 w-5 animate-spin" />
              <span>Cargando interacciones...</span>
            </div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-foreground font-medium">Error al cargar las interacciones</p>
            <p className="text-xs text-muted-foreground mt-1">{(error as any)?.message}</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4">
              Reintentar
            </Button>
          </div>
        ) : filteredInteractions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="inline-flex p-3 rounded-full bg-muted text-muted-foreground">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No hay interacciones registradas</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {gymSearch || typeFilter !== 'all' || dateFrom || dateTo
                ? 'No se encontraron coincidencias para los filtros aplicados.'
                : 'Registra la primera llamada o reunión con un gimnasio para comenzar el seguimiento.'}
            </p>
            <Button size="sm" onClick={() => setIsFormOpen(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" />
              Registrar interacción
            </Button>
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted/40 border-b text-xs font-semibold uppercase text-muted-foreground">
                  <tr>
                    <th className="w-8 px-3 py-3"></th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Gimnasio</th>
                    <th className="px-4 py-3">Contacto</th>
                    <th className="px-4 py-3">Resumen</th>
                    <th className="px-4 py-3">Registrado por</th>
                    <th className="px-4 py-3">Próximo paso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedInteractions.map((item) => {
                    const isExpanded = expandedId === item.id
                    const config = typeConfig[item.type] || typeConfig.call
                    const Icon = config.icon

                    return (
                      <React.Fragment key={item.id}>
                        <tr
                          onClick={() => toggleExpand(item.id)}
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-3 py-3.5 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-primary" />
                            ) : (
                              <ChevronRight className="h-4 w-4 group-hover:text-foreground" />
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {formatDate(item.interaction_date)}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${config.color}`}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {config.label}
                            </span>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {item.gym ? (
                              <span
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary"
                              >
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                <Link href={`/gyms/${item.gym.id}`} className="hover:underline">
                                  {item.gym.name}
                                </Link>
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">
                            {item.contact ? (
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {item.contact.full_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">Sin contacto</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5 max-w-xs sm:max-w-md">
                            <p className="line-clamp-1 text-foreground">{item.summary}</p>
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            {item.registered_by_profile?.full_name || '—'}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap text-xs">
                            {item.next_step_date ? (
                              <span className="inline-flex items-center gap-1 text-foreground">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {formatDate(item.next_step_date)}
                              </span>
                            ) : item.next_step ? (
                              <span className="line-clamp-1 text-muted-foreground max-w-[120px]">
                                {item.next_step}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        </tr>

                        {/* Inline Expandable Details */}
                        {isExpanded && (
                          <tr className="bg-muted/20 border-b border-border">
                            <td colSpan={8} className="p-4 sm:p-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-card p-4 rounded-lg border">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                      Resumen completo
                                    </span>
                                    <p className="mt-1 whitespace-pre-wrap text-foreground">
                                      {item.summary}
                                    </p>
                                  </div>

                                  {item.outcome && (
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Resultado
                                      </span>
                                      <p className="mt-1 text-foreground">{item.outcome}</p>
                                    </div>
                                  )}

                                  {item.commitments && (
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Compromisos adquiridos
                                      </span>
                                      <p className="mt-1 text-foreground">{item.commitments}</p>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-3 md:border-l md:pl-4 border-border">
                                  {item.next_step && (
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Próximo paso planificado
                                      </span>
                                      <p className="mt-1 font-medium text-foreground">
                                        {item.next_step}
                                      </p>
                                      {item.next_step_date && (
                                        <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                          <Calendar className="h-3.5 w-3.5" />
                                          Fecha límite: {formatDate(item.next_step_date)}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {item.related_links && (
                                    <div>
                                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                                        Enlaces relacionados
                                      </span>
                                      <a
                                        href={item.related_links}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-1 text-primary hover:underline flex items-center gap-1.5 text-xs break-all"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                                        {item.related_links}
                                      </a>
                                    </div>
                                  )}

                                  <div className="pt-2 text-xs text-muted-foreground border-t">
                                    Registrado por {item.registered_by_profile?.full_name || 'Usuario'} el{' '}
                                    {formatDate(item.created_at)}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-card text-xs text-muted-foreground">
                <div>
                  Mostrando {(currentPage - 1) * PAGE_SIZE + 1} a{' '}
                  {Math.min(currentPage * PAGE_SIZE, filteredInteractions.length)} de{' '}
                  {filteredInteractions.length} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 px-2"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>
                  <span>
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 px-2"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Interaction Form Modal */}
      <InteractionForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['interactions'] })
          setNotification({ type: 'success', message: 'Interacción registrada con éxito' })
        }}
      />
    </div>
  )
}
