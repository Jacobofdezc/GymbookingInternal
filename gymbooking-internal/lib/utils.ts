import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function formatRelativeDate(date: string | Date | null | undefined): string {
  if (!date) return 'Sin fecha'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return 'Fecha inválida'
  
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  if (diffDays === -1) return 'Mañana'
  if (diffDays > 1 && diffDays < 30) return `Hace ${diffDays} d`
  if (diffDays < -1 && diffDays > -30) return `En ${Math.abs(diffDays)} d`

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
  }).format(d)
}

export const formatRelative = formatRelativeDate

export function isOverdue(date: string | Date | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < now
}

export function isDueToday(date: string | Date | null | undefined): boolean {
  if (!date) return false
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return false
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}
