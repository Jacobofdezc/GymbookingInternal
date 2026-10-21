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
  ExternalLink,
} from 'lucide-react'

interface GymExecutiveReportModalProps {
  gym: FullGymDetail
  isOpen: boolean
  onClose: () => void
}

const DAY_MAP_SHORT: Record<number, string> = {
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
  0: 'Dom',
}

export function GymExecutiveReportModal({
  gym,
  isOpen,
  onClose,
}: GymExecutiveReportModalProps) {
  const completedOnboarding = gym.gym_onboarding_items.filter(
    (i) => i.status === 'completed'
  ).length
  const totalOnboarding = gym.gym_onboarding_items.length
  const onboardingPct =
    totalOnboarding > 0 ? Math.round((completedOnboarding / totalOnboarding) * 100) : 0

  const primaryContact = gym.gym_contacts?.find((c) => c.is_primary) || gym.gym_contacts?.[0]
  const advisorName = gym.onboarding_owner?.full_name || gym.owner?.full_name || 'Equipo de Operaciones GymBooking'
  const advisorEmail = gym.onboarding_owner?.email || gym.owner?.email || 'operaciones@gymbooking.app'
  const expRef = `EXP-GB-${gym.id.slice(0, 8).toUpperCase()}`

  // Generate isolated, pristine A4 PDF printable document
  const handlePrintCleanPdf = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000')
    if (!printWindow) {
      alert('Por favor, permite ventanas emergentes en tu navegador para generar el PDF oficial.')
      return
    }

    const classesRows = gym.classes.length === 0
      ? `<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 16px;">No hay clases dadas de alta aún en este expediente.</td></tr>`
      : gym.classes
          .map((c) => {
            const schedules = c.class_schedules || []
            const days = schedules.length > 0
              ? schedules.map((s) => DAY_MAP_SHORT[s.day_of_week] || 'D').join(', ')
              : 'Flexible'
            const time = schedules[0]?.start_time
              ? `${schedules[0].start_time.slice(0, 5)} - ${schedules[0].end_time.slice(0, 5)}`
              : `${c.duration_minutes || 60}m`

            const statusLabel = c.publication_status === 'published' ? '🟢 Publicada en App' : '🟡 Borrador'

            return `
              <tr>
                <td><strong>${c.name}</strong></td>
                <td>${c.discipline?.name || 'General'}</td>
                <td><span style="font-family: monospace;">${days} · ${time}</span></td>
                <td>${c.level ? c.level.charAt(0).toUpperCase() + c.level.slice(1) : 'Todos'}</td>
                <td>${c.capacity ? `${c.capacity} pl.` : 'Libre'}</td>
                <td style="text-align: right;"><strong>${c.price ? `${c.price} €` : 'Pase Gym'}</strong></td>
              </tr>
            `
          })
          .join('')

    const checklistRows = gym.gym_onboarding_items
      .map((item) => {
        const isDone = item.status === 'completed'
        return `
          <div style="display: flex; align-items: flex-start; gap: 8px; font-size: 8.5pt; margin-bottom: 4px;">
            <span style="color: ${isDone ? '#16a34a' : '#94a3b8'}; font-weight: bold;">${isDone ? '✓' : '○'}</span>
            <span style="${isDone ? 'color: #334155;' : 'color: #64748b;'}">${item.title}</span>
          </div>
        `
      })
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8" />
        <title>Ficha Oficial - ${gym.name} - GymBooking</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 10pt;
            line-height: 1.45;
          }
          .page {
            width: 100%;
            max-width: 190mm;
            margin: 0 auto;
          }
          .header-bar {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #22c55e;
            padding-bottom: 12px;
            margin-bottom: 18px;
          }
          .brand-name {
            font-size: 22pt;
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1;
          }
          .brand-name span {
            color: #22c55e;
          }
          .brand-sub {
            font-size: 8.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #64748b;
            margin-top: 3px;
          }
          .header-right {
            text-align: right;
            font-size: 8.5pt;
            color: #64748b;
          }
          .doc-badge {
            display: inline-block;
            background: #f0fdf4;
            color: #166534;
            border: 1px solid #bbf7d0;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 8.5pt;
            margin-bottom: 3px;
          }
          .gym-heading {
            margin-bottom: 16px;
          }
          .gym-name {
            font-size: 18pt;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
            line-height: 1.2;
          }
          .gym-meta {
            font-size: 9pt;
            color: #475569;
            margin-top: 2px;
          }
          .section {
            margin-bottom: 16px;
            page-break-inside: avoid;
          }
          .section-title {
            font-size: 10pt;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #0f172a;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 10px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
          }
          .card-label {
            font-size: 7.5pt;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            display: block;
            margin-bottom: 2px;
          }
          .card-value {
            font-size: 9.5pt;
            font-weight: 700;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5pt;
            margin-top: 4px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 800;
            text-align: left;
            padding: 6px 8px;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 7.5pt;
          }
          td {
            padding: 6px 8px;
            border-bottom: 1px solid #f1f5f9;
          }
          tr:nth-child(even) td {
            background: #fafafa;
          }
          .checklist-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 12px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 4px 16px;
          }
          .signatures {
            margin-top: 25px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            page-break-inside: avoid;
          }
          .sig-box {
            border-top: 1px solid #64748b;
            padding-top: 6px;
            font-size: 8pt;
            color: #64748b;
          }
          .footer {
            margin-top: 20px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 7.5pt;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <!-- Corporate Header -->
          <div class="header-bar">
            <div>
              <div class="brand-name">Gym<span>booking</span></div>
              <div class="brand-sub">Ficha Ejecutiva Oficial · Red de Centros Asociados</div>
            </div>
            <div class="header-right">
              <div class="doc-badge">DOCUMENTO CERTIFICADO</div>
              <div>Ref: <strong>${expRef}</strong></div>
              <div>Emisión: ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
            </div>
          </div>

          <!-- Gym Heading -->
          <div class="gym-heading">
            <h1 class="gym-name">${gym.name}</h1>
            <div class="gym-meta">
              ${gym.legal_name ? `Razón Social: <strong>${gym.legal_name}</strong> · ` : ''}
              Ubicación: <strong>${gym.city || 'España'}</strong> (${gym.address || 'Dirección comercial'})
            </div>
          </div>

          <!-- Section 1: Contacto y Gestión -->
          <div class="section">
            <div class="section-title">1. Datos Identificativos y Responsables</div>
            <div class="grid-3">
              <div class="card">
                <span class="card-label">Contacto Principal del Centro</span>
                <span class="card-value">${primaryContact ? `${primaryContact.full_name} (${primaryContact.job_title || 'Responsable'})` : 'Dirección del centro'}</span>
                <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">
                  ${gym.phone ? `Tel: ${gym.phone}` : ''} ${gym.email ? `· ${gym.email}` : ''}
                </div>
              </div>

              <div class="card">
                <span class="card-label">Asesor GymBooking Asignado</span>
                <span class="card-value">${advisorName}</span>
                <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">
                  ${advisorEmail}
                </div>
              </div>

              <div class="card">
                <span class="card-label">Estado de Afiliación</span>
                <span class="card-value" style="color: #166534;">${gym.commercial_status?.name || 'Confirmado'}</span>
                <div style="font-size: 8pt; color: #64748b; margin-top: 2px;">
                  Onboarding: ${gym.onboarding_status?.name || 'En curso'} (${onboardingPct}%)
                </div>
              </div>
            </div>
          </div>

          <!-- Section 2: Condiciones y Modelo Acordado -->
          <div class="section">
            <div class="section-title">2. Condiciones Comerciales y Operativas</div>
            <div class="grid-3">
              <div class="card">
                <span class="card-label">Modelo Económico</span>
                <span class="card-value">${gym.business_model_agreed || gym.business_model_proposed || 'Comisión estándar por reserva'}</span>
              </div>
              <div class="card">
                <span class="card-label">Sistema de Reservas</span>
                <span class="card-value">${gym.booking_manager || 'GymBooking Platform App'}</span>
              </div>
              <div class="card">
                <span class="card-label">Política de Cancelación</span>
                <span class="card-value">${gym.cancellation_policy || 'Hasta 2 horas antes de la sesión'}</span>
              </div>
            </div>
          </div>

          <!-- Section 3: Catálogo de Clases -->
          <div class="section">
            <div class="section-title">
              <span>3. Catálogo de Clases y Oferta Deportiva en App</span>
              <span style="font-size: 8.5pt; font-weight: normal; color: #64748b;">${gym.classes.length} clases verificadas</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Clase</th>
                  <th>Disciplina</th>
                  <th>Horario Semanal</th>
                  <th>Nivel</th>
                  <th>Aforo</th>
                  <th style="text-align: right;">Tarifa</th>
                </tr>
              </thead>
              <tbody>
                ${classesRows}
              </tbody>
            </table>
          </div>

          <!-- Section 4: Checklist de Incorporación -->
          <div class="section">
            <div class="section-title">
              <span>4. Estado de Validación y Checklist de Alta</span>
              <span style="font-size: 8.5pt; font-weight: 700; color: #16a34a;">${completedOnboarding}/${totalOnboarding} pasos completados (${onboardingPct}%)</span>
            </div>
            <div class="checklist-box">
              ${checklistRows}
            </div>
          </div>

          <!-- Section 5: Firmas de Conformidad -->
          <div class="signatures">
            <div>
              <div class="sig-box">
                <strong>Por GymBooking Technologies S.L.</strong><br/>
                Departamento de Operaciones & Asociaciones<br/>
                Fecha: ${new Date().toLocaleDateString('es-ES')}
              </div>
            </div>
            <div>
              <div class="sig-box">
                <strong>Por la Dirección del Centro (${gym.name})</strong><br/>
                Firma y sello de conformidad<br/>
                Fecha: ____ / ____ / 2026
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            GymBooking Technologies S.L. · Documento oficial y confidencial emitido para la gestión de acuerdos y publicación en la App.
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 350);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <DialogHeader className="p-5 border-b bg-white dark:bg-slate-900 sticky top-0 z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Ficha Ejecutiva Oficial • {gym.name}
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Documento formal A4 listo para guardar como PDF o enviar al cliente
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={handlePrintCleanPdf}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer text-xs h-9 px-3.5"
            >
              <Download className="h-4 w-4" />
              Guardar / Descargar PDF Oficial
            </Button>
          </div>
        </DialogHeader>

        {/* Paper Canvas Preview */}
        <div className="p-6">
          <div
            id="gym-printable-sheet"
            className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-6 text-slate-800 dark:text-slate-200"
          >
            {/* Header Document */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest text-emerald-600 uppercase">
                    GymBooking España
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-xs text-slate-500 font-medium">Informe Oficial de Asociación</span>
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
                <span className="text-[11px] text-slate-400 font-medium font-mono">
                  {expRef} · {formatDate(new Date().toISOString())}
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
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2 text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                  Responsables de la Cuenta
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>
                      Contacto Centro: <strong>{primaryContact?.full_name || 'Dirección'}</strong>
                      {primaryContact?.phone ? ` (${primaryContact.phone})` : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>
                      Asesor GymBooking: <strong>{advisorName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{advisorEmail}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Condiciones y Modelo Acordado */}
            <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                Acuerdos y Condiciones Comerciales
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-200/60 dark:border-slate-700">
                  <span className="text-slate-400 font-medium block text-[10px] uppercase">Modelo Pactado</span>
                  <strong className="text-slate-900 dark:text-white text-sm">
                    {gym.business_model_agreed || gym.business_model_proposed || 'Comisión por reserva'}
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
            Formato A4 oficial certificado para entrega directa a clientes
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
              Cerrar
            </Button>
            <Button
              size="sm"
              onClick={handlePrintCleanPdf}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Guardar / Descargar PDF Oficial
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
