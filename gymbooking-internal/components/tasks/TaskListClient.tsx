'use client'

import * as React from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  AlertTriangle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListTodo,
} from 'lucide-react'
import {
  getTasks,
  completeTask,
  updateTask,
  type TaskWithRelations,
  type TaskFilters,
} from '@/services/tasks/task.service'
import {
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  TaskDetailModal,
} from './TaskDetailModal'
import { TaskForm } from './TaskForm'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, formatDate, formatRelativeDate, isOverdue } from '@/lib/utils'

export function TaskListClient() {
  const queryClient = useQueryClient()

  // State
  const [viewTab, setViewTab] = React.useState<'mine' | 'all'>('mine')
  const [subFilter, setSubFilter] = React.useState<
    'all' | 'today' | 'this_week' | 'overdue' | 'unassigned' | 'blocked'
  >('all')
  const [statusFilter, setStatusFilter] = React.useState<string>('all')
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all')
  const [search, setSearch] = React.useState<string>('')
  const [page, setPage] = React.useState<number>(1)
  const pageSize = 10

  // Modals state
  const [formOpen, setFormOpen] = React.useState(false)
  const [selectedTask, setSelectedTask] = React.useState<TaskWithRelations | null>(null)
  const [taskToEdit, setTaskToEdit] = React.useState<TaskWithRelations | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  // Fetch tasks query
  const {
    data: tasks = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      'tasks',
      { viewTab, subFilter, statusFilter, priorityFilter, search },
    ],
    queryFn: () => {
      const filters: TaskFilters = {
        mine: viewTab === 'mine',
        search: search.trim() || undefined,
      }

      // Sub-filters
      if (subFilter === 'today') filters.dueToday = true
      if (subFilter === 'this_week') filters.dueThisWeek = true
      if (subFilter === 'overdue') filters.overdue = true
      if (subFilter === 'unassigned') filters.unassigned = true
      if (subFilter === 'blocked') filters.status = 'blocked'

      // Status filter
      if (subFilter !== 'blocked' && statusFilter !== 'all') {
        filters.status = statusFilter
      }

      // Priority filter
      if (priorityFilter !== 'all') {
        filters.priority = priorityFilter
      }

      return getTasks(filters)
    },
    staleTime: 30 * 1000,
  })

  // Quick toggle completion mutation
  const toggleCompleteMutation = useMutation({
    mutationFn: async ({ task }: { task: TaskWithRelations }) => {
      if (task.status === 'completed') {
        return updateTask(task.id, { status: 'pending' })
      } else {
        return completeTask(task.id)
      }
    },
    onMutate: async ({ task }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] })
      const prevTasks = queryClient.getQueryData<TaskWithRelations[]>([
        'tasks',
        { viewTab, subFilter, statusFilter, priorityFilter, search },
      ])

      if (prevTasks) {
        const nextTasks = prevTasks.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: (t.status === 'completed' ? 'pending' : 'completed') as any,
                completed_at: t.status === 'completed' ? null : new Date().toISOString(),
              }
            : t
        )
        queryClient.setQueryData(
          ['tasks', { viewTab, subFilter, statusFilter, priorityFilter, search }],
          nextTasks
        )
      }

      return { prevTasks }
    },
    onError: (err, variables, context) => {
      if (context?.prevTasks) {
        queryClient.setQueryData(
          ['tasks', { viewTab, subFilter, statusFilter, priorityFilter, search }],
          context.prevTasks
        )
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })

  // Pagination calculation
  const totalTasks = tasks.length
  const totalPages = Math.max(1, Math.ceil(totalTasks / pageSize))
  const paginatedTasks = React.useMemo(() => {
    const start = (page - 1) * pageSize
    return tasks.slice(start, start + pageSize)
  }, [tasks, page, pageSize])

  // Reset page when filters change (React-recommended pattern instead of useEffect)
  const filterKey = `${viewTab}-${subFilter}-${statusFilter}-${priorityFilter}-${search}`
  const [prevFilterKey, setPrevFilterKey] = React.useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const hasActiveFilters =
    subFilter !== 'all' ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    search !== ''

  const resetFilters = () => {
    setSubFilter('all')
    setStatusFilter('all')
    setPriorityFilter('all')
    setSearch('')
  }

  const handleRowClick = (task: TaskWithRelations) => {
    setSelectedTask(task)
    setDetailOpen(true)
  }

  const handleCreateNew = () => {
    setTaskToEdit(null)
    setFormOpen(true)
  }

  const handleEditTask = (task: TaskWithRelations) => {
    setTaskToEdit(task)
    setFormOpen(true)
  }

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Tabs: Mis tareas vs Todas las tareas */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <button
            onClick={() => setViewTab('mine')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewTab === 'mine'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200/70 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Mis tareas
          </button>
          <button
            onClick={() => setViewTab('all')}
            className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              viewTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs border border-slate-200/70 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Todas las tareas
          </button>
        </div>

        {/* Create Task Button */}
        <Button onClick={handleCreateNew} size="sm" className="rounded-xl shadow-xs font-bold">
          <Plus className="h-4 w-4 mr-1.5" />
          Crear tarea
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        {/* Sub-filters chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <button
            onClick={() => setSubFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 text-xs',
              subFilter === 'all'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setSubFilter('today')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 text-xs',
              subFilter === 'today'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            Hoy
          </button>
          <button
            onClick={() => setSubFilter('this_week')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 text-xs',
              subFilter === 'this_week'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            Esta semana
          </button>
          <button
            onClick={() => setSubFilter('overdue')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 text-xs',
              subFilter === 'overdue'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200/60 dark:border-rose-800/60'
            )}
          >
            <AlertTriangle className="h-3 w-3" />
            Vencidas
          </button>
          <button
            onClick={() => setSubFilter('unassigned')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 text-xs',
              subFilter === 'unassigned'
                ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            Sin responsable
          </button>
          <button
            onClick={() => setSubFilter('blocked')}
            className={cn(
              'px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer shrink-0 text-xs',
              subFilter === 'blocked'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200/60 dark:border-amber-800/60'
            )}
          >
            Bloqueadas
          </button>
        </div>

        {/* Inputs row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[260px]">
            {/* Search */}
            <div className="relative w-64 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Buscar por título de tarea..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-8 text-xs rounded-xl border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            {/* Status dropdown */}
            {subFilter !== 'blocked' && (
              <div className="flex items-center gap-1">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="h-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Todos los estados</option>
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En curso</option>
                  <option value="blocked">Bloqueada</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            )}

            {/* Priority dropdown */}
            <div className="flex items-center gap-1">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="h-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">Todas las prioridades</option>
                <option value="urgent">Urgente</option>
                <option value="high">Alta</option>
                <option value="medium">Media</option>
                <option value="low">Baja</option>
              </select>
            </div>

            {/* Reset */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-8 text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold cursor-pointer"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>

          {/* Counter */}
          <div className="text-xs text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 px-2.5 py-1 rounded-xl">
            {totalTasks} {totalTasks === 1 ? 'tarea encontrada' : 'tareas encontradas'}
          </div>
        </div>
      </div>

      {/* Task List Table / Rows */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-border/40 last:border-0">
                <Skeleton className="h-4 w-4 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-5 w-20 rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-rose-600 bg-rose-50/50">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold text-sm">Error al cargar tareas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {(error as Error)?.message || 'Ha ocurrido un error inesperado'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['tasks'] })}
              className="mt-3"
            >
              Reintentar
            </Button>
          </div>
        ) : paginatedTasks.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/40 stroke-1" />
            <div className="space-y-1">
              <p className="font-medium text-sm text-foreground">
                No hay tareas que coincidan
              </p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {hasActiveFilters
                  ? 'Prueba a cambiar o limpiar los filtros seleccionados para ver más resultados.'
                  : 'No tienes tareas pendientes. ¡Buen trabajo! O crea una nueva tarea para comenzar.'}
              </p>
            </div>
            <Button onClick={handleCreateNew} size="sm" variant="outline" className="text-xs mt-2">
              <Plus className="h-3.5 w-3.5 mr-1" />
              Crear nueva tarea
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {paginatedTasks.map((task) => {
              const overdue = isOverdue(task.due_date) && task.status !== 'completed'
              const isCompleted = task.status === 'completed'
              const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
              const statusInfo = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending

              return (
                <div
                  key={task.id}
                  onClick={() => handleRowClick(task)}
                  className={cn(
                    'group flex items-center justify-between gap-3 p-3.5 hover:bg-muted/40 transition-colors cursor-pointer',
                    isCompleted && 'opacity-60 bg-muted/20'
                  )}
                >
                  {/* Left: Checkbox + Priority + Title */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center"
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() =>
                          toggleCompleteMutation.mutate({ task })
                        }
                        aria-label={`Completar tarea ${task.title}`}
                      />
                    </div>

                    {/* Priority Badge */}
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] font-bold uppercase rounded border shrink-0',
                        priorityInfo.className
                      )}
                    >
                      {priorityInfo.label}
                    </span>

                    {/* Title & Gym Link */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className={cn(
                          'text-sm font-medium text-foreground truncate',
                          isCompleted && 'line-through text-muted-foreground'
                        )}
                        title={task.title}
                      >
                        {task.title}
                      </span>

                      {task.gym && (
                        <span
                          onClick={(e) => e.stopPropagation()}
                          className="hidden md:inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors shrink-0 bg-muted/60 px-2 py-0.5 rounded border border-muted"
                        >
                          <Building2 className="h-3 w-3" />
                          <Link href={`/gyms/${task.gym.id}`} className="truncate max-w-[120px]">
                            {task.gym.name}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Assignee, Due Date, Status */}
                  <div className="flex items-center gap-4 shrink-0">
                    {/* Assignee Avatar + Name */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground min-w-[120px] max-w-[160px]">
                      <Avatar className="h-5 w-5">
                        {task.assignee?.avatar_url && (
                          <AvatarImage src={task.assignee.avatar_url} />
                        )}
                        <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                          {task.assignee?.full_name ? task.assignee.full_name[0] : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-xs">
                        {task.assignee?.full_name || 'Sin asignar'}
                      </span>
                    </div>

                    {/* Due Date */}
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs shrink-0 min-w-[85px] justify-end',
                        overdue
                          ? 'text-rose-600 dark:text-rose-300 font-semibold bg-rose-50 dark:bg-rose-950/50 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800'
                          : 'text-muted-foreground'
                      )}
                      title={`Fecha límite: ${task.due_date || 'Sin fecha'}`}
                    >
                      <Calendar className="h-3 w-3" />
                      <span>{task.due_date ? formatRelativeDate(task.due_date) : 'Sin fecha'}</span>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={cn(
                        'px-2 py-0.5 text-[11px] font-medium rounded-full border shrink-0',
                        statusInfo.className
                      )}
                    >
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-border/60 bg-muted/20 text-xs text-muted-foreground">
            <div>
              Mostrando {Math.min(totalTasks, (page - 1) * pageSize + 1)} -{' '}
              {Math.min(totalTasks, page * pageSize)} de {totalTasks} tareas
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="h-7 w-7 p-0"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="px-2 font-medium text-foreground">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="h-7 w-7 p-0"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Task Creation & Editing Modal */}
      <TaskForm
        open={formOpen}
        onOpenChange={setFormOpen}
        taskToEdit={taskToEdit}
      />

      {/* Task Detail View Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEditTask={handleEditTask}
      />
    </div>
  )
}
