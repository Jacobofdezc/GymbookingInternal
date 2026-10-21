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
  ChevronDown,
  UploadCloud,
  Smartphone,
  Loader2,
  Link2,
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
import { IssueForm } from '@/components/issues/IssueForm'
import { DocumentUploadModal } from '@/components/documents/DocumentUploadModal'
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal'
import { ClassFormModal } from '@/components/operations/ClassFormModal'
import { GymExecutiveReportModal } from './GymExecutiveReportModal'
import { AppPreviewModal } from './AppPreviewModal'
import { GymPortalShareModal } from './GymPortalShareModal'
import {
  togglePublishClass,
  publishAllGymClasses,
  deleteClass,
} from '@/services/operations/onboarding.service'
import { AddToCalendarButton } from '@/components/calendar/AddToCalendarButton'
import { formatDate, formatDateTime, formatRelative } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { FullGymDetail } from '@/services/gyms/gym.service'
import type {
  GymContact,
  Task,
  GymOnboardingItem,
  TaskPriority,
  CommercialStatus,
  OnboardingStatus,
} from '@/types/database'

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
  commercialStatuses?: CommercialStatus[]
  onboardingStatuses?: OnboardingStatus[]
}

type TabType =
  | 'resumen'
  | 'contactos'
  | 'historial'
  | 'tareas'
  | 'documentos'
  | 'condiciones'
  | 'clases'
  | 'incidencias'

