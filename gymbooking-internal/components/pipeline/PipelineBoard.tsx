'use client'

import * as React from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Filter,
  User,
  AlertTriangle,
  RotateCcw,
  Building2,
} from 'lucide-react'
import {
  getGymsByPipelineStage,
  getPipelineStages,
  moveGymToStage,
  type CommercialStage,
  type GymWithRelations,
} from '@/services/pipeline/pipeline.service'
import { KanbanColumn } from './KanbanColumn'
import { KanbanCard } from './KanbanCard'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function PipelineBoard() {
  const queryClient = useQueryClient()
  const [activeGym, setActiveGym] = React.useState<GymWithRelations | null>(null)

  // Filters state
  const [search, setSearch] = React.useState('')
  const [selectedOwner, setSelectedOwner] = React.useState<string>('all')
  const [selectedPriority, setSelectedPriority] = React.useState<string>('all')

  // Setup sensors with activation constraint so clicking links still works
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  // Fetch stages
  const {
    data: stages = [],
    isLoading: isStagesLoading,
    isError: isStagesError,
    error: stagesError,
  } = useQuery({
    queryKey: ['pipeline-stages'],
    queryFn: getPipelineStages,
    staleTime: 5 * 60 * 1000,
  })

  // Fetch gyms grouped by stage
  const {
    data: gymsByStage = {},
    isLoading: isGymsLoading,
    isError: isGymsError,
    error: gymsError,
  } = useQuery({
    queryKey: ['pipeline-gyms'],
    queryFn: getGymsByPipelineStage,
    staleTime: 30 * 1000,
  })

  // Mutation for moving gym with optimistic update
  const moveGymMutation = useMutation({
    mutationFn: ({ gymId, newStatusId }: { gymId: string; newStatusId: string }) =>
      moveGymToStage(gymId, newStatusId),
    onMutate: async ({ gymId, newStatusId }) => {
      await queryClient.cancelQueries({ queryKey: ['pipeline-gyms'] })
      const previousData = queryClient.getQueryData<Record<string, GymWithRelations[]>>([
        'pipeline-gyms',
      ])

      if (previousData) {
        const nextData: Record<string, GymWithRelations[]> = {}
        let gymToMove: GymWithRelations | null = null

        for (const [stageId, list] of Object.entries(previousData)) {
          nextData[stageId] = list.filter((g) => {
            if (g.id === gymId) {
              gymToMove = { ...g, commercial_status_id: newStatusId }
              return false
            }
            return true
          })
        }

        if (gymToMove && nextData[newStatusId]) {
          nextData[newStatusId] = [gymToMove, ...nextData[newStatusId]]
        }

        queryClient.setQueryData(['pipeline-gyms'], nextData)
      }

      return { previousData }
    },
    onError: (err, variables, context) => {
      console.error('Error moving gym:', err)
      if (context?.previousData) {
        queryClient.setQueryData(['pipeline-gyms'], context.previousData)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-gyms'] })
    },
  })

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const gym = event.active.data.current?.gym as GymWithRelations | undefined
    if (gym) {
      setActiveGym(gym)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveGym(null)

    if (!over) return

    const gymId = active.id as string
    const sourceStatusId = active.data.current?.statusId as string | undefined

    // Find destination status: over.id could be stage id directly or card inside stage
    let destinationStatusId: string | null = null
    const stageIds = stages.map((s) => s.id)

    if (stageIds.includes(over.id as string)) {
      destinationStatusId = over.id as string
    } else if (over.data.current?.statusId) {
      destinationStatusId = over.data.current.statusId as string
    } else {
      // Look up which stage contains the target card
      for (const [stageId, list] of Object.entries(gymsByStage)) {
        if (list.some((g) => g.id === over.id)) {
          destinationStatusId = stageId
          break
        }
      }
    }

    if (destinationStatusId && destinationStatusId !== sourceStatusId) {
      moveGymMutation.mutate({ gymId, newStatusId: destinationStatusId })
    }
  }

  // Derive unique owners from gyms for filter dropdown
  const uniqueOwners = React.useMemo(() => {
    const ownersMap = new Map<string, string>()
    for (const list of Object.values(gymsByStage)) {
      for (const gym of list) {
        if (gym.owner_id && gym.owner?.full_name) {
          ownersMap.set(gym.owner_id, gym.owner.full_name)
        }
      }
    }
    return Array.from(ownersMap.entries()).map(([id, name]) => ({ id, name }))
  }, [gymsByStage])

  // Filter gyms by search, owner, and priority
  const filteredGymsByStage = React.useMemo(() => {
    const result: Record<string, GymWithRelations[]> = {}
    const searchLower = search.trim().toLowerCase()

    for (const [stageId, list] of Object.entries(gymsByStage)) {
      result[stageId] = list.filter((gym) => {
        // Search filter
        if (searchLower) {
          const matchName = gym.name.toLowerCase().includes(searchLower)
          const matchCity = gym.city ? gym.city.toLowerCase().includes(searchLower) : false
          if (!matchName && !matchCity) return false
        }
        // Owner filter
        if (selectedOwner !== 'all') {
          if (selectedOwner === 'unassigned') {
            if (gym.owner_id !== null) return false
          } else if (gym.owner_id !== selectedOwner) {
            return false
          }
        }
        // Priority filter
        if (selectedPriority !== 'all') {
          if (gym.priority !== selectedPriority) return false
        }
        return true
      })
    }

    return result
  }, [gymsByStage, search, selectedOwner, selectedPriority])

  // Total count
  const totalGyms = React.useMemo(() => {
    return Object.values(filteredGymsByStage).reduce((acc, curr) => acc + curr.length, 0)
  }, [filteredGymsByStage])

  const hasActiveFilters =
    search !== '' || selectedOwner !== 'all' || selectedPriority !== 'all'

  const resetFilters = () => {
    setSearch('')
    setSelectedOwner('all')
    setSelectedPriority('all')
  }

  if (isStagesLoading || isGymsLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton filters */}
        <div className="flex gap-3">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
        </div>
        {/* Skeleton board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="w-[280px] min-w-[280px] space-y-3 p-3 bg-muted/40 rounded-xl">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-32 w-full rounded-lg" />
              <Skeleton className="h-32 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isStagesError || isGymsError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-8 text-center text-rose-700">
        <AlertTriangle className="mx-auto h-8 w-8 mb-2 text-rose-500" />
        <p className="font-semibold text-base">Error al cargar el pipeline</p>
        <p className="text-sm text-rose-600 mt-1">
          {((stagesError || gymsError) as Error)?.message || 'Ha ocurrido un error inesperado'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ['pipeline-stages'] })
            queryClient.invalidateQueries({ queryKey: ['pipeline-gyms'] })
          }}
          className="mt-4"
        >
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative w-64 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Buscar por gimnasio o ciudad..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          {/* Owner Filter */}
          <div className="flex items-center gap-1.5">
            <User className="h-4 w-4 text-slate-400" />
            <select
              value={selectedOwner}
              onChange={(e) => setSelectedOwner(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Todos los responsables</option>
              <option value="unassigned">Sin responsable</option>
              {uniqueOwners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="all">Todas las prioridades</option>
              <option value="urgent">Urgente</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-9 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Limpiar
            </Button>
          )}
        </div>

        {/* Counter badge */}
        <div className="flex items-center gap-2 text-xs font-bold shrink-0 bg-slate-100/80 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
          <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span>
            {totalGyms} {totalGyms === 1 ? 'gimnasio' : 'gimnasios'} en pipeline
          </span>
        </div>
      </div>

      {/* Kanban Columns with DndContext */}
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex gap-4 overflow-x-auto pb-6 pt-1 select-none scrollbar-thin">
          {stages.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              gyms={filteredGymsByStage[stage.id] || []}
            />
          ))}
        </div>

        {/* Drag Overlay for smooth visual feedback */}
        <DragOverlay>
          {activeGym ? (
            <div className="w-[280px]">
              <KanbanCard gym={activeGym} isOverlay />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
