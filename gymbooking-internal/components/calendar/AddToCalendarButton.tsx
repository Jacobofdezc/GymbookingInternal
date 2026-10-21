'use client'

import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  ExternalLink,
  Download,
  CalendarPlus,
} from 'lucide-react'
import {
  generateGoogleCalendarUrl,
  generateOutlookCalendarUrl,
  generateIcsContent,
  type CalendarEventPayload,
} from '@/lib/calendar/calendar-links'

interface AddToCalendarButtonProps {
  event: CalendarEventPayload
  variant?: 'outline' | 'default' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  label?: string
}

export function AddToCalendarButton({
  event,
  variant = 'outline',
  size = 'sm',
  className = '',
  label = 'Sincronizar calendario',
}: AddToCalendarButtonProps) {
  const handleGoogleCalendar = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = generateGoogleCalendarUrl(event)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleOutlookCalendar = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = generateOutlookCalendarUrl(event)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation()
    const icsContent = generateIcsContent(event)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={`gap-1.5 rounded-xl font-semibold shadow-2xs cursor-pointer ${className}`}
          title="Añadir a Google Calendar, Outlook o Apple Calendar"
        >
          <CalendarPlus className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-lg border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <DropdownMenuItem
          onClick={handleGoogleCalendar}
          className="flex items-center gap-2.5 cursor-pointer py-2 text-xs font-medium"
        >
          <div className="w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center text-[10px] font-bold">
            G
          </div>
          <span>Google Calendar</span>
          <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleOutlookCalendar}
          className="flex items-center gap-2.5 cursor-pointer py-2 text-xs font-medium"
        >
          <div className="w-4 h-4 rounded-full bg-sky-100 dark:bg-sky-900/50 text-sky-600 flex items-center justify-center text-[10px] font-bold">
            O
          </div>
          <span>Outlook / Office 365</span>
          <ExternalLink className="h-3 w-3 ml-auto text-slate-400" />
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleDownloadIcs}
          className="flex items-center gap-2.5 cursor-pointer py-2 text-xs font-medium"
        >
          <Download className="h-3.5 w-3.5 text-slate-500" />
          <span>Archivo iCal (.ics)</span>
          <span className="text-[10px] text-slate-400 ml-auto">Apple / Otros</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
