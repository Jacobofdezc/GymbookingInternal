'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Calendar,
  Phone,
  Mail,
  Globe,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Edit,
  ArrowLeft,
  MessageSquare,
  Video,
  Users,
  FileText,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  User,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { StatusBadge } from './StatusBadge'
import { ContactForm } from './ContactForm'
import { InteractionForm } from './InteractionForm'
import { formatDate, formatDateTime, formatRelative } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { FullGymDetail } from '@/services/gyms/gym.service'
import type { GymContact, Task, GymOnboardingItem, TaskPriority } from '@/types/database'

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

interface GymDetailClientProps {
  initialGym: FullGymDetail
}

type TabType =
  | 'resumen'
  | 'contactos'
  | 'historial'
  | 'tareas'
  | 'documentos'
  | 'condiciones'
  | 'clases'

export function GymDetailClient({ initialGym }: GymDetailClientProps) {
  const router = useRouter()
  const [gym, setGym] = useState<FullGymDetail>(initialGym)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')

  // Modals state
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<GymContact | null>(null)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)

  // Interaction filter state
  const [interactionFilter, setInteractionFilter] = useState<string>('all')

  // Quick task creation form state
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('medium')
  const [savingTask, setSavingTask] = useState(false)

  // Refresh gym data after any mutation
  const refreshGymData = async () => {
    try {
      const supabase = createClient()
      const { data: updatedGym } = await supabase
        .from('gyms')
        .select(`
          *,
          commercial_status:commercial_statuses(*),
          onboarding_status:onboarding_statuses(*),
          owner:profiles!gyms_owner_id_fkey(*),
          onboarding_owner:profiles!gyms_onboarding_owner_id_fkey(*)
        `)
        .eq('id', gym.id)
        .single()

      const [contactsRes, interactionsRes, tasksRes, docsRes, onbRes, classesRes] =
        await Promise.all([
          supabase
            .from('gym_contacts')
            .select('*')
            .eq('gym_id', gym.id)
            .eq('is_active', true)
            .order('is_primary', { ascending: false }),
          supabase
            .from('interactions')
            .select(`
              *,
              registered_by_user:profiles!interactions_registered_by_fkey(id, full_name, avatar_url),
              contact:gym_contacts(*)
            `)
            .eq('gym_id', gym.id)
            .order('interaction_date', { ascending: false }),
          supabase
            .from('tasks')
            .select(`
              *,
              assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
            `)
            .eq('gym_id', gym.id)
            .order('due_date', { ascending: true }),
          supabase.from('documents').select('*').eq('gym_id', gym.id).order('created_at', { ascending: false }),
          supabase
            .from('gym_onboarding_items')
            .select('*')
            .eq('gym_id', gym.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('classes')
            .select('*, discipline:disciplines(*)')
            .eq('gym_id', gym.id),
        ])

      if (updatedGym) {
        setGym((prev) => ({
          ...prev,
          ...updatedGym,
          commercial_status: (updatedGym as any).commercial_status || null,
          onboarding_status: (updatedGym as any).onboarding_status || null,
          owner: (updatedGym as any).owner || null,
          onboarding_owner: (updatedGym as any).onboarding_owner || null,
          gym_contacts: (contactsRes.data || []) as GymContact[],
          interactions: (interactionsRes.data || []) as any,
          tasks: (tasksRes.data || []) as any,
          documents: (docsRes.data || []) as any,
          gym_onboarding_items: (onbRes.data || []) as any,
          classes: (classesRes.data || []) as any,
        }))
      }
    } catch (err) {
      console.error('Error refreshing gym data:', err)
    }
  }

  // Toggle task completed
  const handleToggleTask = async (task: Task) => {
    try {
      const supabase = createClient()
      const isCompleted = task.status === 'completed'
      const newStatus = isCompleted ? 'pending' : 'completed'
      const completedAt = isCompleted ? null : new Date().toISOString()

      await supabase
        .from('tasks')
        .update({
          status: newStatus,
          completed_at: completedAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task.id)

      refreshGymData()
    } catch (err) {
      console.error('Error toggling task:', err)
    }
  }

  // Toggle onboarding item completed
  const handleToggleOnboardingItem = async (item: GymOnboardingItem) => {
    try {
      const supabase = createClient()
      const isCompleted = item.status === 'completed'
      const newStatus = isCompleted ? 'pending' : 'completed'

      await supabase
        .from('gym_onboarding_items')
        .update({
          status: newStatus,
          completed_at: isCompleted ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)

      refreshGymData()
    } catch (err) {
      console.error('Error updating onboarding item:', err)
    }
  }

  // Quick create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    setSavingTask(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Usuario no autenticado')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile) throw new Error('Perfil no encontrado')

      await supabase.from('tasks').insert({
        organization_id: profile.organization_id,
        title: newTaskTitle.trim(),
        due_date: newTaskDueDate || null,
        priority: newTaskPriority,
        status: 'pending',
        gym_id: gym.id,
        assignee_id: user.id,
        created_by: user.id,
      })

      setNewTaskTitle('')
      setNewTaskDueDate('')
      setTaskModalOpen(false)
      refreshGymData()
    } catch (err: any) {
      alert(err.message || 'Error al crear la tarea')
    } finally {
      setSavingTask(false)
    }
  }

  // Delete contact
  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este contacto?')) return
    try {
      const supabase = createClient()
      await supabase.from('gym_contacts').delete().eq('id', contactId)
      refreshGymData()
    } catch (err) {
      console.error('Error deleting contact:', err)
    }
  }

  // Dates & Followup Alert
  const today = new Date().toISOString().split('T')[0]
  const isOverdue = gym.next_followup_date && gym.next_followup_date < today
  const isDueToday = gym.next_followup_date === today

  // Metrics
  const pendingTasks = gym.tasks.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled'
  )
  const completedOnboardingItems = gym.gym_onboarding_items.filter(
    (i) => i.status === 'completed'
  )
  const onboardingPercent =
    gym.gym_onboarding_items.length > 0
      ? Math.round((completedOnboardingItems.length / gym.gym_onboarding_items.length) * 100)
      : 0

  const verifiedClasses = gym.classes.filter(
    (c) => c.publication_status === 'verified' || c.publication_status === 'published'
  )

  // Filtered interactions
  const filteredInteractions = gym.interactions.filter((item) => {
    if (interactionFilter === 'all') return true
    return item.type === interactionFilter
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Back button & quick navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex items-center gap-1.5"
        >
          <Link href="/gyms">
            <ArrowLeft className="h-4 w-4" />
            Volver a la lista
          </Link>
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInteractionModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Phone className="h-4 w-4 text-primary" />
            Registrar interacción
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <CheckSquare className="h-4 w-4 text-emerald-600" />
            Nueva tarea
          </Button>

          <Button asChild size="sm" className="flex items-center gap-1.5">
            <Link href={`/gyms/${gym.id}/edit`}>
              <Edit className="h-4 w-4" />
              Editar centro
            </Link>
          </Button>
        </div>
      </div>

      {/* Followup Alert Banner */}
      {isOverdue && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
          <div className="flex items-center space-x-3 text-red-800 dark:text-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              <span>
                Seguimiento comercial vencido desde el{' '}
                <strong>{formatDate(gym.next_followup_date)}</strong>.
              </span>
              {gym.next_action && (
                <span className="ml-2 font-normal">
                  Acción requerida: <em className="font-semibold">{gym.next_action}</em>
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300"
              onClick={() => setInteractionModalOpen(true)}
            >
              Registrar ahora
            </Button>
          </div>
        </div>
      )}

      {isDueToday && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
          <div className="flex items-center space-x-3 text-amber-800 dark:text-amber-200">
            <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="flex-1 text-sm font-medium">
              <span>Seguimiento comercial programado para hoy.</span>
              {gym.next_action && (
                <span className="ml-2 font-normal">
                  Acción: <em className="font-semibold">{gym.next_action}</em>
                </span>
              )}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="border-amber-300 text-amber-700 hover:bg-amber-100"
              onClick={() => setInteractionModalOpen(true)}
            >
              Completar seguimiento
            </Button>
          </div>
        </div>
      )}

      {/* Gym Header Card */}
      <Card className="shadow-xs overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {gym.name}
                </h1>
                <StatusBadge status={gym.commercial_status} type="commercial" />
                <StatusBadge status={gym.onboarding_status} type="onboarding" />
                <StatusBadge status={gym.priority} type="priority" />
              </div>

              {gym.legal_name && (
                <p className="text-xs text-muted-foreground font-medium">
                  Razón social: {gym.legal_name}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground pt-1">
                {gym.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>
                      {gym.address ? `${gym.address}, ` : ''}
                      {gym.city}
                    </span>
                  </div>
                )}
                {gym.phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`tel:${gym.phone}`} className="hover:underline">
                      {gym.phone}
                    </a>
                  </div>
                )}
                {gym.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`mailto:${gym.email}`} className="hover:underline">
                      {gym.email}
                    </a>
                  </div>
                )}
                {gym.website && (
                  <div className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5 text-slate-400" />
                    <a
                      href={gym.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline flex items-center gap-0.5"
                    >
                      Web <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </div>
                )}
                {gym.instagram && (
                  <div className="flex items-center gap-1">
                    <InstagramIcon className="h-3.5 w-3.5 text-slate-400" />
                    <span>{gym.instagram}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Owner badge info */}
            <div className="flex items-center space-x-3 bg-muted/50 px-4 py-2.5 rounded-lg border">
              <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                {gym.owner ? gym.owner.full_name.slice(0, 2).toUpperCase() : '—'}
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground block">Responsable Comercial</span>
                <span className="font-semibold text-foreground">
                  {gym.owner?.full_name || 'Sin asignar'}
                </span>
              </div>
            </div>
          </div>

          {/* Disciplines pills */}
          {gym.disciplines.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground font-medium mr-1">Disciplinas:</span>
              {gym.disciplines.map((d) => (
                <span
                  key={d.id}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium"
                >
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex border-t overflow-x-auto bg-muted/20">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'contactos', label: `Contactos (${gym.gym_contacts.length})` },
            { id: 'historial', label: `Historial (${gym.interactions.length})` },
            { id: 'tareas', label: `Tareas (${pendingTasks.length})` },
            { id: 'documentos', label: `Documentos (${gym.documents.length})` },
            { id: 'condiciones', label: 'Condiciones' },
            { id: 'clases', label: `Clases e Incorporación (${gym.classes.length})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-primary text-primary font-semibold bg-background'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </Card>

      {/* TAB CONTENT */}

      {/* 1. RESUMEN */}
      {activeTab === 'resumen' && (
        <div className="space-y-6">
          {/* Metric KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 shadow-2xs">
              <span className="text-xs font-medium text-muted-foreground block">
                Total Interacciones
              </span>
              <span className="text-2xl font-bold mt-1 block">
                {gym.interactions.length}
              </span>
              <span className="text-2xs text-muted-foreground mt-0.5 block">
                Última:{' '}
                {gym.last_contact_date ? formatRelative(gym.last_contact_date) : 'Sin registro'}
              </span>
            </Card>

            <Card className="p-4 shadow-2xs">
              <span className="text-xs font-medium text-muted-foreground block">
                Tareas Pendientes
              </span>
              <span className="text-2xl font-bold mt-1 block text-amber-600">
                {pendingTasks.length}
              </span>
              <span className="text-2xs text-muted-foreground mt-0.5 block">
                {gym.tasks.length - pendingTasks.length} completadas
              </span>
            </Card>

            <Card className="p-4 shadow-2xs">
              <span className="text-xs font-medium text-muted-foreground block">
                Clases Verificadas
              </span>
              <span className="text-2xl font-bold mt-1 block text-emerald-600">
                {verifiedClasses.length} / {gym.classes_expected || gym.classes.length}
              </span>
              <span className="text-2xs text-muted-foreground mt-0.5 block">
                {gym.classes.length} clases recibidas
              </span>
            </Card>

            <Card className="p-4 shadow-2xs">
              <span className="text-xs font-medium text-muted-foreground block">
                Progreso Onboarding
              </span>
              <span className="text-2xl font-bold mt-1 block text-indigo-600">
                {onboardingPercent}%
              </span>
              <span className="text-2xs text-muted-foreground mt-0.5 block">
                {completedOnboardingItems.length} de {gym.gym_onboarding_items.length} tareas
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial status summary */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Diagnóstico Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                    Nivel de Interés
                  </span>
                  <p className="mt-0.5 font-medium capitalize">
                    {gym.interest_level ? gym.interest_level.replace('_', ' ') : 'No especificado'}
                  </p>
                </div>

                {gym.interest_reason && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                      Motivo de Interés
                    </span>
                    <p className="mt-0.5 text-muted-foreground">{gym.interest_reason}</p>
                  </div>
                )}

                {gym.next_action && (
                  <div>
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                      Próxima Acción
                    </span>
                    <p className="mt-0.5 font-medium text-foreground">
                      {gym.next_action}{' '}
                      {gym.next_followup_date && (
                        <span className="text-xs text-muted-foreground font-normal">
                          (para el {formatDate(gym.next_followup_date)})
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {gym.gym_objections && (
                  <div className="rounded-md bg-amber-50 p-3 text-xs border border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
                    <span className="font-semibold text-amber-800 dark:text-amber-200 block mb-0.5">
                      Objeciones detectadas:
                    </span>
                    <p className="text-amber-900 dark:text-amber-300">{gym.gym_objections}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commercial notes */}
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Notas Comerciales Internas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                {gym.commercial_notes ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 dark:text-slate-300 bg-muted/40 p-3 rounded-md text-xs font-mono">
                    {gym.commercial_notes}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    Sin notas comerciales registradas.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. CONTACTOS */}
      {activeTab === 'contactos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Contactos del centro</h2>
              <p className="text-xs text-muted-foreground">
                Personas de contacto directo, directores y entrenadores responsables.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => {
                setSelectedContact(null)
                setContactModalOpen(true)
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Añadir Contacto
            </Button>
          </div>

          {gym.gym_contacts.length === 0 ? (
            <Card className="p-8 text-center">
              <User className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium text-sm">No hay contactos registrados</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Añade el director, responsable comercial o de operaciones del gimnasio.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedContact(null)
                  setContactModalOpen(true)
                }}
              >
                Añadir primer contacto
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gym.gym_contacts.map((contact) => (
                <Card key={contact.id} className="p-4 shadow-2xs relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">{contact.full_name}</span>
                        {contact.is_primary && (
                          <Badge variant="default" className="text-2xs py-0 px-1.5">
                            Principal
                          </Badge>
                        )}
                      </div>
                      {contact.job_title && (
                        <p className="text-xs text-muted-foreground">{contact.job_title}</p>
                      )}
                    </div>

                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => {
                          setSelectedContact(contact)
                          setContactModalOpen(true)
                        }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-red-600"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1.5 mt-3 text-xs text-muted-foreground border-t pt-2">
                    {contact.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <a href={`mailto:${contact.email}`} className="hover:underline">
                          {contact.email}
                        </a>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <a href={`tel:${contact.phone}`} className="hover:underline">
                          {contact.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-2xs pt-1">
                      <span>Canal: <strong className="capitalize">{contact.preferred_channel || 'N/A'}</strong></span>
                      <span>Toma decisiones: <strong>{contact.is_decision_maker === 'yes' ? 'Sí' : 'No'}</strong></span>
                    </div>
                    {contact.notes && (
                      <p className="text-2xs text-slate-500 italic pt-1 border-t mt-1">
                        &quot;{contact.notes}&quot;
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. HISTORIAL */}
      {activeTab === 'historial' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Historial de Interacciones</h2>
              <p className="text-xs text-muted-foreground">
                Cronología de llamadas, mensajes, reuniones y compromisos con el centro.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={interactionFilter}
                onChange={(e) => setInteractionFilter(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              >
                <option value="all">Todos los canales</option>
                <option value="call">Llamadas</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">Emails</option>
                <option value="meeting_in_person">Reuniones</option>
                <option value="video_call">Videollamadas</option>
                <option value="internal_note">Notas internas</option>
              </select>

              <Button
                size="sm"
                onClick={() => setInteractionModalOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Registrar interacción
              </Button>
            </div>
          </div>

          {filteredInteractions.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium text-sm">No hay interacciones registradas</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Registra la primera llamada o toma de contacto con este centro.
              </p>
              <Button size="sm" onClick={() => setInteractionModalOpen(true)}>
                Registrar primera interacción
              </Button>
            </Card>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {filteredInteractions.map((item) => {
                return (
                  <div key={item.id} className="relative group">
                    {/* Timeline bullet icon */}
                    <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-background border-2 border-primary flex items-center justify-center text-primary shadow-xs">
                      {item.type === 'call' && <Phone className="h-2.5 w-2.5" />}
                      {item.type === 'email' && <Mail className="h-2.5 w-2.5" />}
                      {item.type === 'whatsapp' && <MessageSquare className="h-2.5 w-2.5" />}
                      {item.type === 'meeting_in_person' && <Users className="h-2.5 w-2.5" />}
                      {item.type === 'video_call' && <Video className="h-2.5 w-2.5" />}
                      {item.type === 'internal_note' && <FileText className="h-2.5 w-2.5" />}
                    </div>

                    <Card className="p-4 shadow-2xs hover:border-border/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground gap-1 border-b pb-2 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-foreground capitalize">
                            {item.type.replace('_', ' ')}
                          </span>
                          {item.contact && (
                            <span>
                              con <strong>{item.contact.full_name}</strong>
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDateTime(item.interaction_date)}</span>
                        </div>

                        <span className="text-2xs">
                          Registrado por:{' '}
                          <strong>{item.registered_by_user?.full_name || 'Usuario'}</strong>
                        </span>
                      </div>

                      <p className="text-sm text-foreground font-normal leading-relaxed">
                        {item.summary}
                      </p>

                      {(item.outcome || item.commitments || item.next_step) && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t text-xs">
                          {item.outcome && (
                            <div className="bg-muted/40 p-2 rounded">
                              <span className="font-semibold text-2xs uppercase text-muted-foreground block">
                                Resultado
                              </span>
                              <p className="mt-0.5">{item.outcome}</p>
                            </div>
                          )}
                          {item.commitments && (
                            <div className="bg-muted/40 p-2 rounded">
                              <span className="font-semibold text-2xs uppercase text-muted-foreground block">
                                Compromisos
                              </span>
                              <p className="mt-0.5">{item.commitments}</p>
                            </div>
                          )}
                          {item.next_step && (
                            <div className="bg-primary/5 border border-primary/20 p-2 rounded">
                              <span className="font-semibold text-2xs uppercase text-primary block">
                                Próximo Paso
                              </span>
                              <p className="mt-0.5 font-medium">
                                {item.next_step}{' '}
                                {item.next_step_date && `(${formatDate(item.next_step_date)})`}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </Card>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. TAREAS */}
      {activeTab === 'tareas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Tareas vinculadas</h2>
              <p className="text-xs text-muted-foreground">
                Gestión de acciones pendientes y seguimiento con el centro.
              </p>
            </div>
            <Button size="sm" onClick={() => setTaskModalOpen(true)} className="flex items-center gap-1.5">
              <Plus className="h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>

          {gym.tasks.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium text-sm">No hay tareas pendientes</h3>
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Crea tareas para llamadas de seguimiento, solicitud de fotos o revisión de tarifas.
              </p>
              <Button size="sm" onClick={() => setTaskModalOpen(true)}>
                Crear primera tarea
              </Button>
            </Card>
          ) : (
            <div className="space-y-2">
              {gym.tasks.map((task) => {
                const isDone = task.status === 'completed'
                const isOverdueTask =
                  !isDone && task.due_date && task.due_date < today

                return (
                  <div
                    key={task.id}
                    className={`flex items-center justify-between p-3.5 rounded-lg border bg-card transition-colors ${
                      isDone ? 'opacity-60 bg-muted/30' : 'hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={isDone}
                        onChange={() => handleToggleTask(task)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                      <div>
                        <span
                          className={`text-sm font-medium ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <StatusBadge status={task.priority} type="priority" size="sm" />

                      {task.due_date && (
                        <div
                          className={`flex items-center gap-1 text-2xs font-medium ${
                            isOverdueTask ? 'text-red-600 font-semibold' : 'text-muted-foreground'
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(task.due_date)}</span>
                        </div>
                      )}

                      {task.assignee && (
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xs" title={task.assignee.full_name}>
                          {task.assignee.full_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. DOCUMENTOS */}
      {activeTab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Documentos y Contratos</h2>
              <p className="text-xs text-muted-foreground">
                Archivos vinculados al gimnasio, acuerdos firmados y material comercial.
              </p>
            </div>
          </div>

          {gym.contract_url && (
            <Card className="p-4 bg-primary/5 border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-primary text-primary-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Contrato Formal Firmado</h4>
                    <p className="text-xs text-muted-foreground">
                      Documento principal del acuerdo comercial
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href={gym.contract_url} target="_blank" rel="noopener noreferrer">
                    Ver Documento <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </a>
                </Button>
              </div>
            </Card>
          )}

          {gym.documents.length === 0 && !gym.contract_url ? (
            <Card className="p-8 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-medium text-sm">No hay documentos cargados</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Puedes registrar el enlace al contrato formal desde la pestaña de Edición del centro.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gym.documents.map((doc) => (
                <Card key={doc.id} className="p-3.5 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2.5">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold block">{doc.name}</span>
                      <span className="text-muted-foreground text-2xs">
                        {doc.category || 'General'} • {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs">
                    Abrir
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. CONDICIONES */}
      {activeTab === 'condiciones' && (
        <Card>
          <CardHeader className="border-b">
            <CardTitle className="text-base">Condiciones Comerciales y Operativas</CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Estado del Acuerdo
                </span>
                <span className="mt-1 inline-flex items-center font-medium capitalize text-sm">
                  {gym.agreement_status ? gym.agreement_status.replace('_', ' ') : 'Ninguno'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Fecha Inicio Acuerdo
                </span>
                <span className="mt-1 block text-sm">
                  {gym.agreement_start_date ? formatDate(gym.agreement_start_date) : '—'}
                </span>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Fecha de Revisión
                </span>
                <span className="mt-1 block text-sm">
                  {gym.agreement_review_date ? formatDate(gym.agreement_review_date) : '—'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Modelo de Negocio Propuesto
                </span>
                <p className="mt-1 text-sm">{gym.business_model_proposed || '—'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Modelo de Negocio Pactado
                </span>
                <p className="mt-1 text-sm font-medium">{gym.business_model_agreed || '—'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Gestión de Reservas
                </span>
                <p className="mt-1 text-sm capitalize">{gym.booking_manager || 'Por definir'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Gestión de Horarios
                </span>
                <p className="mt-1 text-sm capitalize">{gym.schedule_manager || 'Por definir'}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Detalle de Comisiones
                </span>
                <p className="mt-1 text-sm">{gym.commission_details || '—'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Política de Cancelación
                </span>
                <p className="mt-1 text-sm">{gym.cancellation_policy || '—'}</p>
              </div>

              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block">
                  Condiciones Especiales
                </span>
                <p className="mt-1 text-sm">{gym.special_conditions || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 7. CLASES E INCORPORACIÓN */}
      {activeTab === 'clases' && (
        <div className="space-y-6">
          {/* Onboarding checklist */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Checklist de Incorporación</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hitos para completar la activación y publicación del centro.
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-primary">{onboardingPercent}%</span>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden mt-1">
                    <div
                      className="bg-primary h-full transition-all duration-300"
                      style={{ width: `${onboardingPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {gym.gym_onboarding_items.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-2">
                  No hay hitos de incorporación configurados para este centro.
                </p>
              ) : (
                gym.gym_onboarding_items.map((item) => {
                  const isDone = item.status === 'completed'
                  return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2.5 rounded-md hover:bg-muted/50 border transition-colors text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => handleToggleOnboardingItem(item)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <span className={`font-medium ${isDone ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </span>
                      </div>
                      <StatusBadge
                        status={item.status === 'completed' ? 'Completado' : 'Pendiente'}
                        type="commercial"
                        size="sm"
                      />
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>

          {/* Classes list */}
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Clases Registradas ({gym.classes.length})</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Clases ofertadas por el gimnasio para reserva en la plataforma.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {gym.classes.length === 0 ? (
                <p className="text-xs text-muted-foreground italic py-4 text-center">
                  Aún no se han dado de alta clases para este gimnasio.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gym.classes.map((cls) => (
                    <div key={cls.id} className="p-3.5 rounded-lg border bg-card space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold text-sm">{cls.name}</h4>
                          <span className="text-xs text-muted-foreground">
                            {cls.discipline?.name || 'General'} • {cls.duration_minutes || 60} min
                          </span>
                        </div>
                        <Badge
                          variant={
                            cls.publication_status === 'published'
                              ? 'success'
                              : cls.publication_status === 'verified'
                              ? 'info'
                              : 'secondary'
                          }
                          className="text-2xs"
                        >
                          {cls.publication_status}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                        <span>Nivel: <strong className="capitalize">{cls.level || 'Todos'}</strong></span>
                        <span>Precio: <strong>{cls.price ? `${cls.price}€` : 'Incluido'}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Contact Form Modal */}
      <ContactForm
        gymId={gym.id}
        contact={selectedContact}
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
        onSuccess={refreshGymData}
      />

      {/* 2. Interaction Form Modal */}
      <InteractionForm
        gymId={gym.id}
        contacts={gym.gym_contacts}
        open={interactionModalOpen}
        onOpenChange={setInteractionModalOpen}
        onSuccess={refreshGymData}
      />

      {/* 3. Quick Task Modal */}
      <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Tarea para {gym.name}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <Label htmlFor="task_title">Título de la tarea *</Label>
              <Input
                id="task_title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ej. Enviar propuesta comercial revisada"
                required
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="task_due">Fecha límite</Label>
                <Input
                  id="task_due"
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="task_priority">Prioridad</Label>
                <select
                  id="task_priority"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as TaskPriority)}
                  className="mt-1 flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTaskModalOpen(false)}
                disabled={savingTask}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={savingTask || !newTaskTitle.trim()}>
                {savingTask ? 'Guardando...' : 'Crear Tarea'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
