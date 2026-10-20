'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { InteractionForm } from '@/components/interactions/InteractionForm'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { IssueForm } from '@/components/issues/IssueForm'
import { seedDemoDataForOrganization } from '@/services/demo/demo-seed.service'
import {
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  Dumbbell,
  FilePlus2,
  FileText,
  Flame,
  MessageSquare,
  Plus,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  User,
  Activity,
  ArrowRight,
  ExternalLink,
  Loader2,
} from 'lucide-react'

export interface DashboardStats {
  totalGyms: number
  commercialInProcessCount: number
  confirmedGymsCount: number
  activeGymsCount: number
  overdueTasksCount: number
  openIssuesCount: number
  pendingTasksCount: number
  upcomingFollowups: Array<{
    id: string
    name: string
    next_followup_date: string | null
    next_action: string | null
    owner?: { id: string; full_name: string } | null
  }>
  tasksDueToday: Array<{
    id: string
    title: string
    priority: string
    due_date: string | null
    assignee?: { id: string; full_name: string } | null
    gym?: { id: string; name: string } | null
  }>
  recentActivity: Array<{
    id: string
    action: string
    entity_type: string
    created_at: string
    actor?: { id: string; full_name: string } | null
  }>
  latestGyms: Array<{
    id: string
    name: string
    city: string | null
    created_at: string
    commercial_status?: { name: string; color: string } | null
  }>
}

interface DashboardClientProps {
  stats: DashboardStats
}

