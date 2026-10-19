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
        'flex flex-col w-[280px] min-w-[280px] max-w-[280px] bg-muted/40 rounded-xl border border-border/80 transition-all duration-150 shadow-xs max-h-[calc(100vh-190px)]',
        isOver && 'ring-2 ring-primary/40 border-primary bg-primary/[0.03]'
      )}
    >
      {/* Top Accent Strip */}
      <div
        className="h-1 rounded-t-xl transition-all"
        style={{ backgroundColor: stage.color || '#3b82f6' }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/60 bg-card/60 backdrop-blur-xs rounded-t-none">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0 shadow-xs"
            style={{ backgroundColor: stage.color || '#3b82f6' }}
          />
          <h2
            className="text-xs font-semibold text-foreground uppercase tracking-wider truncate"
            title={stage.name}
          >
            {stage.name}
          </h2>
        </div>
        <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border/60">
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
