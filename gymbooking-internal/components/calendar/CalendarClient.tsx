'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Building2,
  CheckCircle2,
  AlertTriangle,
  PhoneCall,
  CalendarCheck,
  Filter,
  List,
  Columns,
  Grid3X3,
  ExternalLink,
  Download,
  Plus,
} from 'lucide-react'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'

export type CalendarEventType = 'task' | 'followup' | 'interaction'

export interface CalendarEvent {
  id: string
  type: CalendarEventType
  title: string
  date: string // YYYY-MM-DD
  time?: string
  gymId?: string | null
  gymName?: string | null
  link: string
  priority?: string | null
  status?: string | null
  description?: string | null
}

interface CalendarClientProps {
  initialEvents: CalendarEvent[]
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const DAY_NAMES_FULL = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
]

export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const router = useRouter()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'agenda'>('month')
  const [typeFilter, setTypeFilter] = useState<'all' | CalendarEventType>('all')
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [selectedDateForTask, setSelectedDateForTask] = useState<string | undefined>()

  // Filter events
  const filteredEvents = useMemo(() => {
    return initialEvents.filter((ev) => {
      if (typeFilter !== 'all' && ev.type !== typeFilter) return false
      return true
    })
  }, [initialEvents, typeFilter])

  // Map events by date string (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    filteredEvents.forEach((ev) => {
      const existing = map.get(ev.date) || []
      existing.push(ev)
      map.set(ev.date, existing)
    })
    return map
  }, [filteredEvents])

  // Navigation handlers
  const handlePrev = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1)
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7)
    } else {
      next.setMonth(next.getMonth() - 1)
    }
    setCurrentDate(next)
  }

  const handleNext = () => {
    const next = new Date(currentDate)
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1)
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7)
    } else {
      next.setMonth(next.getMonth() + 1)
    }
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  // Format date helper: YYYY-MM-DD
  const formatYMD = (date: Date): string => {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  // Month Grid Calculation
  const monthGridDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    // Convert Sunday (0) to 6, Monday (1) to 0
    let startDayOfWeek = firstDay.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const prevMonthDays = new Date(year, month, 0).getDate()

    const days: {
      date: Date
      dateString: string
      isCurrentMonth: boolean
      isToday: boolean
      dayNumber: number
    }[] = []

    const todayStr = formatYMD(new Date())

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthDays - i)
      const dateString = formatYMD(d)
      days.push({
        date: d,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        dayNumber: prevMonthDays - i,
      })
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      const dateString = formatYMD(d)
      days.push({
        date: d,
        dateString,
        isCurrentMonth: true,
        isToday: dateString === todayStr,
        dayNumber: i,
      })
    }

    // Next month padding to fill complete weeks (multiples of 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      const dateString = formatYMD(d)
      days.push({
        date: d,
        dateString,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        dayNumber: i,
      })
    }

    return days
  }, [currentDate])

  // Week Days Calculation
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate)
    let dayOfWeek = curr.getDay() - 1
    if (dayOfWeek === -1) dayOfWeek = 6

    const monday = new Date(curr)
    monday.setDate(curr.getDate() - dayOfWeek)

    const todayStr = formatYMD(new Date())
    const days: {
      date: Date
      dateString: string
      dayName: string
      dayNumber: number
      isToday: boolean
    }[] = []

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateString = formatYMD(d)
      days.push({
        date: d,
        dateString,
        dayName: DAY_NAMES_FULL[i],
        dayNumber: d.getDate(),
        isToday: dateString === todayStr,
      })
    }
    return days
  }, [currentDate])

  // Agenda Days Calculation (next 30 days from today)
  const agendaEvents = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const thirtyDaysAhead = new Date(today)
    thirtyDaysAhead.setDate(today.getDate() + 30)

    const todayStr = formatYMD(today)
    const endStr = formatYMD(thirtyDaysAhead)

    const inRange = filteredEvents
      .filter((ev) => ev.date >= todayStr && ev.date <= endStr)
      .sort((a, b) => a.date.localeCompare(b.date))

    // Group by date
    const groups: { date: string; formatted: string; events: CalendarEvent[] }[] = []
    inRange.forEach((ev) => {
      let g = groups.find((x) => x.date === ev.date)
      if (!g) {
        const [y, m, d] = ev.date.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        g = {
          date: ev.date,
          formatted: dateObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
          events: [],
        }
        groups.push(g)
      }
      g.events.push(ev)
    })
    return groups
  }, [filteredEvents])

  // Export events to iCalendar (.ics) format
  const handleExportIcs = () => {
    if (filteredEvents.length === 0) return

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
    const now = new Date()
    const nowStamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`

    const icsEvents = filteredEvents.map((ev) => {
      const start = ev.date.replace(/-/g, '')
      const cleanSummary = (ev.title || 'Evento GymBooking').replace(/[,\n\r]/g, ' ')
      const cleanDesc = (ev.description || (ev.gymName ? `Gimnasio: ${ev.gymName}` : 'Actividad GymBooking CRM')).replace(/[,\n\r]/g, ' ')
      const location = ev.gymName ? `LOCATION:${ev.gymName.replace(/[,\n\r]/g, ' ')}\r\n` : ''

      return [
        'BEGIN:VEVENT',
        `UID:${ev.id}@gymbooking.internal`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART;VALUE=DATE:${start}`,
        `SUMMARY:${cleanSummary}`,
        `DESCRIPTION:${cleanDesc}`,
        location,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].filter(Boolean).join('\r\n')
    })

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GymBooking CRM//Actividades y Seguimientos//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:GymBooking CRM',
      'X-WR-TIMEZONE:Europe/Madrid',
      ...icsEvents,
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gymbooking-calendario-${new Date().toISOString().slice(0, 10)}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Badge helpers
  const getEventBadge = (ev: CalendarEvent) => {
    if (ev.type === 'task') {
      return {
        label: 'Tarea',
        chipClass:
          'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 border',
        dotClass: 'bg-blue-500',
        icon: CalendarCheck,
      }
    }
    if (ev.type === 'followup') {
      return {
        label: 'Seguimiento',
        chipClass:
          'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200 border',
        dotClass: 'bg-purple-500',
        icon: Building2,
      }
    }
    return {
      label: 'Interacción',
      chipClass:
        'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200 border',
      dotClass: 'bg-emerald-500',
      icon: PhoneCall,
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Calendario de Actividades
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Vencimientos de tareas, fechas de seguimiento comercial e interacciones programadas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <Button
            size="sm"
            onClick={() => {
              setSelectedDateForTask(new Date().toISOString().split('T')[0])
              setIsTaskModalOpen(true)
            }}
            className="gap-1.5 text-xs h-9 rounded-xl font-bold shadow-xs cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Programar Tarea
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportIcs}
            disabled={filteredEvents.length === 0}
            className="gap-1.5 text-xs h-9 bg-white shadow-2xs hover:bg-slate-50 text-slate-700 rounded-xl border-slate-200/90 font-semibold cursor-pointer"
            title="Exportar a Google Calendar / Apple / Outlook"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Exportar iCal (.ics)
          </Button>

          {/* View mode toggle buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 shadow-2xs">
          <button
            onClick={() => setViewMode('month')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Grid3X3 className="w-3.5 h-3.5" />
            Mes
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            Semana
          </button>
          <button
            onClick={() => setViewMode('agenda')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'agenda'
                ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/70'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Agenda (30d)
          </button>
        </div>
      </div>
    </div>

      {/* Navigation and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation & Month Name */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="h-8 w-8 p-0 rounded-xl border-slate-200/90 shadow-2xs cursor-pointer hover:bg-slate-50"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="h-8 px-3 text-xs font-bold rounded-xl border-slate-200/90 shadow-2xs cursor-pointer hover:bg-slate-50"
            >
              Hoy
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="h-8 w-8 p-0 rounded-xl border-slate-200/90 shadow-2xs cursor-pointer hover:bg-slate-50"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <h2 className="text-base sm:text-lg font-black text-slate-900 capitalize tracking-tight">
            {viewMode === 'month' &&
              `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
            {viewMode === 'week' &&
              `Semana ${weekDays[0].dayNumber} - ${weekDays[6].dayNumber} de ${
                MONTH_NAMES[weekDays[6].date.getMonth()]
              }`}
            {viewMode === 'agenda' && 'Próximos 30 días'}
          </h2>
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
            }`}
          >
            Todos ({initialEvents.length})
          </button>
          <button
            onClick={() => setTypeFilter('task')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'task'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Tareas
          </button>
          <button
            onClick={() => setTypeFilter('followup')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'followup'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            Seguimientos
          </button>
          <button
            onClick={() => setTypeFilter('interaction')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              typeFilter === 'interaction'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Interacciones
          </button>
        </div>
      </div>

      {/* VIEW: MONTH */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 border-b border-gray-200 text-center bg-gray-50/80 py-2.5">
            {DAY_NAMES.map((name, i) => (
              <span
                key={name}
                className={`text-xs font-bold tracking-wider uppercase ${
                  i >= 5 ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {monthGridDays.map((day, idx) => {
              const dayEvents = eventsByDate.get(day.dateString) || []

              return (
                <div
                  key={day.dateString + idx}
                  className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between group ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                  } ${day.isToday ? 'bg-blue-50/20' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        day.isToday
                          ? 'bg-blue-600 text-white'
                          : day.isCurrentMonth
                          ? 'text-gray-800'
                          : 'text-gray-300'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400">
                          {dayEvents.length}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedDateForTask(day.dateString)
                          setIsTaskModalOpen(true)
                        }}
                        title={`Programar tarea para ${day.dateString}`}
                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day Events Chips */}
                  <div className="space-y-1 overflow-y-auto max-h-[85px] no-scrollbar">
                    {dayEvents.slice(0, 3).map((ev) => {
                      const badge = getEventBadge(ev)
                      const Icon = badge.icon

                      return (
                        <Link
                          key={ev.id}
                          href={ev.link}
                          className={`block px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition-all ${badge.chipClass}`}
                          title={`${badge.label}: ${ev.title}${
                            ev.gymName ? ` (${ev.gymName})` : ''
                          }`}
                        >
                          <span className="flex items-center gap-1 truncate">
                            <span
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${badge.dotClass}`}
                            />
                            <span className="truncate">{ev.title}</span>
                          </span>
                        </Link>
                      )
                    })}

                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-gray-400 font-semibold px-1 block">
                        +{dayEvents.length - 3} más
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* VIEW: WEEK */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const dayEvents = eventsByDate.get(day.dateString) || []

            return (
              <div
                key={day.dateString}
                className={`bg-white rounded-2xl border ${
                  day.isToday
                    ? 'border-blue-400 ring-2 ring-blue-100 shadow-sm'
                    : 'border-gray-200/80 shadow-xs'
                } p-4 flex flex-col min-h-[380px]`}
              >
                {/* Column Day Header */}
                <div className="pb-3 border-b border-gray-100 mb-3 text-center">
                  <span className="text-xs font-semibold text-gray-500 uppercase block">
                    {day.dayName}
                  </span>
                  <span
                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-extrabold mt-1 ${
                      day.isToday
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-900 bg-gray-50'
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                </div>

                {/* Event list */}
                <div className="space-y-2 flex-1 overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <p className="text-xs text-gray-300 text-center pt-8">
                      Sin eventos
                    </p>
                  ) : (
                    dayEvents.map((ev) => {
                      const badge = getEventBadge(ev)
                      const Icon = badge.icon

                      return (
                        <Link
                          key={ev.id}
                          href={ev.link}
                          className="block p-2.5 rounded-xl border border-gray-100 hover:border-gray-300 bg-gray-50/50 hover:bg-white shadow-2xs hover:shadow-xs transition-all text-left group"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${badge.chipClass}`}
                            >
                              {badge.label}
                            </span>
                            {ev.priority && (
                              <span className="text-[10px] text-gray-400 capitalize">
                                {ev.priority}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-gray-800 group-hover:text-blue-600 line-clamp-2">
                            {ev.title}
                          </h4>
                          {ev.gymName && (
                            <span className="text-[11px] text-gray-500 flex items-center gap-1 mt-1 truncate">
                              <Building2 className="w-3 h-3 text-gray-400 shrink-0" />
                              <span className="truncate">{ev.gymName}</span>
                            </span>
                          )}
                        </Link>
                      )
                    })
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDateForTask(day.dateString)
                    setIsTaskModalOpen(true)
                  }}
                  className="w-full mt-2 py-1 px-2 rounded-xl border border-dashed border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50 text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Añadir tarea
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* VIEW: AGENDA */}
      {viewMode === 'agenda' && (
        <div className="space-y-6">
          {agendaEvents.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200/80 p-12 text-center">
              <CalendarCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <h3 className="text-base font-semibold text-gray-900">
                No hay actividades programadas
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                No hay tareas o seguimientos con fecha prevista en los próximos 30 días.
              </p>
            </div>
          ) : (
            agendaEvents.map((group) => (
              <div key={group.date} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500 capitalize">
                    {group.formatted}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                    {group.events.length}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs divide-y divide-gray-100 overflow-hidden">
                  {group.events.map((ev) => {
                    const badge = getEventBadge(ev)
                    const Icon = badge.icon

                    return (
                      <div
                        key={ev.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-gray-50 text-gray-700 shrink-0 mt-0.5">
                            <Icon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${badge.chipClass}`}
                              >
                                {badge.label}
                              </span>
                              {ev.status && (
                                <span className="text-[10px] text-gray-400 capitalize">
                                  • {ev.status}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-gray-900">
                              {ev.title}
                            </h4>
                            {ev.gymName && (
                              <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-gray-400" />
                                {ev.gymName}
                              </p>
                            )}
                          </div>
                        </div>

                        <Link href={ev.link}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 self-start sm:self-auto"
                          >
                            <span>Ver detalles</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Button>
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Quick Task Creation Modal */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialDueDate={selectedDateForTask}
        onSuccess={() => {
          setIsTaskModalOpen(false)
          router.refresh()
        }}
      />
    </div>
  )
}