export function DashboardClient({ stats }: DashboardClientProps) {
  const router = useRouter()
  const [isInteractionModalOpen, setIsInteractionModalOpen] = useState(false)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false)
  const [seedingDemo, setSeedingDemo] = useState(false)

  const handleSeedDemo = async () => {
    try {
      setSeedingDemo(true)
      const res = await seedDemoDataForOrganization()
      alert(
        `¡Entorno de demostración cargado con éxito! Se han creado ${res.gymsCount} gimnasios, ${res.contactsCount} contactos, ${res.tasksCount} tareas y ${res.interactionsCount} interacciones.`
      )
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar datos de prueba')
    } finally {
      setSeedingDemo(false)
    }
  }

  const priorityBadges: Record<
    string,
    { label: string; variant: 'outline' | 'info' | 'warning' | 'danger' }
  > = {
    low: { label: 'Baja', variant: 'outline' },
    medium: { label: 'Media', variant: 'info' },
    high: { label: 'Alta', variant: 'warning' },
    urgent: { label: 'Urgente', variant: 'danger' },
  }

  function formatActivityAction(action: string, entityType: string) {
    const actionTranslations: Record<string, string> = {
      create: 'Creó',
      update: 'Actualizó',
      delete: 'Eliminó',
      status_change: 'Cambió el estado de',
      login: 'Inició sesión',
    }

    const entityTranslations: Record<string, string> = {
      gym: 'el gimnasio',
      interaction: 'una interacción en',
      task: 'la tarea',
      issue: 'la incidencia',
      document: 'el documento',
      class: 'la clase',
    }

    const act = actionTranslations[action] || action
    const ent = entityTranslations[entityType] || entityType
    return `${act} ${ent}`
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Panel de Control
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5">
            Vista general del pipeline de captación, operaciones e incidencias de GymBooking
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => router.push('/gyms/new')}
            className="cursor-pointer rounded-xl font-bold shadow-xs"
          >
            <Building2 className="h-4 w-4 mr-1.5" />
            Añadir gimnasio
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            className="cursor-pointer rounded-xl font-semibold border-slate-200/90 shadow-2xs hover:bg-slate-50"
          >
            <Clock className="h-4 w-4 mr-1.5 text-blue-600" />
            Crear tarea
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsInteractionModalOpen(true)}
            className="cursor-pointer rounded-xl font-semibold border-slate-200/90 shadow-2xs hover:bg-slate-50"
          >
            <MessageSquare className="h-4 w-4 mr-1.5 text-emerald-600" />
            Registrar interacción
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsIssueModalOpen(true)}
            className="cursor-pointer rounded-xl font-semibold border-slate-200/90 shadow-2xs hover:bg-slate-50"
          >
            <ShieldAlert className="h-4 w-4 mr-1.5 text-amber-500" />
            Crear incidencia
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedDemo}
            disabled={seedingDemo}
            className="cursor-pointer gap-1.5 rounded-xl border-dashed border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 font-bold shadow-2xs"
            title="Cargar 6 gimnasios de prueba con contactos, pipeline e incidencias"
          >
            {seedingDemo ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-600" />
            ) : (
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
            )}
            Cargar datos demo
          </Button>
        </div>
      </div>

      {/* Quick-Start Hero Banner (shown when 0 gyms) */}
      {stats.totalGyms === 0 && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-2xl p-6 sm:p-8 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 border border-blue-500/30 animate-in fade-in duration-300">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Primeros Pasos • Modo Rápido
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Tu CRM está configurado y listo para operar
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed">
              Comienza registrando tu primer gimnasio o carga con 1 clic un entorno de demostración con 6 centros reales (FitClub Chamberí, Brooklyn Fitboxing Retiro, McFit Goya...), contactos con tomadores de decisión, tareas, pipeline e incidencias.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <Button
              onClick={handleSeedDemo}
              disabled={seedingDemo}
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-md gap-2 h-10 px-5 cursor-pointer text-sm"
            >
              {seedingDemo ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-500" />
              )}
              {seedingDemo ? 'Cargando datos...' : 'Cargar Datos de Demostración'}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/gyms/new')}
              className="border-white/40 text-white hover:bg-white/10 h-10 px-4 cursor-pointer text-sm"
            >
              Crear primer gimnasio
            </Button>
          </div>
        </div>
      )}

      {/* Top KPI Cards (2 rows of 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Card 1: Total gimnasios */}
        <Card className="hover:border-blue-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border border-slate-200/90 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total gimnasios registrados
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60 shadow-2xs">
              <Building2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {stats.totalGyms}
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <span className="font-semibold text-slate-700">{stats.pendingTasksCount}</span> tareas pendientes globales
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Gimnasios en proceso comercial */}
        <Card className="hover:border-indigo-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border border-slate-200/90 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              En proceso comercial
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200/60 shadow-2xs">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {stats.commercialInProcessCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Contactados, reuniones o propuestas
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Gimnasios confirmados */}
        <Card className="hover:border-amber-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border border-slate-200/90 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Gimnasios confirmados
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 shadow-2xs">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {stats.confirmedGymsCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Acuerdo cerrado, listos para onboarding
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Activos en plataforma */}
        <Card className="hover:border-emerald-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border border-slate-200/90 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Activos en plataforma
            </CardTitle>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 shadow-2xs">
              <Dumbbell className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {stats.activeGymsCount}
            </div>
            <p className="text-xs text-emerald-700 mt-1 font-semibold flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
              Publicados y recibiendo reservas
            </p>
          </CardContent>
        </Card>

        {/* Card 5: Tareas vencidas */}
        <Card
          className={`hover:border-rose-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border rounded-2xl ${
            stats.overdueTasksCount > 0
              ? 'border-rose-300 bg-rose-50/15'
              : 'border-slate-200/90'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tareas vencidas
            </CardTitle>
            <div
              className={`p-2.5 rounded-xl border shadow-2xs ${
                stats.overdueTasksCount > 0
                  ? 'bg-rose-50 text-rose-600 border-rose-200/60'
                  : 'bg-slate-50 text-slate-500 border-slate-200/60'
              }`}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-black tracking-tight ${
                stats.overdueTasksCount > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {stats.overdueTasksCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.overdueTasksCount > 0 ? 'Requieren atención inmediata' : 'Al día, sin retrasos'}
            </p>
          </CardContent>
        </Card>

        {/* Card 6: Incidencias abiertas */}
        <Card
          className={`hover:border-amber-400/80 transition-all duration-200 shadow-2xs hover:shadow-md bg-white border rounded-2xl ${
            stats.openIssuesCount > 0
              ? 'border-amber-300 bg-amber-50/15'
              : 'border-slate-200/90'
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Incidencias abiertas
            </CardTitle>
            <div
              className={`p-2.5 rounded-xl border shadow-2xs ${
                stats.openIssuesCount > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                  : 'bg-slate-50 text-slate-500 border-slate-200/60'
              }`}
            >
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-3xl font-black tracking-tight ${
                stats.openIssuesCount > 0 ? 'text-amber-700' : 'text-slate-900'
              }`}
            >
              {stats.openIssuesCount}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.openIssuesCount > 0 ? 'Pendientes de resolución' : 'Sin problemas activos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Próximos seguimientos */}
          <Card className="shadow-2xs rounded-2xl border-slate-200/80 bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/60 p-4.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Próximos seguimientos
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Gimnasios con fecha de contacto en los próximos 7 días
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl hover:bg-white text-slate-600 hover:text-slate-900">
                <Link href="/interactions">
                  Ver todas
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {stats.upcomingFollowups.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No hay seguimientos programados en los próximos 7 días.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.upcomingFollowups.map((gym) => (
                    <div
                      key={gym.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/80 px-2.5 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="font-bold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 flex items-center gap-1.5"
                        >
                          <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          {gym.name}
                        </Link>
                        {gym.next_action && (
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5 font-medium">
                            Acción: {gym.next_action}
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-slate-800 block">
                          {formatDate(gym.next_followup_date)}
                        </span>
                        {gym.owner && (
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1 justify-end">
                            <User className="h-3 w-3 text-slate-400" />
                            {gym.owner.full_name}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tareas que vencen hoy */}
          <Card className="shadow-2xs rounded-2xl border-slate-200/80 bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/60 p-4.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Tareas que vencen hoy
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Obligaciones con fecha límite para el día de hoy
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl hover:bg-white text-slate-600 hover:text-slate-900">
                <Link href="/tasks">
                  Ver tareas
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {stats.tasksDueToday.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No hay tareas que venzan hoy.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.tasksDueToday.map((task) => (
                    <div
                      key={task.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/80 px-2.5 rounded-xl transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={priorityBadges[task.priority]?.variant || 'outline'}>
                            {priorityBadges[task.priority]?.label || task.priority}
                          </Badge>
                          <span className="font-bold text-slate-800 line-clamp-1">
                            {task.title}
                          </span>
                        </div>
                        {task.gym && (
                          <span className="text-xs text-slate-500 font-medium mt-0.5 block">
                            Gimnasio: {task.gym.name}
                          </span>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-500 font-medium">
                          {task.assignee?.full_name || 'Sin asignar'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Actividad reciente */}
          <Card className="shadow-2xs rounded-2xl border-slate-200/80 bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/60 p-4.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Actividad reciente
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Últimas acciones registradas en el registro de auditoría
                </p>
              </div>
            </CardHeader>
            <CardContent className="p-4.5">
              {stats.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  Aún no se ha registrado actividad reciente en el sistema.
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 border-l-2 border-slate-100 ml-2 py-1">
                  {stats.recentActivity.map((log) => (
                    <div key={log.id} className="relative group">
                      <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-white shadow-2xs" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-900">
                          {log.actor?.full_name || 'Sistema'}
                        </span>{' '}
                        <span className="text-slate-600">
                          {formatActivityAction(log.action, log.entity_type)}
                        </span>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {formatDate(log.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Últimos gimnasios añadidos */}
          <Card className="shadow-2xs rounded-2xl border-slate-200/80 bg-white overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 bg-slate-50/60 p-4.5">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  Últimos gimnasios añadidos
                </CardTitle>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Nuevas altas en la base de datos
                </p>
              </div>
              <Button variant="ghost" size="sm" asChild className="text-xs font-semibold rounded-xl hover:bg-white text-slate-600 hover:text-slate-900">
                <Link href="/gyms">
                  Ver todos
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-4">
              {stats.latestGyms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 font-medium">
                  No hay gimnasios registrados aún.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stats.latestGyms.map((gym) => (
                    <div
                      key={gym.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-sm hover:bg-slate-50/80 px-2.5 rounded-xl transition-colors"
                    >
                      <div>
                        <Link
                          href={`/gyms/${gym.id}`}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1"
                        >
                          {gym.name}
                        </Link>
                        <p className="text-xs text-slate-500 font-medium">
                          {gym.city || 'Ciudad no especificada'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        {gym.commercial_status && (
                          <span
                            className="inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold border border-slate-200/60"
                            style={{
                              backgroundColor: `${gym.commercial_status.color}20`,
                              color: gym.commercial_status.color,
                            }}
                          >
                            {gym.commercial_status.name}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                          {formatDate(gym.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals triggered from Quick Actions */}
      <InteractionForm
        isOpen={isInteractionModalOpen}
        onClose={() => setIsInteractionModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />

      <IssueForm
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
        onSuccess={() => {
          router.refresh()
        }}
      />
    </div>
  )
}
