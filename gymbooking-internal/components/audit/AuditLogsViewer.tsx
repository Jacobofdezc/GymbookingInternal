'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import {
  AuditLogWithActor,
  getAuditLogs,
} from '@/services/audit/audit.service'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileCode,
  Building2,
  CheckSquare,
  AlertTriangle,
  FileText,
  BookOpen,
  User,
  Shield,
  Activity,
  ArrowRight,
  Clock,
  Layers,
  Copy,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react'

interface AuditLogsViewerProps {
  initialLogs?: AuditLogWithActor[]
  teamMembers?: Array<{ id: string; full_name: string; email: string }>
}

const ENTITY_CONFIG: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  gyms: { label: 'Gimnasios', icon: Building2 },
  gym_contacts: { label: 'Contactos', icon: User },
  tasks: { label: 'Tareas', icon: CheckSquare },
  issues: { label: 'Incidencias', icon: AlertTriangle },
  documents: { label: 'Documentos', icon: FileText },
  decisions: { label: 'Decisiones ADR', icon: BookOpen },
  knowledge_pages: { label: 'Base Conocimiento', icon: BookOpen },
  profiles: { label: 'Usuarios / Perfiles', icon: Shield },
  onboarding: { label: 'Onboarding', icon: Layers },
  commercial_pipeline: { label: 'Pipeline Comercial', icon: Activity },
}

