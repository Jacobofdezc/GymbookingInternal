'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  Upload,
  Calendar,
  FileText,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  ShieldCheck,
  Building2,
  AlertCircle,
  ChevronRight,
  ExternalLink,
  Check,
  Loader2,
  Send,
  Eye,
  Download,
  Dumbbell,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { formatDate } from '@/lib/utils'

interface PortalGym {
  id: string
  name: string
  legal_name?: string | null
  description?: string | null
  city?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
  website?: string | null
  instagram?: string | null
  onboarding_status?: { name: string; color: string; slug: string } | null
}

interface PortalAdvisor {
  id?: string
  full_name: string
  email: string
  phone?: string | null
  avatar_url?: string | null
}

interface ChecklistItem {
  id: string
  title: string
  description?: string | null
  status: string
  completed_at?: string | null
  notes?: string | null
}

interface DocumentItem {
  id: string
  name: string
  category?: string | null
  created_at: string
  storage_path: string
  content_type?: string | null
  size_bytes?: number | null
}

interface PortalClass {
  id: string
  name: string
  description?: string | null
  level?: string | null
  capacity?: number | null
  price?: number | null
  duration_minutes?: number | null
  publication_status: string
  discipline?: { name: string } | null
  class_schedules?: Array<{
    id: string
    day_of_week: number
    start_time: string
    end_time: string
    is_active: boolean
  }>
}

interface PortalClientProps {
  gym: PortalGym
  advisor: PortalAdvisor
  initialChecklist: ChecklistItem[]
  initialDocuments: DocumentItem[]
  initialClasses: PortalClass[]
}

const DAY_MAP: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo',
}

