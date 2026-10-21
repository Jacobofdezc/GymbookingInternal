import React from 'react'
import { cn } from '@/lib/utils'
import type { GymPriority } from '@/types/database'

export interface StatusBadgeProps {
  status:
    | {
        name: string
        color?: string | null
        description?: string | null
      }
    | string
    | null
    | undefined
  type?: 'commercial' | 'onboarding' | 'priority'
  size?: 'sm' | 'md'
  className?: string
}

const PRIORITY_CONFIG: Record<
  GymPriority,
  { label: string; bg: string; text: string; border: string }
> = {
  low: {
    label: 'Baja',
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-600 dark:text-slate-300',
    border: 'border-slate-200 dark:border-slate-700',
  },
  medium: {
    label: 'Media',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
  },
  high: {
    label: 'Alta',
    bg: 'bg-amber-50 dark:bg-amber-950/40',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-200 dark:border-amber-800',
  },
  urgent: {
    label: 'Urgente',
    bg: 'bg-red-50 dark:bg-red-950/40',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-200 dark:border-red-800',
  },
}

function getAccessibleColors(colorHex: string) {
  if (!colorHex || !colorHex.startsWith('#') || colorHex.length < 7) {
    return {
      lightBg: 'rgba(107, 114, 128, 0.12)',
      lightText: '#374151',
      lightBorder: 'rgba(107, 114, 128, 0.28)',
      darkBg: 'rgba(107, 114, 128, 0.25)',
      darkText: '#e2e8f0',
      darkBorder: 'rgba(148, 163, 184, 0.4)',
    }
  }

  const r = parseInt(colorHex.slice(1, 3), 16) || 0
  const g = parseInt(colorHex.slice(3, 5), 16) || 0
  const b = parseInt(colorHex.slice(5, 7), 16) || 0
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // In light mode, if luminance is high (yellow/lime/amber), darken text for high contrast (WCAG AA)
  let lightText = colorHex
  if (luminance > 0.48) {
    const dr = Math.floor(r * 0.55)
    const dg = Math.floor(g * 0.55)
    const db = Math.floor(b * 0.55)
    lightText = `rgb(${dr}, ${dg}, ${db})`
  }

  // In dark mode, if luminance is low (dark blue/purple/red/gray), brighten text for legibility
  let darkText = colorHex
  if (luminance < 0.65) {
    const lr = Math.min(255, Math.floor(r + (255 - r) * 0.65))
    const lg = Math.min(255, Math.floor(g + (255 - g) * 0.65))
    const lb = Math.min(255, Math.floor(b + (255 - b) * 0.65))
    darkText = `rgb(${lr}, ${lg}, ${lb})`
  }

  return {
    lightBg: `rgba(${r}, ${g}, ${b}, 0.12)`,
    lightText,
    lightBorder: `rgba(${r}, ${g}, ${b}, 0.28)`,
    darkBg: `rgba(${r}, ${g}, ${b}, 0.25)`,
    darkText,
    darkBorder: `rgba(${r}, ${g}, ${b}, 0.45)`,
  }
}

export function StatusBadge({
  status,
  type = 'commercial',
  size = 'md',
  className,
}: StatusBadgeProps) {
  if (!status) {
    return (
      <span
        className={cn(
          'inline-flex items-center rounded-md border border-slate-200 bg-slate-50 text-slate-500 font-medium dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-400',
          size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
          className
        )}
      >
        Sin asignar
      </span>
    )
  }

  // Handle priority type
  if (type === 'priority') {
    const priorityKey = (
      typeof status === 'string' ? status.toLowerCase() : status.name.toLowerCase()
    ) as GymPriority

    const config = PRIORITY_CONFIG[priorityKey] || {
      label: typeof status === 'string' ? status : status.name,
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-200 dark:border-slate-700',
    }

    return (
      <span
        title={`Prioridad: ${config.label}`}
        className={cn(
          'inline-flex items-center font-medium rounded-md border transition-colors',
          config.bg,
          config.text,
          config.border,
          size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
          className
        )}
      >
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-80" />
        {config.label}
      </span>
    )
  }

  // Handle commercial and onboarding statuses
  const statusName = typeof status === 'string' ? status : status.name
  const colorHex = typeof status === 'object' && status.color ? status.color : '#6B7280'
  const titleText =
    typeof status === 'object' && status.description ? status.description : statusName
  const colors = getAccessibleColors(colorHex)

  return (
    <span
      title={titleText}
      style={{
        backgroundColor: colors.lightBg,
        color: colors.lightText,
        borderColor: colors.lightBorder,
        ['--dark-badge-bg' as any]: colors.darkBg,
        ['--dark-badge-text' as any]: colors.darkText,
        ['--dark-badge-border' as any]: colors.darkBorder,
      }}
      className={cn(
        'inline-flex items-center font-semibold rounded-md border shadow-2xs transition-colors dark:bg-[var(--dark-badge-bg)] dark:text-[var(--dark-badge-text)] dark:border-[var(--dark-badge-border)]',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: colorHex }}
      />
      {statusName}
    </span>
  )
}
