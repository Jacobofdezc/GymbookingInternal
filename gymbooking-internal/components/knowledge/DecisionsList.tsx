'use client'

import React, { useState, useEffect } from 'react'
import {
  Scale,
  Plus,
  Search,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  getDecisions,
  type DecisionWithDetails,
  type DecisionFilters,
} from '@/services/decisions/decision.service'
import { DecisionFormModal } from './DecisionFormModal'
import { formatDate } from '@/lib/utils'

interface DecisionsListProps {
  canWrite: boolean
}

export function DecisionsList({ canWrite }: DecisionsListProps) {
  const [decisions, setDecisions] = useState<DecisionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'replaced' | 'discarded'>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchDecisions = async () => {
    try {
      setLoading(true)
      const data = await getDecisions({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: search.trim() || undefined,
      })
      setDecisions(data)
    } catch (err) {
      console.error('Error fetching decisions:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecisions()
  }, [statusFilter])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchDecisions()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Vigente / Activa
          </span>
        )
      case 'replaced':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Reemplazada
          </span>
        )
      case 'discarded':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            Descartada
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-4">
      {/* Top action & filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-gray-200/80 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título, contexto o acuerdo..."
            className="pl-9 text-xs h-9"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="flex h-9 rounded-md border border-input bg-background dark:bg-slate-900 dark:border-slate-800 text-slate-900 dark:text-slate-100 px-3 py-1 text-xs shadow-2xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&>option]:bg-white [&>option]:text-slate-900 [&>option]:dark:bg-slate-900 [&>option]:dark:text-slate-100 cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activas</option>
            <option value="replaced">Reemplazadas</option>
            <option value="discarded">Descartadas</option>
          </select>

          {canWrite && (
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="gap-1.5 text-xs h-9 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Nueva Decisión (ADR)
            </Button>
          )}
        </div>
      </div>

      {/* Decision records list */}
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs">Cargando registro de decisiones...</p>
        </div>
      ) : decisions.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 p-12 text-center text-gray-400 dark:text-slate-400 shadow-xs">
          <Scale className="h-10 w-10 mx-auto mb-2 text-gray-300 dark:text-slate-600 stroke-1" />
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200">Sin decisiones registradas</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Utiliza este registro formal (ADRs) para documentar acuerdos clave de producto, condiciones o infraestructura.
          </p>
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 gap-1.5 text-xs"
            >
              <Plus className="h-4 w-4" />
              Registrar primera decisión
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((dec) => {
            const isExpanded = expandedId === dec.id

            return (
              <div
                key={dec.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all hover:border-gray-300 dark:hover:border-slate-700"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : dec.id)}
                  className="p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-gray-400 dark:text-slate-500">
                        #{dec.id.slice(0, 8).toUpperCase()}
                      </span>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100">{dec.title}</h4>
                      {getStatusBadge(dec.status)}
                      {dec.gym && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-medium">
                          <Building2 className="h-3 w-3" />
                          {dec.gym.name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-slate-500 pt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(dec.decision_date)}
                      </span>
                      {dec.responsible && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          Responsable: <strong className="text-gray-700 dark:text-slate-300">{dec.responsible.full_name}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 space-y-3 text-xs leading-relaxed">
                    {dec.context && (
                      <div>
                        <span className="font-bold text-gray-700 dark:text-slate-300 block mb-0.5">
                          Contexto y Justificación:
                        </span>
                        <p className="text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800">
                          {dec.context}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="font-bold text-gray-700 dark:text-slate-300 block mb-0.5">
                        Decisión Adoptada:
                      </span>
                      <p className="font-medium bg-emerald-50/60 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 text-emerald-950 dark:text-emerald-200">
                        {dec.decision_made}
                      </p>
                    </div>

                    {dec.consequences && (
                      <div>
                        <span className="font-bold text-gray-700 dark:text-slate-300 block mb-0.5">
                          Consecuencias y Compromisos:
                        </span>
                        <p className="text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-800">
                          {dec.consequences}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Decision Form Modal */}
      <DecisionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchDecisions}
      />
    </div>
  )
}
