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
          'inline-flex items-center rounded-md border border-slate-200 bg-slate-50 text-slate-400 font-medium',
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
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-200',
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

  return (
    <span
      title={titleText}
      style={{
        backgroundColor: `${colorHex}18`, // 10% opacity in hex
        color: colorHex,
        borderColor: `${colorHex}40`, // 25% opacity
      }}
      className={cn(
        'inline-flex items-center font-medium rounded-md border shadow-2xs transition-colors',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
        className
      )}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: colorHex }}
      />
      {statusName}
    </span>
  )
}
