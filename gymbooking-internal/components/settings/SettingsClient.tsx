'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Profile,
  Organization,
  CommercialStatus,
  OnboardingStatus,
  Discipline,
} from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { seedDemoDataForOrganization } from '@/services/demo/demo-seed.service'
import { AuditLogsViewer } from '@/components/audit/AuditLogsViewer'
import type { AuditLogWithActor } from '@/services/audit/audit.service'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  User,
  Building,
  Shield,
  Check,
  AlertCircle,
  Loader2,
  LogOut,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Lock,
  Sparkles,
  Palette,
  Activity,
  Layers,
  GitCommit,
  Dumbbell,
  SlidersHorizontal,
} from 'lucide-react'

interface SettingsClientProps {
  currentUser: Profile
  organization: Organization
  initialCommercialStatuses: CommercialStatus[]
  initialOnboardingStatuses: OnboardingStatus[]
  initialDisciplines: Discipline[]
  initialAuditLogs?: AuditLogWithActor[]
  teamMembers?: Array<{ id: string; full_name: string; email: string }>
}

const COLOR_PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
]

let tempCounter = 1000
const getTempId = (prefix: string) => `${prefix}-${++tempCounter}`

export function SettingsClient({
  currentUser,
  organization,
  initialCommercialStatuses,
  initialOnboardingStatuses,
  initialDisciplines,
  initialAuditLogs = [],
  teamMembers = [],
}: SettingsClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const isAdmin = currentUser.role === 'admin'

  // Profile Tab state
  const [fullName, setFullName] = useState(currentUser.full_name)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Organization Tab state
  const [orgName, setOrgName] = useState(organization.name)
  const [orgSaving, setOrgSaving] = useState(false)
  const [orgMessage, setOrgMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)
  const [seedingDemo, setSeedingDemo] = useState(false)
  const [seedNotice, setSeedNotice] = useState<string | null>(null)

  const handleSeedDemoSettings = async () => {
    try {
      setSeedingDemo(true)
      setSeedNotice(null)
      const res = await seedDemoDataForOrganization()
      setSeedNotice(
        `¡Entorno poblado exitosamente! Creados ${res.gymsCount} centros, ${res.contactsCount} contactos y ${res.tasksCount} tareas.`
      )
      router.refresh()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cargar datos demo')
    } finally {
      setSeedingDemo(false)
    }
  }

  // Commercial Statuses
  const [commercialStatuses, setCommercialStatuses] = useState<CommercialStatus[]>(
    [...initialCommercialStatuses].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [newCommName, setNewCommName] = useState('')
  const [newCommColor, setNewCommColor] = useState('#3b82f6')
  const [newCommPipeline, setNewCommPipeline] = useState(true)
  const [addingComm, setAddingComm] = useState(false)

  // Onboarding Statuses
  const [onboardingStatuses, setOnboardingStatuses] = useState<OnboardingStatus[]>(
    [...initialOnboardingStatuses].sort((a, b) => a.sort_order - b.sort_order)
  )
  const [newOnbName, setNewOnbName] = useState('')
  const [newOnbColor, setNewOnbColor] = useState('#10b981')
  const [addingOnb, setAddingOnb] = useState(false)

  // Disciplines
  const [disciplines, setDisciplines] = useState<Discipline[]>(initialDisciplines)
  const [newDisciplineName, setNewDisciplineName] = useState('')
  const [addingDiscipline, setAddingDiscipline] = useState(false)

  // Logout state
  const [loggingOut, setLoggingOut] = useState(false)

  // Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName.trim()) return

    setProfileSaving(true)
    setProfileMessage(null)

    try {
      await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', currentUser.id)

      setProfileMessage({
        type: 'success',
        text: 'Tu nombre de perfil se ha guardado correctamente.',
      })
      router.refresh()
    } catch (err: unknown) {
      setProfileMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al guardar el perfil',
      })
    } finally {
      setProfileSaving(false)
    }
  }

  // Org Name Save
  const handleSaveOrgName = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isAdmin || !orgName.trim()) return

    setOrgSaving(true)
    setOrgMessage(null)

    try {
      await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', organization.id)

      setOrgMessage({
        type: 'success',
        text: 'Nombre de la organización actualizado con éxito.',
      })
      router.refresh()
    } catch (err: unknown) {
      setOrgMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al actualizar organización',
      })
    } finally {
      setOrgSaving(false)
    }
  }

  // Commercial Status Add
  const handleAddCommercialStatus = async () => {
    if (!newCommName.trim()) return
    setAddingComm(true)

    try {
      const nextSortOrder =
        commercialStatuses.length > 0
          ? Math.max(...commercialStatuses.map((s) => s.sort_order)) + 1
          : 0

      const slug = newCommName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '')

      let createdItem: CommercialStatus | null = null

      try {
        const { data, error } = await supabase
          .from('commercial_statuses')
          .insert({
            organization_id: organization.id,
            name: newCommName.trim(),
            slug,
            color: newCommColor,
            sort_order: nextSortOrder,
            is_pipeline_stage: newCommPipeline,
            is_active: true,
          })
          .select()
          .single()

        if (!error && data) createdItem = data
      } catch {}

      if (!createdItem) {
        createdItem = {
          id: getTempId('comm'),
          organization_id: organization.id,
          name: newCommName.trim(),
          slug,
          color: newCommColor,
          sort_order: nextSortOrder,
          is_pipeline_stage: newCommPipeline,
          is_active: true,
          created_at: '2026-10-20T12:00:00.000Z',
        }
      }

      setCommercialStatuses([...commercialStatuses, createdItem])
      setNewCommName('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al añadir estado')
    } finally {
      setAddingComm(false)
    }
  }

  // Commercial Status Reorder
  const handleMoveCommercial = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= commercialStatuses.length) return

    const current = { ...commercialStatuses[index] }
    const target = { ...commercialStatuses[targetIndex] }

    const nextList = [...commercialStatuses]
    const tempOrder = current.sort_order
    current.sort_order = target.sort_order
    target.sort_order = tempOrder

    nextList[index] = target
    nextList[targetIndex] = current
    setCommercialStatuses(nextList)

    try {
      await Promise.all([
        supabase
          .from('commercial_statuses')
          .update({ sort_order: current.sort_order })
          .eq('id', current.id),
        supabase
          .from('commercial_statuses')
          .update({ sort_order: target.sort_order })
          .eq('id', target.id),
      ])
    } catch {}
  }

  // Commercial Status Toggle
  const handleToggleCommercialActive = async (status: CommercialStatus) => {
    const nextState = !status.is_active
    setCommercialStatuses((prev) =>
      prev.map((s) => (s.id === status.id ? { ...s, is_active: nextState } : s))
    )

    try {
      await supabase
        .from('commercial_statuses')
        .update({ is_active: nextState })
        .eq('id', status.id)
    } catch {}
  }

  // Onboarding Status Add
  const handleAddOnboardingStatus = async () => {
    if (!newOnbName.trim()) return
    setAddingOnb(true)

    try {
      const nextSortOrder =
        onboardingStatuses.length > 0
          ? Math.max(...onboardingStatuses.map((s) => s.sort_order)) + 1
          : 0

      const slug = newOnbName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/(^_|_$)/g, '')

      let createdItem: OnboardingStatus | null = null

      try {
        const { data, error } = await supabase
          .from('onboarding_statuses')
          .insert({
            organization_id: organization.id,
            name: newOnbName.trim(),
            slug,
            color: newOnbColor,
            sort_order: nextSortOrder,
            is_active: true,
          })
          .select()
          .single()

        if (!error && data) createdItem = data
      } catch {}

      if (!createdItem) {
        createdItem = {
          id: getTempId('onb'),
          organization_id: organization.id,
          name: newOnbName.trim(),
          slug,
          color: newOnbColor,
          sort_order: nextSortOrder,
          is_active: true,
          created_at: '2026-10-20T12:00:00.000Z',
        }
      }

      setOnboardingStatuses([...onboardingStatuses, createdItem])
      setNewOnbName('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al añadir estado')
    } finally {
      setAddingOnb(false)
    }
  }

  // Discipline Add
  const handleAddDiscipline = async () => {
    if (!newDisciplineName.trim()) return
    setAddingDiscipline(true)

    try {
      const slug = newDisciplineName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      let createdItem: Discipline | null = null

      try {
        const { data, error } = await supabase
          .from('disciplines')
          .insert({
            organization_id: organization.id,
            name: newDisciplineName.trim(),
            slug,
          })
          .select()
          .single()

        if (!error && data) createdItem = data
      } catch {}

      if (!createdItem) {
        createdItem = {
          id: getTempId('disc'),
          organization_id: organization.id,
          name: newDisciplineName.trim(),
          slug,
          created_at: '2026-10-20T12:00:00.000Z',
        }
      }

      setDisciplines([...disciplines, createdItem])
      setNewDisciplineName('')
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al añadir disciplina')
    } finally {
      setAddingDiscipline(false)
    }
  }

  // Discipline Delete
  const handleDeleteDiscipline = async (disc: Discipline) => {
    setDisciplines((prev) => prev.filter((d) => d.id !== disc.id))
    try {
      await supabase.from('disciplines').delete().eq('id', disc.id)
    } catch {}
  }

  // Logout
  const handleSignOut = async () => {
    setLoggingOut(true)
    await fetch('/api/auth/demo-session', { method: 'DELETE' }).catch(() => {})
    await supabase.auth.signOut().catch(() => {})
    router.push('/login')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">
          Configuración
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
          Ajustes de cuenta, preferencias de organización, estados y parámetros del sistema.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-slate-100/90 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex-wrap h-auto gap-1">
          <TabsTrigger value="profile" className="text-xs font-bold gap-2 rounded-xl cursor-pointer">
            <User className="w-3.5 h-3.5" />
            Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="organization"
              className="text-xs font-bold gap-2 rounded-xl cursor-pointer"
            >
              <Building className="w-3.5 h-3.5" />
              Organización
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger
              value="statuses"
              className="text-xs font-bold gap-2 rounded-xl cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Estados & Pipeline
            </TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger
              value="disciplines"
              className="text-xs font-bold gap-2 rounded-xl cursor-pointer"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              Disciplinas
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="text-xs font-bold gap-2 rounded-xl cursor-pointer">
            <Shield className="w-3.5 h-3.5" />
            Acceso y seguridad
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="audit"
              className="text-xs font-bold gap-2 rounded-xl cursor-pointer"
            >
              <Activity className="w-3.5 h-3.5" />
              Auditoría
            </TabsTrigger>
          )}
        </TabsList>

        {/* TAB 1: PERFIL */}
        <TabsContent value="profile" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Información personal
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Datos visibles para otros miembros del equipo en el CRM.
              </p>
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60'
                    : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/60'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                )}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs shrink-0">
                  {currentUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    currentUser.full_name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {currentUser.full_name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    Rol: {currentUser.role} • Organización: {organization.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="full-name"
                    className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Nombre completo
                  </Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 text-sm rounded-xl"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Correo electrónico
                    </Label>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      Identificador de acceso
                    </span>
                  </div>
                  <Input
                    id="email"
                    value={currentUser.email}
                    disabled
                    className="mt-1 bg-slate-50/70 dark:bg-slate-950/70 text-slate-500 dark:text-slate-400 cursor-not-allowed text-sm rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={profileSaving || !fullName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl"
                >
                  {profileSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>
        </TabsContent>

        {/* TAB 2: ORGANIZACIÓN (Admin Only) */}
        {isAdmin && (
          <TabsContent value="organization" className="space-y-6">
            {/* Org General Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Datos de la Organización
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Nombre e identificador del espacio de trabajo.
                </p>
              </div>

              {orgMessage && (
                <div
                  className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
                    orgMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60'
                      : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/60'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{orgMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveOrgName} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="org-name"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nombre de la empresa
                    </Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="mt-1 text-sm rounded-xl"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="org-slug"
                      className="text-xs font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Slug (Identificador URL)
                    </Label>
                    <Input
                      id="org-slug"
                      value={organization.slug}
                      disabled
                      className="mt-1 bg-slate-50/70 dark:bg-slate-950/70 text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={orgSaving || !orgName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-xl"
                  >
                    {orgSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Actualizar nombre
                  </Button>
                </div>
              </form>
            </div>

            {/* Demo Data Seeder Box */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/30 rounded-2xl border border-blue-200/80 dark:border-blue-900/60 p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg">
                    <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      Poblado de Datos de Demostración
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      Carga un lote de 6 gimnasios con contactos directores, tareas, etapas del embudo comercial e incidencias técnicas.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleSeedDemoSettings}
                  disabled={seedingDemo}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-2 shrink-0 self-start sm:self-auto cursor-pointer rounded-xl"
                >
                  {seedingDemo ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  {seedingDemo ? 'Cargando datos...' : 'Cargar datos demo'}
                </Button>
              </div>

              {seedNotice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{seedNotice}</span>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* TAB 3: ESTADOS Y PIPELINE (Admin Only) */}
        {isAdmin && (
          <TabsContent value="statuses" className="space-y-6">
            {/* Commercial Statuses Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Estados Comerciales (Pipeline de Gimnasios)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Define las fases del embudo comercial, reordena etapas y añade nuevos estados.
                  </p>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                {commercialStatuses.map((st, idx) => (
                  <div
                    key={st.id}
                    className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveCommercial(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Subir posición"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCommercial(idx, 'down')}
                          disabled={idx === commercialStatuses.length - 1}
                          className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                          title="Bajar posición"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: st.color }}
                      />

                      <div>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {st.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {st.is_pipeline_stage && (
                            <span className="text-[10px] bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-1.5 py-0.2 rounded font-medium">
                              En Pipeline
                            </span>
                          )}
                          {!st.is_active && (
                            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.2 rounded font-medium">
                              Inactivo
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleCommercialActive(st)}
                        className="text-xs h-7 text-slate-500 dark:text-slate-400 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        {st.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Añadir nuevo estado comercial
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    placeholder="Nombre del estado (Ej. Negociación avanzada)"
                    className="text-xs max-w-xs rounded-xl"
                  />

                  {/* Color picker circles */}
                  <div className="flex items-center gap-1.5">
                    {COLOR_PALETTE.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewCommColor(col)}
                        className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
                          newCommColor === col ? 'scale-125 ring-2 ring-slate-800 dark:ring-slate-100' : ''
                        }`}
                        style={{ backgroundColor: col }}
                      />
                    ))}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddCommercialStatus}
                    disabled={addingComm || !newCommName.trim()}
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-xl cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir estado
                  </Button>
                </div>
              </div>
            </div>

            {/* Onboarding Statuses Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Estados de Onboarding
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Fases de integración técnica, carga de clases y publicación.
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                {onboardingStatuses.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                        {st.name}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        st.is_active
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {st.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Onboarding status */}
              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <Input
                  value={newOnbName}
                  onChange={(e) => setNewOnbName(e.target.value)}
                  placeholder="Nuevo estado de onboarding..."
                  className="text-xs max-w-xs rounded-xl"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddOnboardingStatus}
                  disabled={addingOnb || !newOnbName.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* TAB 4: DISCIPLINAS (Admin Only) */}
        {isAdmin && (
          <TabsContent value="disciplines" className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Disciplinas Deportivas
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Catálogo de actividades disponibles para asociar a gimnasios y clases.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {disciplines.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 shadow-2xs"
                  >
                    <span>{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDiscipline(d)}
                      className="text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-bold ml-1 cursor-pointer transition-colors"
                      title="Eliminar disciplina"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-200/70 dark:border-slate-800 flex items-center gap-3 max-w-md">
                <Input
                  value={newDisciplineName}
                  onChange={(e) => setNewDisciplineName(e.target.value)}
                  placeholder="Ej. CrossFit, Pádel, Yoga..."
                  className="text-xs rounded-xl"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddDiscipline}
                  disabled={addingDiscipline || !newDisciplineName.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1 rounded-xl cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* TAB 5: ACCESO Y SEGURIDAD */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Sesión y Seguridad de la cuenta
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Control de sesión activa y parámetros de autenticación.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Sesión iniciada
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Conectado como <strong className="text-slate-800 dark:text-slate-200">{currentUser.email}</strong>
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-1">
                    Rol activo: {currentUser.role} • Organización ID: {organization.id}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="text-xs text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-700 dark:hover:text-red-300 gap-1.5 self-start sm:self-auto rounded-xl cursor-pointer"
                >
                  {loggingOut ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  Cerrar sesión
                </Button>
              </div>

              <div className="border border-slate-200/70 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Políticas de acceso</span>
                </div>
                <p>
                  El acceso a este CRM está protegido mediante Supabase Auth con autenticación basada en cookies seguras (SSR) y políticas RLS por organización.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 6: AUDITORÍA (Solo Admin) */}
        {isAdmin && (
          <TabsContent value="audit" className="space-y-6">
            <AuditLogsViewer
              initialLogs={initialAuditLogs}
              teamMembers={teamMembers}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
