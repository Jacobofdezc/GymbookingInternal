'use client'

import React, { useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { FullGymDetail } from '@/services/gyms/gym.service'
import {
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Phone,
  Globe,
  MapPin,
  User,
  ShieldCheck,
  FileText,
  Dumbbell,
  Sparkles,
} from 'lucide-react'

interface GymExecutiveReportModalProps {
  gym: FullGymDetail
  isOpen: boolean
  onClose: () => void
}

export function GymExecutiveReportModal({
  gym,
  isOpen,
  onClose,
}: GymExecutiveReportModalProps) {
  const printAreaRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    window.print()
  }

  const completedOnboarding = gym.gym_onboarding_items.filter(
    (i) => i.status === 'completed'
  ).length
  const totalOnboarding = gym.gym_onboarding_items.length
  const onboardingPct =
    totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-5 border-b bg-white dark:bg-slate-900 sticky top-0 z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Ficha Ejecutiva del Centro • {gym.name}
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Documento formal de resumen comercial, legal y operacional
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir / PDF
            </Button>
          </div>
        </DialogHeader>

        {/* Printable Paper Canvas */}
        <div className="p-6">
          <div
            ref={printAreaRef}
            id="gym-printable-sheet"
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 text-slate-800 dark:text-slate-200"
          >
            {/* Header Document */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-blue-600 uppercase">
                    GymBooking España
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 font-medium">Informe de Asociación</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                  {gym.name}
                </h1>
                {gym.legal_name && (
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Razón Social: <strong className="text-slate-700 dark:text-slate-300">{gym.legal_name}</strong>
                  </p>
                )}
              </div>

              <div className="text-right flex flex-col items-start sm:items-end gap-1.5">
                <div className="flex items-center gap-2">
                  {gym.commercial_status && (
                    <Badge variant="outline" className="font-bold border-blue-200 text-blue-700 bg-blue-50 dark:bg-blue-950/40">
                      {gym.commercial_status.name}
                    </Badge>
                  )}
                  {gym.onboarding_status && (
                    <Badge
                      variant={gym.onboarding_status.slug === 'active' ? 'success' : 'secondary'}
                      className="font-bold"
                    >
                      {gym.onboarding_status.name}
                    </Badge>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 font-medium">
                  Generado el {formatDate(new Date().toISOString())}
                </span>
              </div>
            </div>

            {/* Grid 1: Datos de Contacto y Ubicación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Ubicación e Instalaciones
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                    <span>
                      {gym.address || 'Dirección no registrada'}, {gym.postal_code || ''} {gym.city || 'Madrid'}
                    </span>
                  </div>
                  {gym.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{gym.phone}</span>
                    </div>
                  )}
                  {gym.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{gym.email}</span>
                    </div>
                  )}
                  {gym.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{gym.website}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Responsables de Cuenta
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div>
                    <span className="text-slate-400 font-medium">Responsable Comercial:</span>{' '}
                    <strong>{gym.owner?.full_name || 'Sin asignar'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Gestor de Onboarding:</span>{' '}
                    <strong>{gym.onboarding_owner?.full_name || 'Sin asignar'}</strong>
                  </div>
                  {gym.gym_contacts && gym.gym_contacts.length > 0 && (
                    <div className="pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-slate-400 font-medium">Contacto Principal del Centro:</span>{' '}
                      <strong>{gym.gym_contacts[0].full_name}</strong>{' '}
                      {gym.gym_contacts[0].job_title && `(${gym.gym_contacts[0].job_title})`}{' '}
                      {gym.gym_contacts[0].phone && `• ${gym.gym_contacts[0].phone}`}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Grid 2: Condiciones Comerciales */}
            <div className="p-4.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Condiciones Comerciales y Operativas Pactadas
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Modelo Pactado</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {gym.business_model_agreed || gym.business_model_proposed || 'Comisión por reserva (20%)'}
                  </strong>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Gestión de Reservas</span>
                  <strong className="text-slate-900 dark:text-white text-sm capitalize">
                    {gym.booking_manager || 'GymBooking Platform'}
                  </strong>
                </div>

                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Cancelaciones</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {gym.cancellation_policy || 'Hasta 2 horas antes'}
                  </strong>
                </div>
              </div>

              {gym.commission_details && (
                <div className="text-xs text-slate-600 dark:text-slate-400 p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Detalles de liquidación:</span>{' '}
                  {gym.commission_details}
                </div>
              )}
            </div>

            {/* Grid 3: Clases Ofertadas */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4 text-blue-600" />
                  Catálogo de Clases Activas ({gym.classes.length})
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {onboardingPct}% Onboarding Completado ({completedOnboarding}/{totalOnboarding} hitos)
                </span>
              </div>

              {gym.classes.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed text-center text-xs text-slate-400">
                  No hay clases registradas aún para este centro.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {gym.classes.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 flex items-center justify-between"
                    >
                      <div>
                        <strong className="text-slate-900 dark:text-white block">{c.name}</strong>
                        <span className="text-slate-500 text-[11px]">
                          {c.discipline?.name || 'General'} • {c.duration_minutes || 60} min • Nivel {c.level || 'Todos'}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold text-slate-800 dark:text-slate-200 block">
                          {c.price ? `${c.price} €` : 'Pase GymBooking'}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-semibold capitalize">
                          {c.publication_status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Document Signatures */}
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-500">
              <div className="space-y-8">
                <span>Por GymBooking España:</span>
                <div className="border-b border-slate-300 dark:border-slate-700 w-48" />
                <span className="block text-[11px]">Firma y Sello de Operaciones</span>
              </div>

              <div className="space-y-8 text-right flex flex-col items-end">
                <span>Por la Dirección del Centro ({gym.name}):</span>
                <div className="border-b border-slate-300 dark:border-slate-700 w-48" />
                <span className="block text-[11px]">Firma de Conformidad</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-white dark:bg-slate-900 flex justify-between items-center sm:justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Impresión formateada automáticamente para papel A4 estándar
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Imprimir Ficha
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