export function PortalClient({
  gym,
  advisor,
  initialChecklist,
  initialDocuments,
  initialClasses,
}: PortalClientProps) {
  const [activeTab, setActiveTab] = useState<'checklist' | 'classes' | 'documents' | 'advisor'>('checklist')
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist)

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadCategory, setUploadCategory] = useState<'logo' | 'photos' | 'contract' | 'other'>('photos')
  const [uploadName, setUploadName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)

  // Schedule approval & feedback state
  const [schedulesApproved, setSchedulesApproved] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [contactName, setContactName] = useState('')
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  // Calculate progress
  const completedCount = useMemo(
    () => checklist.filter((item) => item.status === 'completed').length,
    [checklist]
  )
  const totalCount = checklist.length || 1
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  // Handle document upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile) return

    try {
      setIsUploading(true)
      setUploadSuccess(null)

      const formData = new FormData()
      formData.append('file', uploadFile)
      formData.append('category', uploadCategory)
      formData.append('name', uploadName || uploadFile.name)

      const res = await fetch(`/api/portal/${gym.id}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir el archivo')

      setDocuments((prev) => [data.document, ...prev])
      setUploadFile(null)
      setUploadName('')
      setUploadSuccess('¡Archivo subido con éxito! Tu asesor lo revisará en breve.')
      setTimeout(() => setUploadSuccess(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Error al subir archivo')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle schedule approval
  const handleApproveSchedules = async () => {
    try {
      setIsApproving(true)
      const res = await fetch(`/api/portal/${gym.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_schedules',
          confirmedBy: contactName || 'Responsable de Gimnasio',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al confirmar horarios')

      setSchedulesApproved(true)
    } catch (err: any) {
      alert(err.message || 'Error al confirmar')
    } finally {
      setIsApproving(false)
    }
  }

  // Handle send comment / adjustment
  const handleSendFeedback = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feedbackText.trim()) return

    try {
      setIsSendingFeedback(true)
      const res = await fetch(`/api/portal/${gym.id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_comment',
          comments: feedbackText.trim(),
          confirmedBy: contactName || 'Responsable de Gimnasio',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar mensaje')

      setFeedbackText('')
      setFeedbackSuccess('Mensaje enviado directamente a tu asesor. Te responderá pronto.')
      setTimeout(() => setFeedbackSuccess(null), 4000)
    } catch (err: any) {
      alert(err.message || 'Error al enviar')
    } finally {
      setIsSendingFeedback(false)
    }
  }

  const advisorWhatsAppUrl = `https://wa.me/${(advisor.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    `Hola ${advisor.full_name}, te escribo desde el portal de onboarding de ${gym.name}.`
  )}`

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 border-b border-slate-200/90 dark:border-slate-800 backdrop-blur-md px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link href={`/portal/${gym.id}`} className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Gymbooking"
              width={130}
              height={26}
              className="h-6.5 w-auto dark:hidden"
              priority
            />
            <Image
              src="/logo-dark.png"
              alt="Gymbooking"
              width={130}
              height={26}
              className="h-6.5 w-auto hidden dark:block"
              priority
            />
          </Link>
          <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-800" />
          <span className="hidden sm:inline-block text-xs font-bold text-slate-500 uppercase tracking-wider">
            Portal de Incorporación
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="block text-xs font-black text-slate-900 dark:text-white leading-tight">
              {gym.name}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {gym.city || 'España'}
            </span>
          </div>

          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Proceso de Alta en GymBooking
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Bienvenido al portal de {gym.name}
              </h1>
              <p className="text-sm text-blue-200 max-w-2xl">
                Desde aquí puedes consultar el estado de tu alta, revisar tus horarios y subir el logotipo o fotos de tus instalaciones para que tu gimnasio luzca impecable en la App.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="pt-2 space-y-2 max-w-lg">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-blue-200">Progreso de Incorporación</span>
                <span className="text-emerald-400 font-black">{progressPercent}% completado</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-blue-200/80">
                {completedCount} de {totalCount} pasos completados con éxito.
              </p>
            </div>
          </div>

          {/* Background subtle decoration */}
          <div className="absolute -right-8 -bottom-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('checklist')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'checklist'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Checklist del Alta</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-white/20 text-[11px]">
              {completedCount}/{totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('classes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'classes'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            <span>Clases y Horarios ({initialClasses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Subir Fotos y Logo ({documents.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('advisor')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'advisor'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Tu Asesor</span>
          </button>
        </div>

        {/* TAB 1: CHECKLIST DE ALTA */}
        {activeTab === 'checklist' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Pasos de Incorporación y Activación
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Sigue en tiempo real qué partes del proceso están listas y cuáles están en curso.
              </p>
            </CardHeader>
            <CardContent className="pt-5 space-y-3">
              {checklist.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-6 text-center">
                  El checklist se inicializará en breve por tu gestor de cuenta.
                </p>
              ) : (
                checklist.map((item, idx) => {
                  const isDone = item.status === 'completed'
                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                        isDone
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div
                        className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs ${
                          isDone
                            ? 'bg-emerald-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {isDone ? <Check className="h-4 w-4 stroke-[3]" /> : idx + 1}
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <h4
                            className={`font-bold text-sm ${
                              isDone ? 'text-emerald-900 dark:text-emerald-200 line-through opacity-85' : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            {item.title}
                          </h4>
                          {isDone ? (
                            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                              ✓ Completado
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              En progreso
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {item.description}
                          </p>
                        )}

                        {item.notes && (
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 italic pt-0.5">
                            Nota: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: CLASES Y HORARIOS */}
        {activeTab === 'classes' && (
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardHeader className="border-b pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                      <Dumbbell className="h-5 w-5 text-blue-600" />
                      Clases y Horarios Registrados en GymBooking
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Comprueba que tus clases, horarios y aforos configurados son correctos.
                    </p>
                  </div>

                  {schedulesApproved ? (
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="h-4 w-4" />
                      Horarios Aprobados por el Gimnasio
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleApproveSchedules}
                      disabled={isApproving}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-xs self-start sm:self-auto text-xs"
                    >
                      {isApproving ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1.5" />
                      )}
                      Dar Visto Bueno a los Horarios
                    </Button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-5 space-y-4">
                {initialClasses.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      Aún no hay clases registradas
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tu asesor está cargando tu parrilla horaria. Aparecerán aquí en cuanto estén listas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {initialClasses.map((cls) => {
                      const schedules = cls.class_schedules || []
                      const daysText = schedules.length > 0
                        ? schedules.map((s) => DAY_MAP[s.day_of_week] || 'D').join(', ')
                        : 'Horario flexible'
                      const timeText = schedules[0]?.start_time
                        ? `${schedules[0].start_time.slice(0, 5)} - ${schedules[0].end_time.slice(0, 5)}`
                        : `${cls.duration_minutes || 60} min`

                      return (
                        <div
                          key={cls.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {cls.discipline?.name || 'Fitness'}
                              </span>
                              <h4 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight mt-0.5">
                                {cls.name}
                              </h4>
                            </div>

                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {cls.price ? `${cls.price}€` : 'Pase Gym'}
                            </span>
                          </div>

                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                            <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                              <Calendar className="h-3.5 w-3.5 text-blue-500" />
                              {daysText}
                            </span>
                            <span className="flex items-center gap-1 text-muted-foreground font-mono">
                              <Clock className="h-3 w-3" />
                              {timeText}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                            <span>Nivel: <strong className="capitalize">{cls.level || 'Todos'}</strong></span>
                            <span>Aforo: <strong>{cls.capacity ? `${cls.capacity} plazas` : 'Libre'}</strong></span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Request changes form */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardHeader className="border-b pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Send className="h-4 w-4 text-blue-600" />
                  ¿Quieres corregir o modificar algún horario?
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Escríbenos directamente y tu asesor aplicará los cambios en tu ficha.
                </p>
              </CardHeader>
              <CardContent className="pt-4">
                <form onSubmit={handleSendFeedback} className="space-y-3">
                  {feedbackSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      {feedbackSuccess}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="contact-name" className="text-xs">Tu Nombre / Cargo</Label>
                      <Input
                        id="contact-name"
                        placeholder="Ej. Juan Pérez (Gerente)"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="feedback-text" className="text-xs">Observaciones o cambios necesarios</Label>
                    <Textarea
                      id="feedback-text"
                      placeholder="Ej. Los martes a las 19:00 cambiamos Spinning por Pilates, y el aforo de CrossFit es de 25 plazas..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={3}
                      className="text-xs"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isSendingFeedback}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                  >
                    {isSendingFeedback ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Send className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Enviar Cambios a mi Asesor
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: SUBIR FOTOS Y DOCUMENTOS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
              <CardHeader className="border-b pb-4">
                <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Subida de Logotipo, Fotos y Documentación
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sube el logo de tu gimnasio en alta resolución y fotos de tus salas e instalaciones para que tu perfil luzca atractivo en la app.
                </p>
              </CardHeader>
              <CardContent className="pt-5 space-y-4">
                {uploadSuccess && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    {uploadSuccess}
                  </div>
                )}

                <form onSubmit={handleUploadSubmit} className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="upload-cat" className="text-xs">Tipo de archivo *</Label>
                      <select
                        id="upload-cat"
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as any)}
                        className="w-full text-xs h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 font-medium"
                      >
                        <option value="logo">Logotipo oficial del gimnasio</option>
                        <option value="photos">Fotografía de sala / instalación</option>
                        <option value="contract">Contrato / CIF / Documentación fiscal</option>
                        <option value="other">Otro documento</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="upload-name" className="text-xs">Título del archivo (opcional)</Label>
                      <Input
                        id="upload-name"
                        placeholder="Ej. Foto Sala CrossFit, Logo vector..."
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="upload-file" className="text-xs">Seleccionar imagen o documento *</Label>
                    <Input
                      id="upload-file"
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={isUploading || !uploadFile}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    {isUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Upload className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    Subir a GymBooking
                  </Button>
                </form>

                {/* List of uploaded files */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Archivos ya vinculados a tu gimnasio ({documents.length})
                  </h4>

                  {documents.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-3">
                      Aún no se ha subido ningún documento.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shadow-2xs"
                        >
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {doc.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground block">
                                {formatDate(doc.created_at)} • {doc.category || 'Archivo'}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 shrink-0">
                            Recibido
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: TU ASESOR */}
        {activeTab === 'advisor' && (
          <Card className="border-slate-200 dark:border-slate-800 shadow-2xs">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                Tu Gestor de Incorporación Asignado
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Persona de contacto directa en GymBooking para resolver dudas y acompañarte en todo el proceso.
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-xl mx-auto space-y-5 text-center sm:text-left sm:flex sm:items-center sm:gap-6">
                <div className="w-20 h-20 rounded-full bg-blue-600 text-white font-black text-2xl flex items-center justify-center mx-auto sm:mx-0 shadow-lg shadow-blue-500/20 shrink-0">
                  {advisor.full_name.charAt(0)}
                </div>

                <div className="space-y-2 flex-1">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {advisor.full_name}
                    </h3>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      Asesor de Operaciones & Onboarding · GymBooking
                    </p>
                  </div>

                  <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <p className="flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <a href={`mailto:${advisor.email}`} className="hover:underline text-slate-700 dark:text-slate-300">
                        {advisor.email}
                      </a>
                    </p>
                    {advisor.phone && (
                      <p className="flex items-center justify-center sm:justify-start gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <a href={`tel:${advisor.phone}`} className="hover:underline text-slate-700 dark:text-slate-300">
                          {advisor.phone}
                        </a>
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    {advisor.phone && (
                      <Button
                        size="sm"
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer text-xs shadow-xs"
                      >
                        <a href={advisorWhatsAppUrl} target="_blank" rel="noopener noreferrer">
                          <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                          Chat de WhatsApp
                        </a>
                      </Button>
                    )}

                    <Button size="sm" variant="outline" asChild className="rounded-xl text-xs">
                      <a href={`mailto:${advisor.email}`}>
                        <Mail className="h-3.5 w-3.5 mr-1.5" />
                        Enviar Email
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 px-4 text-center text-xs text-slate-400 dark:text-slate-500">
        <p>© {new Date().getFullYear()} GymBooking Technologies S.L. · Portal Seguro de Incorporación para Gimnasios</p>
      </footer>
    </div>
  )
}
