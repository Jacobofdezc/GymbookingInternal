'use client'

import * as React from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KanbanCard } from './KanbanCard'
import type { CommercialStage, GymWithRelations } from '@/services/pipeline/pipeline.service'

interface KanbanColumnProps {
  stage: CommercialStage
  gyms: GymWithRelations[]
}

export function KanbanColumn({ stage, gyms }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    data: {
      stageId: stage.id,
      stageName: stage.name,
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[295px] min-w-[295px] max-w-[295px] bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200/80 dark:border-slate-800 transition-all duration-150 shadow-2xs max-h-[calc(100vh-190px)] overflow-hidden',
        isOver && 'ring-2 ring-blue-500/50 border-blue-400 bg-blue-50/20 dark:bg-blue-950/20'
      )}
    >
      {/* Top Accent Strip */}
      <div
        className="h-1 rounded-t-2xl transition-all"
        style={{ backgroundColor: stage.color || '#3b82f6' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xs">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-2xs"
            style={{ backgroundColor: stage.color || '#3b82f6' }}
          />
          <h2
            className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider truncate"
            title={stage.name}
          >
            {stage.name}
          </h2>
        </div>
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
          {gyms.length}
        </span>
      </div>

      {/* Card List Area */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 min-h-[150px]">
        {gyms.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/60 rounded-lg text-muted-foreground/60 gap-1.5 my-2">
            <Inbox className="h-5 w-5 stroke-1" />
            <p className="text-xs">Sin gimnasios en esta etapa</p>
          </div>
        ) : (
          gyms.map((gym) => (
            <KanbanCard key={gym.id} gym={gym} statusId={stage.id} />
          ))
        )}
      </div>
    </div>
  )
}
