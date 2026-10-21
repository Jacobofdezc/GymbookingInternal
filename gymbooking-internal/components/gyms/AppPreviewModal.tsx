'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Smartphone,
  CheckCircle2,
  Clock,
  Users,
  MapPin,
  Star,
  Sparkles,
  ArrowRight,
  Eye,
  Calendar,
  Share2,
  Heart,
  ChevronLeft,
  Flame,
  Check,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Dumbbell,
  ShieldCheck,
} from 'lucide-react'
import { publishAllGymClasses } from '@/services/operations/onboarding.service'

interface ScheduleItem {
  id?: string
  day_of_week: number
  start_time: string
  end_time: string
  is_active?: boolean
}

export interface AppPreviewClass {
  id: string
  name: string
  description?: string | null
  level?: string | null
  duration_minutes?: number | null
  capacity?: number | null
  price?: number | null
  publication_status: string
  discipline?: { name: string } | null
  class_schedules?: ScheduleItem[]
}

export interface AppPreviewGym {
  id: string
  name: string
  city?: string | null
  address?: string | null
  classes: AppPreviewClass[]
}

interface AppPreviewModalProps {
  gym: AppPreviewGym
  isOpen: boolean
  onClose: () => void
  onPublishAllSuccess?: () => void
}

const DAY_NAMES_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DAY_NAMES_FULL = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function AppPreviewModal({
  gym,
  isOpen,
  onClose,
  onPublishAllSuccess,
}: AppPreviewModalProps) {
  // Mode: 'user' shows only published classes, 'supervisor' shows all with draft labels
  const [viewMode, setViewMode] = useState<'user' | 'supervisor'>('user')
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay())
  const [bookingConfirmedClass, setBookingConfirmedClass] = useState<AppPreviewClass | null>(null)
  const [copiedApi, setCopiedApi] = useState(false)
  const [publishingAll, setPublishingAll] = useState(false)

  const publishedCount = useMemo(
    () => gym.classes.filter((c) => c.publication_status === 'published').length,
    [gym.classes]
  )
  const draftCount = gym.classes.length - publishedCount

  // Filter classes according to viewMode & selectedDay
  const displayedClasses = useMemo(() => {
    return gym.classes.filter((c) => {
      // Filter by publication mode
      if (viewMode === 'user' && c.publication_status !== 'published') {
        return false
      }

      // If class has schedules, filter by day_of_week
      const activeSchedules = (c.class_schedules || []).filter((s) => s.is_active !== false)
      if (activeSchedules.length > 0) {
        return activeSchedules.some((s) => s.day_of_week === selectedDay)
      }

      // If no schedules are explicitly set, show on all days as available daily class
      return true
    })
  }, [gym.classes, viewMode, selectedDay])

  const handlePublishAll = async () => {
    try {
      setPublishingAll(true)
      await publishAllGymClasses(gym.id)
      onPublishAllSuccess?.()
    } catch (err) {
      console.error('Error publishing all classes:', err)
      alert('Error al publicar las clases')
    } finally {
      setPublishingAll(false)
    }
  }

  const copyApiUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/api/app/gyms/${gym.id}/classes`
    navigator.clipboard.writeText(url)
    setCopiedApi(true)
    setTimeout(() => setCopiedApi(false), 2000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                <Smartphone className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Simulador de App Móvil — {gym.name}
              </DialogTitle>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Vista previa interactiva de cómo ven los usuarios este gimnasio en la app móvil de GymBooking.
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setViewMode('user')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'user'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vista Usuario ({publishedCount} en App)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('supervisor')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                viewMode === 'supervisor'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Vista Supervisor (Todas {gym.classes.length})
            </button>
          </div>
        </div>

        {/* Modal Body: Split in Phone Mockup and Control Panel */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-h-[82vh] overflow-y-auto">
          {/* LEFT: Smartphone Mockup (cols 12 -> 7) */}
          <div className="lg:col-span-7 flex justify-center">
            {/* Phone casing */}
            <div className="relative w-full max-w-[340px] sm:max-w-[360px] h-[640px] rounded-[48px] p-3 bg-slate-900 dark:bg-black shadow-2xl border-4 border-slate-700/80 dark:border-slate-800 ring-1 ring-slate-800 flex flex-col">
              {/* Dynamic Island / Notch */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-slate-950 rounded-full z-30 flex items-center justify-between px-3">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-2.5 h-2.5 rounded-full bg-blue-950/80 border border-blue-900" />
              </div>

              {/* Screen container */}
              <div className="relative w-full h-full rounded-[38px] bg-white dark:bg-slate-950 overflow-hidden flex flex-col text-slate-900 dark:text-slate-100">
                {/* Phone Top Status bar */}
                <div className="h-10 pt-3 px-6 flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400 shrink-0 z-20">
                  <span>9:41</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px]">5G</span>
                    <div className="w-5 h-2.5 border border-slate-400 dark:border-slate-600 rounded-xs p-0.5 flex items-center">
                      <div className="w-full h-full bg-slate-600 dark:bg-slate-400 rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* In-App Header & Cover */}
                <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white p-4 shrink-0 pb-5">
                  <div className="flex items-center justify-between mb-3 text-white/90">
                    <span className="p-1 rounded-full bg-black/20 backdrop-blur-xs">
                      <ChevronLeft className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold tracking-wide uppercase text-blue-200">
                      GymBooking App
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-full bg-black/20 backdrop-blur-xs">
                        <Heart className="h-3.5 w-3.5" />
                      </span>
                      <span className="p-1 rounded-full bg-black/20 backdrop-blur-xs">
                        <Share2 className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner shrink-0">
                      {gym.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-base leading-tight text-white line-clamp-1">
                          {gym.name}
                        </h3>
                        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-blue-100 mt-1">
                        <span className="flex items-center gap-0.5">
                          <MapPin className="h-3 w-3" />
                          {gym.city || 'España'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5 text-amber-300 font-bold">
                          <Star className="h-3 w-3 fill-amber-300" />
                          4.9
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 text-[10px] font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Abierto para reservas
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/10 text-white/90 text-[10px] font-medium">
                      {publishedCount} clases activas
                    </span>
                  </div>
                </div>

                {/* Day selector carousel inside phone */}
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                  {DAY_NAMES_SHORT.map((dayName, idx) => {
                    const isSelected = selectedDay === idx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedDay(idx)}
                        className={`flex flex-col items-center py-1.5 px-2.5 rounded-xl text-center min-w-[42px] transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs font-bold'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 font-medium'
                        }`}
                      >
                        <span className="text-[10px] uppercase opacity-80">{dayName}</span>
                        <span className="text-xs">{idx === new Date().getDay() ? 'Hoy' : idx + 10}</span>
                      </button>
                    )
                  })}
                </div>

                {/* In-phone Classes Feed */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                    <span>Clases {DAY_NAMES_FULL[selectedDay]}</span>
                    <span>{displayedClasses.length} disp.</span>
                  </div>

                  {displayedClasses.length === 0 ? (
                    <div className="py-12 px-4 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <Calendar className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {viewMode === 'user'
                            ? 'No hay clases públicas hoy'
                            : 'No hay clases programadas para este día'}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          {viewMode === 'user' && draftCount > 0
                            ? `Hay ${draftCount} clases en borrador. Pulsa "Publicar en App" para que los usuarios puedan verlas.`
                            : 'Configura el horario semanal o añade clases para este día.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    displayedClasses.map((cls) => {
                      const isPublished = cls.publication_status === 'published'
                      const activeSchedule = (cls.class_schedules || []).find(
                        (s) => s.day_of_week === selectedDay && s.is_active !== false
                      )
                      const timeDisplay = activeSchedule
                        ? `${activeSchedule.start_time.slice(0, 5)} - ${activeSchedule.end_time.slice(0, 5)}`
                        : `${cls.duration_minutes || 60} min`

                      return (
                        <div
                          key={cls.id}
                          className={`p-3 rounded-2xl border transition-all relative ${
                            isPublished
                              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400'
                              : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300/80 dark:border-amber-900/60'
                          }`}
                        >
                          {/* Draft pill indicator for supervisor */}
                          {!isPublished && (
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                                Borrador / Oculto en App
                              </span>
                              <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                                Solo visible en CRM
                              </span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {cls.discipline?.name || 'Fitness'}
                              </span>
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                {cls.name}
                              </h4>
                            </div>

                            <div className="text-right">
                              <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100">
                                {cls.price ? `${cls.price}€` : 'Pase Gym'}
                              </span>
                              <span className="block text-[9px] text-slate-400">por sesión</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                              <Clock className="h-3 w-3 text-blue-500" />
                              {timeDisplay}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-emerald-500" />
                              {cls.capacity ? `${cls.capacity} plazas` : 'Aforo libre'}
                            </span>
                          </div>

                          {/* Reservation button simulation */}
                          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              Plazas disponibles
                            </span>

                            <button
                              type="button"
                              onClick={() => setBookingConfirmedClass(cls)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1"
                            >
                              Reservar
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Simulated booking confirmation overlay inside phone */}
                {bookingConfirmedClass && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-40 flex items-end p-4 animate-in fade-in duration-200">
                    <div className="w-full bg-white dark:bg-slate-900 rounded-3xl p-4 shadow-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="h-7 w-7" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          ¡Plaza Reservada con Éxito!
                        </h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Has reservado plaza para &ldquo;{bookingConfirmedClass.name}&rdquo; en {gym.name}.
                        </p>
                        <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 font-semibold">
                          (Simulación interactiva de la App GymBooking)
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="w-full rounded-xl cursor-pointer"
                        onClick={() => setBookingConfirmedClass(null)}
                      >
                        Entendido
                      </Button>
                    </div>
                  </div>
                )}

                {/* Home Indicator line */}
                <div className="h-6 flex items-center justify-center shrink-0 z-20">
                  <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Publication Control Center & API Status (cols 12 -> 5) */}
          <div className="lg:col-span-5 space-y-4">
            {/* KPI Summary Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                Estado de Publicación en App
              </h4>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <span className="block text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {publishedCount}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                    En directo en la App
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60">
                  <span className="block text-xl font-black text-amber-600 dark:text-amber-400">
                    {draftCount}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    Ocultas / Borrador
                  </span>
                </div>
              </div>

              {/* Fast Action: Publish all */}
              {draftCount > 0 ? (
                <Button
                  onClick={handlePublishAll}
                  disabled={publishingAll}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm text-xs"
                >
                  {publishingAll ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Publicar todas ({draftCount} pendientes) en la App
                </Button>
              ) : (
                <div className="p-2.5 rounded-xl bg-emerald-100/60 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                  Todas las clases de este gimnasio están publicadas en directo.
                </div>
              )}
            </div>

            {/* API Integration Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ExternalLink className="h-4 w-4 text-slate-500" />
                  Endpoint de Consumo (API REST)
                </h4>
                <Badge variant="outline" className="text-[10px] font-mono">
                  GET v1
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                La futura App móvil (o cualquier front de reservas externo) consume las clases publicadas directamente mediante esta URL:
              </p>

              <div className="p-2.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono flex items-center justify-between gap-2 overflow-x-auto">
                <span className="truncate">/api/app/gyms/{gym.id}/classes</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyApiUrl}
                  className="h-7 px-2 text-slate-300 hover:text-white hover:bg-slate-800 shrink-0 cursor-pointer"
                  title="Copiar URL"
                >
                  {copiedApi ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-600 dark:text-slate-400 space-y-1 border border-slate-200 dark:border-slate-800">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  ⚡ ¿Cómo funciona la sincronización?
                </p>
                <p>
                  1. Cada vez que pulsas <strong>&ldquo;Publicar en App&rdquo;</strong> en el CRM, el estado se guarda instantáneamente.
                </p>
                <p>
                  2. La app móvil lee únicamente clases con estado <code>published</code> y muestra sus horarios en la parrilla semanal.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onClose}
              className="w-full rounded-xl cursor-pointer text-xs"
            >
              Cerrar Simulador
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
