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
} from 'lucide-react'

interface SettingsClientProps {
  currentUser: Profile
  organization: Organization
  initialCommercialStatuses: CommercialStatus[]
  initialOnboardingStatuses: OnboardingStatus[]
  initialDisciplines: Discipline[]
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

export function SettingsClient({
  currentUser,
  organization,
  initialCommercialStatuses,
  initialOnboardingStatuses,
  initialDisciplines,
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
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', currentUser.id)

      if (error) throw error

      setProfileMessage({
        type: 'success',
        text: 'Tu nombre de perfil se ha actualizado correctamente.',
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
      const { error } = await supabase
        .from('organizations')
        .update({ name: orgName.trim() })
        .eq('id', organization.id)

      if (error) throw error

      setOrgMessage({
        type: 'success',
        text: 'Nombre de la organización actualizado con éxito.',
      })
      router.refresh()
    } catch (err: unknown) {
      setOrgMessage({
        type: 'error',
        text:
          err instanceof Error
            ? err.message
            : 'Error al actualizar organización',
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

      if (error) throw error

      setCommercialStatuses([...commercialStatuses, data])
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
  }

  // Commercial Status Toggle
  const handleToggleCommercialActive = async (status: CommercialStatus) => {
    const nextState = !status.is_active
    setCommercialStatuses((prev) =>
      prev.map((s) => (s.id === status.id ? { ...s, is_active: nextState } : s))
    )

    await supabase
      .from('commercial_statuses')
      .update({ is_active: nextState })
      .eq('id', status.id)
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

      if (error) throw error

      setOnboardingStatuses([...onboardingStatuses, data])
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

      const { data, error } = await supabase
        .from('disciplines')
        .insert({
          organization_id: organization.id,
          name: newDisciplineName.trim(),
          slug,
        })
        .select()
        .single()

      if (error) throw error

      setDisciplines([...disciplines, data])
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
    await supabase.from('disciplines').delete().eq('id', disc.id)
  }

  // Logout
  const handleSignOut = async () => {
    setLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Configuración
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Ajustes de cuenta, preferencias de organización, estados y parámetros del sistema.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-gray-100 p-1 rounded-xl">
          <TabsTrigger value="profile" className="text-xs font-semibold gap-2">
            <User className="w-3.5 h-3.5" />
            Perfil
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger
              value="organization"
              className="text-xs font-semibold gap-2"
            >
              <Building className="w-3.5 h-3.5" />
              Organización
            </TabsTrigger>
          )}
          <TabsTrigger value="security" className="text-xs font-semibold gap-2">
            <Shield className="w-3.5 h-3.5" />
            Acceso y seguridad
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: PERFIL */}
        <TabsContent value="profile" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-900">
                Información personal
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Datos visibles para otros miembros del equipo en el CRM.
              </p>
            </div>

            {profileMessage && (
              <div
                className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-800 border-red-200'
                }`}
              >
                {profileMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
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
                  <h4 className="text-sm font-bold text-gray-900">
                    {currentUser.full_name}
                  </h4>
                  <p className="text-xs text-gray-400 capitalize">
                    Rol: {currentUser.role} • Organización: {organization.name}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="full-name"
                    className="text-xs font-semibold text-gray-700"
                  >
                    Nombre completo
                  </Label>
                  <Input
                    id="full-name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-1 text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="email"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Correo electrónico
                    </Label>
                    <span className="text-[10px] text-gray-400">
                      Gestionado por Supabase Auth
                    </span>
                  </div>
                  <Input
                    id="email"
                    value={currentUser.email}
                    disabled
                    className="mt-1 bg-gray-50/70 text-gray-500 cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={profileSaving || !fullName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Datos de la Organización
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Nombre e identificador del espacio de trabajo.
                </p>
              </div>

              {orgMessage && (
                <div
                  className={`flex items-center gap-2 p-3 text-xs rounded-xl border ${
                    orgMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{orgMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleSaveOrgName} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="org-name"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Nombre de la empresa
                    </Label>
                    <Input
                      id="org-name"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="mt-1 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="org-slug"
                      className="text-xs font-semibold text-gray-700"
                    >
                      Slug (Identificador URL)
                    </Label>
                    <Input
                      id="org-slug"
                      value={organization.slug}
                      disabled
                      className="mt-1 bg-gray-50 text-gray-400 cursor-not-allowed text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={orgSaving || !orgName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
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

            {/* Commercial Statuses Management */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    Estados Comerciales (Pipeline de Gimnasios)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define las fases del embudo comercial, reordena etapas y añade nuevos estados.
                  </p>
                </div>
              </div>

              {/* List */}
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {commercialStatuses.map((st, idx) => (
                  <div
                    key={st.id}
                    className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleMoveCommercial(idx, 'up')}
                          disabled={idx === 0}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          title="Subir posición"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveCommercial(idx, 'down')}
                          disabled={idx === commercialStatuses.length - 1}
                          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20"
                          title="Bajar posición"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: st.color }}
                      />

                      <div>
                        <span className="text-sm font-bold text-gray-800">
                          {st.name}
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          {st.is_pipeline_stage && (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.2 rounded font-medium">
                              En Pipeline
                            </span>
                          )}
                          {!st.is_active && (
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.2 rounded font-medium">
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
                        className="text-xs h-7 text-gray-500"
                      >
                        {st.is_active ? 'Desactivar' : 'Activar'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add form */}
              <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                <span className="text-xs font-bold text-gray-700 block">
                  Añadir nuevo estado comercial
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <Input
                    value={newCommName}
                    onChange={(e) => setNewCommName(e.target.value)}
                    placeholder="Nombre del estado (Ej. Negociación avanzada)"
                    className="text-xs max-w-xs bg-white"
                  />

                  {/* Color picker circles */}
                  <div className="flex items-center gap-1.5">
                    {COLOR_PALETTE.map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setNewCommColor(col)}
                        className={`w-5 h-5 rounded-full transition-transform ${
                          newCommColor === col ? 'scale-125 ring-2 ring-gray-800' : ''
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
                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir estado
                  </Button>
                </div>
              </div>
            </div>

            {/* Onboarding Statuses Management */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Estados de Onboarding
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Fases de integración técnica, carga de clases y publicación.
                </p>
              </div>

              <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                {onboardingStatuses.map((st) => (
                  <div
                    key={st.id}
                    className="p-3.5 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="text-sm font-bold text-gray-800">
                        {st.name}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        st.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {st.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Onboarding status */}
              <div className="bg-gray-50 p-4 rounded-xl flex flex-wrap items-center gap-3">
                <Input
                  value={newOnbName}
                  onChange={(e) => setNewOnbName(e.target.value)}
                  placeholder="Nuevo estado de onboarding..."
                  className="text-xs max-w-xs bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddOnboardingStatus}
                  disabled={addingOnb || !newOnbName.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir
                </Button>
              </div>
            </div>

            {/* Disciplines Management */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900">
                  Disciplinas Deportivas
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Catálogo de actividades disponibles para asociar a gimnasios y clases.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {disciplines.map((d) => (
                  <span
                    key={d.id}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200"
                  >
                    <span>{d.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDiscipline(d)}
                      className="text-gray-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                      title="Eliminar disciplina"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3 max-w-md">
                <Input
                  value={newDisciplineName}
                  onChange={(e) => setNewDisciplineName(e.target.value)}
                  placeholder="Ej. CrossFit, Pádel, Yoga..."
                  className="text-xs bg-white"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddDiscipline}
                  disabled={addingDiscipline || !newDisciplineName.trim()}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white shrink-0 gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir
                </Button>
              </div>
            </div>
          </TabsContent>
        )}

        {/* TAB 3: ACCESO Y SEGURIDAD */}
        <TabsContent value="security" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs p-6 space-y-6">
            <div className="border-b border-gray-100 pb-4">
              <h3 className="text-base font-bold text-gray-900">
                Sesión y Seguridad de la cuenta
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Control de sesión activa y parámetros de autenticación.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-gray-900">
                    Sesión iniciada
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Conectado como <strong className="text-gray-800">{currentUser.email}</strong>
                  </p>
                  <span className="text-[11px] text-gray-400 block mt-1">
                    Rol activo: {currentUser.role} • Organización ID: {organization.id}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  disabled={loggingOut}
                  className="text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 gap-1.5 self-start sm:self-auto"
                >
                  {loggingOut ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogOut className="w-3.5 h-3.5" />
                  )}
                  Cerrar sesión
                </Button>
              </div>

              <div className="border border-gray-100 rounded-xl p-4 text-xs text-gray-500 space-y-2">
                <div className="flex items-center gap-2 text-gray-800 font-semibold">
                  <Lock className="w-4 h-4 text-blue-600" />
                  <span>Políticas de acceso</span>
                </div>
                <p>
                  El acceso a este CRM está protegido mediante Supabase Auth con autenticación basada en cookies seguras (SSR) y políticas RLS por organización.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
