'use client'

import * as React from 'react'
import Link from 'next/link'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  MapPin,
  Calendar,
  Clock,
  ArrowRight,
  User as UserIcon,
  AlertCircle,
  GripVertical,
} from 'lucide-react'
import { cn, formatRelativeDate, isOverdue } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import type { GymWithRelations } from '@/services/pipeline/pipeline.service'

interface KanbanCardProps {
  gym: GymWithRelations
  statusId?: string
  isOverlay?: boolean
}

export const PRIORITY_CONFIG = {
  low: { label: 'Baja', variant: 'outline' as const, className: 'bg-slate-50 text-slate-600 border-slate-200' },
  medium: { label: 'Media', variant: 'outline' as const, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'Alta', variant: 'outline' as const, className: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgente', variant: 'destructive' as const, className: 'bg-rose-50 text-rose-700 border-rose-200 font-semibold' },
}

export function KanbanCard({ gym, statusId, isOverlay = false }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: gym.id,
    data: {
      gym,
      statusId: statusId || gym.commercial_status_id,
    },
    disabled: isOverlay,
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined

  const priorityInfo =
    gym.priority && gym.priority in PRIORITY_CONFIG
      ? PRIORITY_CONFIG[gym.priority as keyof typeof PRIORITY_CONFIG]
      : null
  const followupOverdue = isOverdue(gym.next_followup_date)

  const ownerInitials = gym.owner?.full_name
    ? gym.owner.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-150',
        'hover:border-blue-500/50 hover:shadow-md hover:-translate-y-0.5',
        isDragging && 'opacity-30 ring-2 ring-blue-500 ring-offset-1 shadow-lg',
        isOverlay && 'rotate-1 scale-105 shadow-2xl border-blue-500 cursor-grabbing bg-white ring-2 ring-blue-500/20'
      )}
    >
      {/* Top row: Gym name, drag handle & priority */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground/40 hover:text-foreground touch-none p-0.5 -ml-1 rounded transition-colors"
            title="Arrastrar gimnasio"
            aria-label="Arrastrar"
            tabIndex={-1}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Link
            href={`/gyms/${gym.id}`}
            onClick={(e) => isDragging && e.preventDefault()}
            className="font-semibold text-sm text-foreground hover:text-primary transition-colors truncate block flex-1"
            title={gym.name}
          >
            {gym.name}
          </Link>
        </div>

        {priorityInfo && (
          <span
            className={cn(
              'px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded border shrink-0',
              priorityInfo.className
            )}
          >
            {priorityInfo.label}
          </span>
        )}
      </div>

      {/* City */}
      {gym.city && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0 text-muted-foreground/70" />
          <span className="truncate">{gym.city}</span>
        </div>
      )}

      {/* Next action truncated */}
      {gym.next_action && (
        <div className="rounded-lg bg-slate-50 p-2 text-xs text-slate-800 flex items-start gap-1.5 border border-slate-200/60">
          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-blue-600 mt-0.5" />
          <span className="line-clamp-2 leading-relaxed" title={gym.next_action}>
            {gym.next_action}
          </span>
        </div>
      )}

      {/* Dates row: Last contact & Next followup */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        <div
          className="flex items-center gap-1 text-muted-foreground"
          title={`Último contacto: ${gym.last_contact_date || 'Sin registrar'}`}
        >
          <Clock className="h-3 w-3" />
          <span>{gym.last_contact_date ? formatRelativeDate(gym.last_contact_date) : 'Sin contacto'}</span>
        </div>

        {gym.next_followup_date && (
          <div
            className={cn(
              'flex items-center gap-1 font-medium',
              followupOverdue
                ? 'text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200'
                : 'text-muted-foreground'
            )}
            title={`Próximo seguimiento: ${gym.next_followup_date}${followupOverdue ? ' (¡Vencido!)' : ''}`}
          >
            {followupOverdue ? (
              <AlertCircle className="h-3 w-3 text-rose-600" />
            ) : (
              <Calendar className="h-3 w-3" />
            )}
            <span>{formatRelativeDate(gym.next_followup_date)}</span>
          </div>
        )}
      </div>

      {/* Footer row: Owner */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Avatar className="h-5 w-5 border border-background shadow-xs">
            {gym.owner?.avatar_url && (
              <AvatarImage src={gym.owner.avatar_url} alt={gym.owner.full_name} />
            )}
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-semibold">
              {ownerInitials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] truncate max-w-[150px]">
            {gym.owner?.full_name || 'Sin responsable'}
          </span>
        </div>
      </div>
    </div>
  )
}