export function GymDetailClient({
  initialGym,
  commercialStatuses = [],
  onboardingStatuses = [],
}: GymDetailClientProps) {
  const router = useRouter()
  const [gym, setGym] = useState<FullGymDetail>(initialGym)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')

  // Modals state
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [selectedContact, setSelectedContact] = useState<GymContact | null>(null)
  const [interactionModalOpen, setInteractionModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [issueModalOpen, setIssueModalOpen] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<any>(null)
  const [classModalOpen, setClassModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<any | null>(null)
  const [isAppPreviewOpen, setIsAppPreviewOpen] = useState(false)
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false)
  const [publishingAllClasses, setPublishingAllClasses] = useState(false)
  const [togglingClassId, setTogglingClassId] = useState<string | null>(null)
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false)

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

      const [contactsRes, interactionsRes, tasksRes, docsRes, onbRes, classesRes, issuesRes] =
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
            .select('*, discipline:disciplines(*), class_schedules(*)')
            .eq('gym_id', gym.id)
            .order('name', { ascending: true }),
          supabase
            .from('issues')
            .select(`
              *,
              assignee:profiles!issues_assignee_id_fkey(id, full_name, avatar_url)
            `)
            .eq('gym_id', gym.id)
            .order('created_at', { ascending: false }),
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
          issues: (issuesRes.data || []) as any,
        }))
      }
    } catch (err) {
      console.error('Error refreshing gym data:', err)
    }
  }

  // Instant commercial status update
  const handleUpdateCommercialStatus = async (statusId: string) => {
    try {
      const selected = commercialStatuses.find((s) => s.id === statusId)
      if (!selected) return

      const supabase = createClient()
      const oldStatus = gym.commercial_status?.name

      setGym((prev) => ({
        ...prev,
        commercial_status_id: statusId,
        commercial_status: selected,
      }))

      const { error } = await supabase
        .from('gyms')
        .update({ commercial_status_id: statusId })
        .eq('id', gym.id)

      if (error) throw error

      await supabase.from('audit_logs').insert({
        organization_id: gym.organization_id,
        entity_type: 'gyms',
        entity_id: gym.id,
        action: 'status_change',
        old_values: { commercial_status: oldStatus },
        new_values: { commercial_status: selected.name },
      })
    } catch (err) {
      console.error('Error updating commercial status:', err)
      refreshGymData()
    }
  }

  // Instant onboarding status update
  const handleUpdateOnboardingStatus = async (statusId: string) => {
    try {
      const selected = onboardingStatuses.find((s) => s.id === statusId)
      if (!selected) return

      const supabase = createClient()
      const oldStatus = gym.onboarding_status?.name

      setGym((prev) => ({
        ...prev,
        onboarding_status_id: statusId,
        onboarding_status: selected,
      }))

      const { error } = await supabase
        .from('gyms')
        .update({ onboarding_status_id: statusId })
        .eq('id', gym.id)

      if (error) throw error

      await supabase.from('audit_logs').insert({
        organization_id: gym.organization_id,
        entity_type: 'gyms',
        entity_id: gym.id,
        action: 'status_change',
        old_values: { onboarding_status: oldStatus },
        new_values: { onboarding_status: selected.name },
      })
    } catch (err) {
      console.error('Error updating onboarding status:', err)
      refreshGymData()
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

  // Class publication handlers
  const handleTogglePublish = async (classId: string, currentStatus: string) => {
    try {
      setTogglingClassId(classId)
      const shouldPublish = currentStatus !== 'published'
      await togglePublishClass(classId, shouldPublish)
      await refreshGymData()
    } catch (err: any) {
      alert(err.message || 'Error al cambiar publicación')
    } finally {
      setTogglingClassId(null)
    }
  }

  const handlePublishAllClasses = async () => {
    if (!confirm('¿Deseas publicar todas las clases de este gimnasio en la app móvil?')) return
    try {
      setPublishingAllClasses(true)
      await publishAllGymClasses(gym.id)
      await refreshGymData()
    } catch (err: any) {
      alert(err.message || 'Error al publicar todas las clases')
    } finally {
      setPublishingAllClasses(false)
    }
  }

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`¿Eliminar la clase "${className}"?`)) return
    try {
      await deleteClass(classId)
      await refreshGymData()
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la clase')
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex items-center gap-1.5 rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50 font-semibold"
        >
          <Link href="/gyms">
            <ArrowLeft className="h-4 w-4" />
            Volver a la lista
          </Link>
        </Button>

        <div className="flex items-center space-x-2 flex-wrap sm:flex-nowrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInteractionModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50 font-semibold"
          >
            <Phone className="h-3.5 w-3.5 text-blue-600" />
            Registrar interacción
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setTaskModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50 font-semibold"
          >
            <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
            Nueva tarea
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50 font-semibold"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            Reportar incidencia
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPortalModalOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 shadow-2xs font-bold cursor-pointer"
            title="Compartir portal de onboarding con el dueño del gimnasio"
          >
            <Link2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            Portal del Gimnasio
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExecutiveReportOpen(true)}
            className="flex items-center gap-1.5 rounded-xl border-slate-200/90 shadow-2xs hover:bg-slate-50 font-semibold cursor-pointer"
            title="Exportar o imprimir ficha ejecutiva oficial del centro"
          >
            <FileText className="h-3.5 w-3.5 text-blue-600" />
            Ficha Ejecutiva (PDF)
          </Button>

          <Button asChild size="sm" className="flex items-center gap-1.5 rounded-xl shadow-xs font-semibold">
            <Link href={`/gyms/${gym.id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
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
            <div className="flex items-center gap-2 shrink-0">
              <AddToCalendarButton
                event={{
                  title: `Seguimiento: ${gym.name}`,
                  description: gym.next_action || 'Seguimiento comercial GymBooking',
                  location: `${gym.name}, ${gym.city || 'Madrid'}`,
                  startDate: gym.next_followup_date || new Date().toISOString().split('T')[0],
                }}
                label="Agendar"
                size="sm"
                className="bg-white dark:bg-slate-900 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-50 text-xs"
              />
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
            <div className="flex items-center gap-2 shrink-0">
              <AddToCalendarButton
                event={{
                  title: `Seguimiento hoy: ${gym.name}`,
                  description: gym.next_action || 'Seguimiento comercial GymBooking',
                  location: `${gym.name}, ${gym.city || 'Madrid'}`,
                  startDate: gym.next_followup_date || new Date().toISOString().split('T')[0],
                }}
                label="Agendar"
                size="sm"
                className="bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 text-xs"
              />
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
        </div>
      )}

      {/* Gym Header Card */}
      <Card className="shadow-2xs overflow-hidden rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                  {gym.name}
                </h1>
                {commercialStatuses.length > 0 ? (
                  <div className="relative inline-flex items-center group">
                    <select
                      value={gym.commercial_status?.id || ''}
                      onChange={(e) => handleUpdateCommercialStatus(e.target.value)}
                      className="cursor-pointer pl-3 pr-7 py-1 text-xs font-bold rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs transition-colors appearance-none"
                      style={{
                        borderColor: gym.commercial_status?.color || undefined,
                      }}
                      title="Cambiar estado comercial en 1 clic"
                    >
                      {commercialStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          Comercial: {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
                  </div>
                ) : (
                  <StatusBadge status={gym.commercial_status} type="commercial" />
                )}

                {onboardingStatuses.length > 0 ? (
                  <div className="relative inline-flex items-center group">
                    <select
                      value={gym.onboarding_status?.id || ''}
                      onChange={(e) => handleUpdateOnboardingStatus(e.target.value)}
                      className="cursor-pointer pl-3 pr-7 py-1 text-xs font-bold rounded-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs transition-colors appearance-none"
                      style={{
                        borderColor: gym.onboarding_status?.color || undefined,
                      }}
                      title="Cambiar estado de onboarding en 1 clic"
                    >
                      {onboardingStatuses.map((s) => (
                        <option key={s.id} value={s.id}>
                          Onboarding: {s.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
                  </div>
                ) : (
                  <StatusBadge status={gym.onboarding_status} type="onboarding" />
                )}

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
            <div className="flex items-center space-x-3 bg-slate-50/80 px-4 py-2.5 rounded-xl border border-slate-200/70 shadow-2xs">
              <div className="h-9 w-9 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 flex items-center justify-center font-bold text-xs">
                {gym.owner ? gym.owner.full_name.slice(0, 2).toUpperCase() : '—'}
              </div>
              <div className="text-xs">
                <span className="text-slate-400 block font-medium">Responsable Comercial</span>
                <span className="font-bold text-slate-800">
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
        <div className="flex border-t border-slate-100 dark:border-slate-800 overflow-x-auto bg-slate-50/70 dark:bg-slate-900/80 p-1.5 gap-1 shadow-inner">
          {[
            { id: 'resumen', label: 'Resumen' },
            { id: 'contactos', label: `Contactos (${gym.gym_contacts.length})` },
            { id: 'historial', label: `Historial (${gym.interactions.length})` },
            { id: 'tareas', label: `Tareas (${pendingTasks.length})` },
            { id: 'documentos', label: `Documentos (${gym.documents.length})` },
            { id: 'condiciones', label: 'Condiciones' },
            { id: 'clases', label: `Clases e Incorporación (${gym.classes.length})` },
            { id: 'incidencias', label: `Incidencias (${gym.issues?.length || 0})` },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
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
            <Card className="p-4.5 shadow-2xs rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Total Interacciones
              </span>
              <span className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 block tracking-tight">
                {gym.interactions.length}
              </span>
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                Última:{' '}
                {gym.last_contact_date ? formatRelative(gym.last_contact_date) : 'Sin registro'}
              </span>
            </Card>

            <Card className="p-4.5 shadow-2xs rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Tareas Pendientes
              </span>
              <span className="text-3xl font-black mt-1 block tracking-tight text-amber-600 dark:text-amber-400">
                {pendingTasks.length}
              </span>
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                {gym.tasks.length - pendingTasks.length} completadas
              </span>
            </Card>

            <Card className="p-4.5 shadow-2xs rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Clases Verificadas
              </span>
              <span className="text-3xl font-black mt-1 block tracking-tight text-emerald-600 dark:text-emerald-400">
                {verifiedClasses.length} / {gym.classes_expected || gym.classes.length}
              </span>
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                {gym.classes.length} clases recibidas
              </span>
            </Card>

            <Card className="p-4.5 shadow-2xs rounded-2xl border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Progreso Onboarding
              </span>
              <span className="text-3xl font-black mt-1 block tracking-tight text-blue-600 dark:text-blue-400">
                {onboardingPercent}%
              </span>
              <span className="text-2xs text-slate-400 dark:text-slate-500 mt-1 block font-medium">
                {completedOnboardingItems.length} de {gym.gym_onboarding_items.length} tareas
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Commercial status summary */}
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  Diagnóstico Comercial
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Nivel de Interés
                  </span>
                  <p className="mt-0.5 font-bold text-slate-800 capitalize">
                    {gym.interest_level ? gym.interest_level.replace('_', ' ') : 'No especificado'}
                  </p>
                </div>

                {gym.interest_reason && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Motivo de Interés
                    </span>
                    <p className="mt-0.5 text-slate-600 text-xs leading-relaxed">{gym.interest_reason}</p>
                  </div>
                )}

                {gym.next_action && (
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Próxima Acción
                    </span>
                    <div className="flex items-center justify-between flex-wrap gap-2 mt-1">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
                        {gym.next_action}{' '}
                        {gym.next_followup_date && (
                          <span className="text-xs text-slate-400 font-medium">
                            (para el {formatDate(gym.next_followup_date)})
                          </span>
                        )}
                      </p>
                      {gym.next_followup_date && (
                        <AddToCalendarButton
                          event={{
                            title: `Seguimiento: ${gym.name}`,
                            description: gym.next_action || 'Seguimiento comercial GymBooking',
                            location: `${gym.name}, ${gym.city || 'Madrid'}`,
                            startDate: gym.next_followup_date,
                          }}
                          label="Añadir a Calendario"
                          size="sm"
                          className="h-7 text-[11px]"
                        />
                      )}
                    </div>
                  </div>
                )}

                {gym.gym_objections && (
                  <div className="rounded-xl bg-amber-50 p-3.5 text-xs border border-amber-200/80 shadow-2xs">
                    <span className="font-bold text-amber-900 block mb-0.5">
                      Objeciones detectadas:
                    </span>
                    <p className="text-amber-800 leading-relaxed">{gym.gym_objections}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Commercial notes */}
            <Card className="rounded-2xl border-slate-200/80 bg-white shadow-2xs overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Notas Comerciales Internas
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 text-sm">
                {gym.commercial_notes ? (
                  <div className="whitespace-pre-wrap leading-relaxed text-slate-700 bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl text-xs font-mono shadow-2xs">
                    {gym.commercial_notes}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic font-medium">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Documentos y Contratos</h2>
              <p className="text-xs text-muted-foreground">
                Archivos vinculados al gimnasio, acuerdos firmados, mandatos SEPA y material comercial.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setDocumentModalOpen(true)}
              className="flex items-center gap-1.5 cursor-pointer rounded-xl font-semibold shadow-2xs self-start sm:self-auto"
            >
              <UploadCloud className="h-4 w-4" />
              Subir documento
            </Button>
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
              <p className="text-xs text-muted-foreground mt-1 mb-4">
                Puedes subir acuerdos, estatutos, pólizas o material fotográfico de este gimnasio.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDocumentModalOpen(true)}
                className="gap-1.5 cursor-pointer rounded-xl text-xs"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                Subir primer documento
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {gym.documents.map((doc) => (
                <Card
                  key={doc.id}
                  onClick={() => setSelectedPreviewDoc(doc)}
                  className="p-3.5 flex items-center justify-between text-xs hover:border-primary/50 hover:shadow-2xs cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold block truncate text-slate-900">{doc.name}</span>
                      <span className="text-muted-foreground text-2xs block truncate">
                        {doc.category || 'General'} • {formatDate(doc.created_at)}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedPreviewDoc(doc)
                    }}
                  >
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

          {/* Classes list & Mobile App Publication Hub */}
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b pb-4">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base text-slate-900 dark:text-white font-bold">
                      Catálogo de Clases y Publicación en App
                    </CardTitle>
                    <Badge variant="outline" className="text-xs font-mono">
                      {gym.classes.length} clases
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Gestiona los horarios, tarifas y el estado de publicación en la app móvil de GymBooking.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsPortalModalOpen(true)}
                    className="flex items-center gap-1.5 cursor-pointer rounded-xl font-bold border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 shadow-2xs"
                  >
                    <Link2 className="h-4 w-4" />
                    <span>Portal Dueño</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAppPreviewOpen(true)}
                    className="flex items-center gap-1.5 cursor-pointer rounded-xl font-bold border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 shadow-2xs"
                  >
                    <Smartphone className="h-4 w-4" />
                    <span>Vista previa en App</span>
                  </Button>

                  {gym.classes.some((c) => c.publication_status !== 'published') && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePublishAllClasses}
                      disabled={publishingAllClasses}
                      className="flex items-center gap-1.5 cursor-pointer rounded-xl font-bold border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 shadow-2xs"
                    >
                      {publishingAllClasses ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      <span>Publicar todo en App</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingClass(null)
                      setClassModalOpen(true)
                    }}
                    className="flex items-center gap-1.5 cursor-pointer rounded-xl font-semibold shadow-2xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Añadir clase</span>
                  </Button>
                </div>
              </div>

              {/* KPI Status Badges */}
              <div className="flex flex-wrap items-center gap-2 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 font-medium">Estado en la App:</span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {gym.classes.filter((c) => c.publication_status === 'published').length} en directo en App
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  {gym.classes.filter((c) => c.publication_status !== 'published').length} borradores / no publicadas
                </span>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {gym.classes.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center mx-auto">
                    <Smartphone className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    Aún no hay clases registradas para este gimnasio
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Añade las disciplinas y horarios del gimnasio para publicarlas en la app móvil y abrir reservas.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setEditingClass(null)
                      setClassModalOpen(true)
                    }}
                    className="gap-1.5 cursor-pointer rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Registrar primera clase
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {gym.classes.map((cls) => {
                    const isPublished = cls.publication_status === 'published'
                    const schedules = (cls as any).class_schedules || []
                    const DAY_MAP: Record<number, string> = { 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb', 0: 'Dom' }
                    const daysText = schedules.length > 0
                      ? schedules.map((s: any) => DAY_MAP[s.day_of_week] || 'D').join(', ')
                      : 'Horario flexible'
                    const timeText = schedules[0]?.start_time
                      ? `${schedules[0].start_time.slice(0, 5)} - ${schedules[0].end_time.slice(0, 5)}`
                      : `${cls.duration_minutes || 60} min`

                    return (
                      <div
                        key={cls.id}
                        className={`p-4 rounded-xl border transition-all space-y-3 ${
                          isPublished
                            ? 'bg-card border-slate-200 dark:border-slate-800 shadow-2xs hover:border-blue-400'
                            : 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-200/80 dark:border-amber-900/40'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                                {cls.discipline?.name || 'General'}
                              </span>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="text-[11px] text-muted-foreground capitalize">
                                {cls.level || 'Todos los niveles'}
                              </span>
                            </div>
                            <h4 className="font-bold text-sm text-slate-900 dark:text-white mt-0.5 leading-snug">
                              {cls.name}
                            </h4>
                          </div>

                          <Badge
                            variant={isPublished ? 'success' : 'secondary'}
                            className={`text-2xs font-bold uppercase tracking-wider ${
                              isPublished
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {isPublished ? '🟢 En App' : '🟡 Borrador'}
                          </Badge>
                        </div>

                        {/* Schedule badge */}
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                            <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            {daysText}
                          </span>
                          <span className="flex items-center gap-1 text-muted-foreground font-mono">
                            <Clock className="h-3 w-3" />
                            {timeText}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span>Aforo: <strong>{cls.capacity ? `${cls.capacity} plazas` : 'Libre'}</strong></span>
                          <span>Tarifa: <strong>{cls.price ? `${cls.price}€` : 'Pase Gym'}</strong></span>
                        </div>

                        {/* Card actions toolbar */}
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleTogglePublish(cls.id, cls.publication_status)}
                            disabled={togglingClassId === cls.id}
                            className={`h-7 px-2.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
                              isPublished
                                ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                                : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 bg-emerald-50/60 dark:bg-emerald-950/30'
                            }`}
                          >
                            {togglingClassId === cls.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : isPublished ? (
                              'Pausar en App'
                            ) : (
                              '🚀 Publicar en App'
                            )}
                          </Button>

                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingClass(cls)
                                setClassModalOpen(true)
                              }}
                              className="h-7 px-2 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                              title="Editar clase y horario"
                            >
                              <Edit className="h-3.5 w-3.5 mr-1" />
                              Editar
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteClass(cls.id, cls.name)}
                              className="h-7 px-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                              title="Eliminar clase"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 8. INCIDENCIAS */}
      {activeTab === 'incidencias' && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="border-b pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    Incidencias y Soporte ({gym.issues?.length || 0})
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Seguimiento de problemas técnicos, descuadres de horarios y peticiones operativas.
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => setIssueModalOpen(true)}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Nueva incidencia
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {(!gym.issues || gym.issues.length === 0) ? (
                <div className="p-12 text-center text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500 stroke-1" />
                  <p className="text-sm font-medium text-foreground">¡Todo en orden!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    No hay incidencias ni reclamaciones abiertas registradas para este gimnasio.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {gym.issues.map((iss) => (
                    <div
                      key={iss.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-semibold text-muted-foreground">
                            #{iss.id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-foreground">
                            {iss.title}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            iss.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : iss.priority === 'high'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {iss.priority.toUpperCase()}
                          </span>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                            {iss.status}
                          </span>
                        </div>

                        {iss.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {iss.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-2xs text-muted-foreground pt-0.5">
                          <span>Reportada: {formatDate(iss.created_at)}</span>
                          {iss.assignee && (
                            <span>Asignado: <strong>{iss.assignee.full_name}</strong></span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                          <Link href="/issues">
                            Ver en incidencias <ExternalLink className="h-3 w-3 ml-1" />
                          </Link>
                        </Button>
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

      {/* 4. Issue Form Modal */}
      <IssueForm
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onSuccess={refreshGymData}
        preselectedGymId={gym.id}
      />

      {/* 5. Document Upload Modal */}
      <DocumentUploadModal
        open={documentModalOpen}
        onOpenChange={setDocumentModalOpen}
        onSuccess={() => {
          setDocumentModalOpen(false)
          refreshGymData()
        }}
        userOrgId={gym.organization_id}
        currentUserId={gym.owner_id || ''}
        defaultGymId={gym.id}
        gyms={[{ id: gym.id, name: gym.name }]}
      />

      {/* 6. Document Preview Modal */}
      <DocumentPreviewModal
        document={selectedPreviewDoc}
        isOpen={!!selectedPreviewDoc}
        onClose={() => setSelectedPreviewDoc(null)}
      />

      {/* 7. Class Form Modal */}
      <ClassFormModal
        isOpen={classModalOpen}
        onClose={() => {
          setClassModalOpen(false)
          setEditingClass(null)
        }}
        onSuccess={() => {
          setClassModalOpen(false)
          setEditingClass(null)
          refreshGymData()
        }}
        preselectedGymId={gym.id}
        initialClass={editingClass}
      />

      {/* 8. Executive Report & Printable PDF Modal */}
      <GymExecutiveReportModal
        gym={gym}
        isOpen={isExecutiveReportOpen}
        onClose={() => setIsExecutiveReportOpen(false)}
      />

      {/* 9. Mobile App Simulator & Publication Modal */}
      <AppPreviewModal
        gym={{
          id: gym.id,
          name: gym.name,
          city: gym.city,
          address: gym.address,
          classes: gym.classes as any,
        }}
        isOpen={isAppPreviewOpen}
        onClose={() => setIsAppPreviewOpen(false)}
        onPublishAllSuccess={() => {
          refreshGymData()
        }}
      />

      {/* 10. Gym Owner Portal Share Modal */}
      <GymPortalShareModal
        gym={gym}
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
      />
    </div>
  )
}
