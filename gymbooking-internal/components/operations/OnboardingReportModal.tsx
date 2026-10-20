'use client'

import React from 'react'
import type { GymOnboardingItemWithDetails } from '@/services/operations/onboarding.service'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Printer,
  FileCheck2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  ShieldCheck,
} from 'lucide-react'

interface OnboardingReportModalProps {
  isOpen: boolean
  onClose: () => void
  gymName?: string
  gymId: string
  items: GymOnboardingItemWithDetails[]
}

export function OnboardingReportModal({
  isOpen,
  onClose,
  gymName = 'Gimnasio',
  gymId,
  items,
}: OnboardingReportModalProps) {
  if (!isOpen) return null

  const total = items.length
  const completed = items.filter((i) => i.status === 'completed').length
  const pending = items.filter((i) => i.status === 'pending' || i.status === 'in_progress').length
  const blocked = items.filter((i) => i.status === 'blocked').length
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0
  const isReady = total > 0 && completed === total

  const handlePrint = () => {
    window.print()
  }

  const today = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden border border-gray-200 print:max-h-none print:shadow-none print:border-none print:w-full print:rounded-none">
        {/* Modal Toolbar (hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/75 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100/70 text-blue-700 rounded-lg">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Acta de Incorporación Técnica y Activación
              </h3>
              <p className="text-xs text-gray-500">
                Informe oficial para verificación y firma de puesta en marcha.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / Guardar en PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate / Printable Sheet */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 bg-white print:p-6 print:overflow-visible text-gray-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b-2 border-gray-900 pb-6">
            <div>
              <div className="flex items-center gap-2 text-blue-600 font-extrabold text-lg tracking-tight">
                <ShieldCheck className="w-6 h-6" />
                <span>GYMBOOKING CRM</span>
              </div>
              <h1 className="text-2xl font-black text-gray-900 mt-2 uppercase tracking-wide">
                Acta Oficial de Onboarding y Activación
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Expediente: <span className="font-mono text-gray-700">{gymId}</span> • Fecha: {today}
              </p>
            </div>

            <div className="text-right sm:self-center">
              <div
                className={`inline-flex items-center gap-1.5 font-bold text-xs uppercase px-3.5 py-1.5 rounded-full border ${
                  isReady
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                {isReady ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Aprobado para Producción (100%)
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4 text-amber-600" />
                    En Proceso de Validación ({percent}%)
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Gym Data & Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-500 block">Centro Deportivo:</span>
              <strong className="text-gray-900 text-sm block mt-0.5 truncate">{gymName}</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Total Pasos Auditados:</span>
              <strong className="text-gray-900 text-sm block mt-0.5">{total} requerimientos</strong>
            </div>
            <div>
              <span className="text-gray-500 block">Completados / Válidos:</span>
              <strong className="text-emerald-700 text-sm block mt-0.5">
                {completed} ({percent}%)
              </strong>
            </div>
            <div>
              <span className="text-gray-500 block">Pendientes / Bloqueados:</span>
              <strong className="text-amber-700 text-sm block mt-0.5">
                {pending} pendientes {blocked > 0 ? `(${blocked} bloq.)` : ''}
              </strong>
            </div>
          </div>

          {/* Checklist Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Desglose de Verificación por Puntos de Control
            </h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 border-b border-gray-200 font-semibold text-gray-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">Requisito / Tarea</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Estado</th>
                    <th className="py-2.5 px-3">Responsable</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {items.map((item, idx) => {
                    const isDone = item.status === 'completed'
                    const isBlocked = item.status === 'blocked'

                    return (
                      <tr key={item.id} className={isDone ? 'bg-white' : 'bg-gray-50/50'}>
                        <td className="py-2 px-3 text-center font-mono text-gray-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3">
                          <div className="font-semibold text-gray-900">{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] text-gray-500 line-clamp-1">
                              {item.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap text-gray-600">
                          {item.category || item.template_item?.category || 'General'}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {isDone ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Completado
                            </span>
                          ) : isBlocked ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Bloqueado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-medium text-amber-700">
                              <Clock className="w-3.5 h-3.5" />
                              Pendiente
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-gray-700 whitespace-nowrap">
                          {item.assignee?.full_name || 'Sin asignar'}
                        </td>
                        <td className="py-2 px-3 text-gray-600 text-[11px]">
                          {item.comment || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conformity & Signature Section */}
          <div className="border-t-2 border-gray-200 pt-8 space-y-6 break-inside-avoid">
            <p className="text-xs text-gray-600 leading-relaxed">
              Por la presente se hace constar que los requerimientos técnicos, legales, tarifarios y de integración de catálogo han sido auditados conforme a los protocolos operativos vigentes de <strong>GymBooking</strong>.
            </p>

            <div className="grid grid-cols-2 gap-12 pt-6">
              <div className="border-t border-gray-400 pt-3 text-xs space-y-1">
                <span className="font-bold text-gray-900 block">Responsable de Operaciones</span>
                <span className="text-gray-500 block">GymBooking Operations Team</span>
                <div className="h-14 flex items-end">
                  <span className="text-[11px] text-gray-400 font-mono">Firma y Sello Digital: ____________________</span>
                </div>
              </div>

              <div className="border-t border-gray-400 pt-3 text-xs space-y-1">
                <span className="font-bold text-gray-900 block">Director / Gerente del Centro</span>
                <span className="text-gray-500 block">{gymName}</span>
                <div className="h-14 flex items-end">
                  <span className="text-[11px] text-gray-400 font-mono">Firma de Conformidad: ____________________</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer (hidden when printing) */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 print:hidden">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
          <Button
            size="sm"
            onClick={handlePrint}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Acta
          </Button>
        </div>
      </div>
    </div>
  )
}