export function AuditLogsViewer({
  initialLogs = [],
  teamMembers = [],
}: AuditLogsViewerProps) {
  const [logs, setLogs] = useState<AuditLogWithActor[]>(initialLogs)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [actorFilter, setActorFilter] = useState<string>('all')
  const [selectedLog, setSelectedLog] = useState<AuditLogWithActor | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAuditLogs({
        entity_type: entityFilter !== 'all' ? entityFilter : undefined,
        action: actionFilter !== 'all' ? actionFilter : undefined,
        actor_user_id: actorFilter !== 'all' ? actorFilter : undefined,
        search: search.trim() || undefined,
        limit: 100,
      })
      setLogs(data)
    } catch (err) {
      console.error('Error refreshing audit logs:', err)
    } finally {
      setLoading(false)
    }
  }, [entityFilter, actionFilter, actorFilter, search])

  // Initial fetch if initialLogs was empty
  useEffect(() => {
    if (initialLogs.length === 0) {
      fetchLogs()
    }
  }, [fetchLogs, initialLogs.length])

  // Client-side filtering for fast query feedback
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesAction = log.action.toLowerCase().includes(query)
        const matchesEntity = log.entity_type.toLowerCase().includes(query)
        const matchesActor =
          log.actor?.full_name?.toLowerCase().includes(query) ||
          log.actor?.email?.toLowerCase().includes(query)
        const matchesEntityId = log.entity_id?.toLowerCase().includes(query)
        if (!matchesAction && !matchesEntity && !matchesActor && !matchesEntityId) {
          return false
        }
      }
      if (entityFilter !== 'all' && log.entity_type !== entityFilter) {
        return false
      }
      if (actionFilter !== 'all' && log.action !== actionFilter) {
        return false
      }
      if (actorFilter !== 'all' && log.actor_user_id !== actorFilter) {
        return false
      }
      return true
    })
  }, [logs, search, entityFilter, actionFilter, actorFilter])

  // Action badge styling
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase()
    if (act.includes('create') || act.includes('insert') || act.includes('import')) {
      return (
        <Badge className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
          {action}
        </Badge>
      )
    }
    if (act.includes('delete') || act.includes('remove')) {
      return (
        <Badge className="bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800">
          {action}
        </Badge>
      )
    }
    if (act.includes('status') || act.includes('state')) {
      return (
        <Badge className="bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800">
          {action}
        </Badge>
      )
    }
    return (
      <Badge className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
        {action}
      </Badge>
    )
  }

  // Export CSV
  const handleExportCsv = () => {
    if (filteredLogs.length === 0) return

    const headers = [
      'Fecha',
      'Acción',
      'Entidad',
      'ID Entidad',
      'Usuario',
      'Email Usuario',
      'Rol',
      'IP',
      'Valores Anteriores',
      'Nuevos Valores',
    ]

    const csvRows = [
      headers.join(','),
      ...filteredLogs.map((log) => {
        const date = `"${new Date(log.created_at).toISOString()}"`
        const action = `"${log.action.replace(/"/g, '""')}"`
        const entity = `"${log.entity_type.replace(/"/g, '""')}"`
        const entityId = `"${log.entity_id || ''}"`
        const actorName = `"${(log.actor?.full_name || 'Sistema').replace(/"/g, '""')}"`
        const actorEmail = `"${(log.actor?.email || '').replace(/"/g, '""')}"`
        const actorRole = `"${(log.actor?.role || '').replace(/"/g, '""')}"`
        const ip = `"${log.ip_address || ''}"`
        const oldVal = `"${JSON.stringify(log.old_values || '').replace(/"/g, '""')}"`
        const newVal = `"${JSON.stringify(log.new_values || '').replace(/"/g, '""')}"`

        return [
          date,
          action,
          entity,
          entityId,
          actorName,
          actorEmail,
          actorRole,
          ip,
          oldVal,
          newVal,
        ].join(',')
      }),
    ]

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Copy to clipboard helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Registro de Auditoría y Trazabilidad
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historial inmutable de cambios, eventos del sistema y acciones realizadas por usuarios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="gap-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="gap-2 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar acción, usuario, entidad..."
              className="pl-9 bg-gray-50/50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800 focus:bg-white dark:focus:bg-slate-900 text-sm"
            />
          </div>

          {/* Entity Filter */}
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800">
              <SelectValue placeholder="Todas las entidades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las entidades</SelectItem>
              <SelectItem value="gyms">Gimnasios</SelectItem>
              <SelectItem value="gym_contacts">Contactos</SelectItem>
              <SelectItem value="tasks">Tareas</SelectItem>
              <SelectItem value="issues">Incidencias</SelectItem>
              <SelectItem value="documents">Documentos</SelectItem>
              <SelectItem value="decisions">Decisiones (ADR)</SelectItem>
              <SelectItem value="knowledge_pages">Base Conocimiento</SelectItem>
              <SelectItem value="profiles">Usuarios</SelectItem>
              <SelectItem value="commercial_pipeline">Pipeline</SelectItem>
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800">
              <SelectValue placeholder="Todas las acciones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las acciones</SelectItem>
              <SelectItem value="create">Crear (create)</SelectItem>
              <SelectItem value="update">Modificar (update)</SelectItem>
              <SelectItem value="delete">Eliminar (delete)</SelectItem>
              <SelectItem value="status_change">Cambio de estado</SelectItem>
              <SelectItem value="import">Importación masiva</SelectItem>
            </SelectContent>
          </Select>

          {/* Actor Filter */}
          <Select value={actorFilter} onValueChange={setActorFilter}>
            <SelectTrigger className="text-sm bg-gray-50/50 dark:bg-slate-950/60 border-gray-200 dark:border-slate-800">
              <SelectValue placeholder="Todos los usuarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los usuarios</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.full_name || member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs text-slate-500 dark:text-slate-400 border-t border-gray-100 dark:border-slate-800">
          <span>
            Mostrando <strong className="text-slate-900 dark:text-slate-100">{filteredLogs.length}</strong> eventos registrados
          </span>
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Orden cronológico descendente
          </span>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="py-16 text-center text-gray-500 dark:text-slate-400 space-y-2">
            <Activity className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 stroke-1" />
            <p className="font-medium text-gray-700 dark:text-slate-200">No se encontraron registros de auditoría</p>
            <p className="text-xs text-gray-400 dark:text-slate-500">
              Ajusta los filtros de búsqueda o realiza acciones en la plataforma para generar eventos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/75 dark:bg-slate-950/80 border-b border-gray-200 dark:border-slate-800 text-xs font-semibold text-gray-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Fecha y Hora</th>
                  <th className="py-3 px-4">Usuario / Actor</th>
                  <th className="py-3 px-4">Acción</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">ID de Registro</th>
                  <th className="py-3 px-4 text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const EntityIcon =
                    ENTITY_CONFIG[log.entity_type]?.icon || Activity
                  const entityLabel =
                    ENTITY_CONFIG[log.entity_type]?.label || log.entity_type

                  const hasPayload =
                    Boolean(log.old_values) || Boolean(log.new_values)

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-gray-50/80 transition-colors group"
                    >
                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {new Date(log.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(log.created_at).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </div>
                      </td>

                      {/* Actor */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="w-7 h-7">
                            <AvatarImage
                              src={log.actor?.avatar_url || ''}
                              alt={log.actor?.full_name || 'Usuario'}
                            />
                            <AvatarFallback className="text-[10px] bg-blue-100 text-blue-700">
                              {log.actor?.full_name
                                ? log.actor.full_name.slice(0, 2).toUpperCase()
                                : 'SYS'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                              {log.actor?.full_name || 'Sistema'}
                            </div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                              {log.actor?.email || 'Automático'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Entity */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200/60 dark:border-slate-700">
                          <EntityIcon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                          <span>{entityLabel}</span>
                        </div>
                      </td>

                      {/* Entity ID */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.entity_id ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                            <span>#{log.entity_id.slice(0, 8)}</span>
                            <button
                              onClick={() =>
                                handleCopy(log.entity_id!, log.id)
                              }
                              className="opacity-0 group-hover:opacity-100 p-1 hover:text-slate-900 dark:hover:text-slate-100 transition-opacity"
                              title="Copiar ID completo"
                            >
                              {copiedId === log.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-xs">—</span>
                        )}
                      </td>

                      {/* Detail Button */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {hasPayload ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedLog(log)}
                            className="text-xs gap-1.5 h-7 px-2.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Ver diff
                          </Button>
                        ) : (
                          <span className="text-xs text-slate-400 dark:text-slate-500">Sin datos</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload / Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-100 dark:border-slate-800 space-y-4 max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                    Detalle del Evento de Auditoría
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ID: {selectedLog.id} • {new Date(selectedLog.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Event summary banner */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-gray-50 dark:bg-slate-950/60 p-3 rounded-xl border border-gray-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Acción</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.action}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Entidad</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.entity_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">Actor</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedLog.actor?.full_name || 'Sistema'}</span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block text-[11px]">IP</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedLog.ip_address || 'Local/Internal'}</span>
                </div>
              </div>

              {/* Old vs New Values side-by-side / diff */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Old values */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="text-rose-600 dark:text-rose-400">Valores Anteriores (old)</span>
                    {selectedLog.old_values && (
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(selectedLog.old_values, null, 2),
                            'old'
                          )
                        }
                        className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedId === 'old' ? 'Copiado' : 'Copiar'}
                      </button>
                    )}
                  </div>
                  <pre className="bg-gray-900 text-gray-100 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-60 leading-relaxed border border-gray-800">
                    {selectedLog.old_values
                      ? JSON.stringify(selectedLog.old_values, null, 2)
                      : '// Sin valores previos (registro nuevo)'}
                  </pre>
                </div>

                {/* New values */}
                <div className="space-y-1.5">
                  <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="text-emerald-600 dark:text-emerald-400">Nuevos Valores (new)</span>
                    {selectedLog.new_values && (
                      <button
                        onClick={() =>
                          handleCopy(
                            JSON.stringify(selectedLog.new_values, null, 2),
                            'new'
                          )
                        }
                        className="text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center gap-1"
                      >
                        {copiedId === 'new' ? 'Copiado' : 'Copiar'}
                      </button>
                    )}
                  </div>
                  <pre className="bg-gray-900 text-emerald-300 p-3 rounded-xl overflow-x-auto text-[11px] font-mono max-h-60 leading-relaxed border border-gray-800">
                    {selectedLog.new_values
                      ? JSON.stringify(selectedLog.new_values, null, 2)
                      : '// Sin nuevos valores (eliminación o acción sin payload)'}
                  </pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
