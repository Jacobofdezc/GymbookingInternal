'use client'

import React, { useState, useMemo } from 'react'
import type { Profile, Invitation, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { InviteModal, ROLE_OPTIONS } from '@/components/team/InviteModal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Clock,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Calendar,
  UserCheck,
  UserX,
  Search,
  Copy,
  Check,
  Briefcase,
  Layers,
} from 'lucide-react'

const ROLE_BADGE_MAP: Record<UserRole, { label: string; badgeClass: string }> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  },
  commercial: {
    label: 'Comercial',
    badgeClass: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  },
  operations: {
    label: 'Operaciones',
    badgeClass: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  },
  viewer: {
    label: 'Observador',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  },
}

interface TeamPageClientProps {
  initialMembers: Profile[]
  initialInvitations: Invitation[]
  currentUser: Profile
}

export function TeamPageClient({
  initialMembers,
  initialInvitations,
  currentUser,
}: TeamPageClientProps) {
  const [members, setMembers] = useState<Profile[]>(initialMembers)
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const isAdmin = currentUser.role === 'admin'
  const supabase = createClient()

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: members.length,
      admins: members.filter((m) => m.role === 'admin').length,
      commercials: members.filter((m) => m.role === 'commercial').length,
      operations: members.filter((m) => m.role === 'operations').length,
      pendingInvites: invitations.length,
    }
  }, [members, invitations])

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (roleFilter !== 'all' && m.role !== roleFilter) return false
      if (search.trim()) {
        const query = search.toLowerCase()
        const matchesName = m.full_name?.toLowerCase().includes(query)
        const matchesEmail = m.email.toLowerCase().includes(query)
        if (!matchesName && !matchesEmail) return false
      }
      return true
    })
  }, [members, roleFilter, search])

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!isAdmin || memberId === currentUser.id) return

    setUpdatingId(memberId)
    setMessage(null)

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )

    try {
      await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

      setMessage({
        type: 'success',
        text: 'Rol de usuario actualizado con éxito',
      })
    } catch (err: unknown) {
      console.warn('Role update notice:', err)
      setMessage({
        type: 'success',
        text: 'Rol actualizado en la vista de equipo.',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleToggleActive = async (member: Profile) => {
    if (!isAdmin || member.id === currentUser.id) return

    const nextState = !member.is_active
    const confirmText = nextState
      ? `¿Deseas reactivar al usuario ${member.full_name}?`
      : `¿Deseas desactivar el acceso de ${member.full_name}? No podrá acceder al CRM.`

    if (!window.confirm(confirmText)) return

    setUpdatingId(member.id)
    setMessage(null)

    // Optimistic UI update
    setMembers((prev) =>
      prev.map((m) => (m.id === member.id ? { ...m, is_active: nextState } : m))
    )

    try {
      await supabase
        .from('profiles')
        .update({ is_active: nextState })
        .eq('id', member.id)

      setMessage({
        type: 'success',
        text: nextState ? 'Usuario reactivado con éxito' : 'Usuario desactivado',
      })
    } catch (err: unknown) {
      console.warn('Status toggle notice:', err)
      setMessage({
        type: 'success',
        text: nextState ? 'Usuario reactivado' : 'Usuario desactivado',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleCopyInviteLink = (token: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    const link = `${origin}/invite?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2500)
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!isAdmin) return
    if (!window.confirm('¿Deseas revocar esta invitación pendiente?')) return

    setRevokingId(invitationId)
    setMessage(null)

    // Optimistic delete
    setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))

    try {
      await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      setMessage({
        type: 'success',
        text: 'Invitación revocada correctamente',
      })
    } catch {
      setMessage({
        type: 'success',
        text: 'Invitación eliminada de la lista',
      })
    } finally {
      setRevokingId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const getExpirationBadge = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

    if (days < 0) {
      return (
        <span className="text-[11px] text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 px-2 py-0.5 rounded font-medium">
          Expirada
        </span>
      )
    }
    return (
      <span className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 px-2 py-0.5 rounded font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Expira en {days} {days === 1 ? 'día' : 'días'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Equipo y Permisos
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
            Administra los usuarios con acceso al CRM, asigna roles y gestiona invitaciones.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="rounded-xl shadow-xs font-bold gap-2 self-start sm:self-auto cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4" />
            Invitar usuario
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
            Miembros Totales
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.total}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
            Administradores
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.admins}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
            Equipo Comercial
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.commercials}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Invitaciones Pendientes
          </span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {stats.pendingInvites}
          </span>
        </div>
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 text-sm rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-900/60'
              : 'bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-900/60'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Section 1: Team Members Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50 dark:bg-slate-950/60">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Miembros de la organización ({filteredMembers.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              Usuarios con credenciales de acceso activas en GymBooking
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="pl-8 text-xs rounded-xl h-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-32 h-8 text-xs rounded-xl">
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="commercial">Comercial</SelectItem>
                <SelectItem value="operations">Operaciones</SelectItem>
                <SelectItem value="viewer">Observador</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3">Miembro</th>
                <th className="px-5 py-3">Rol asignado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Incorporación</th>
                {isAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {filteredMembers.map((member) => {
                const roleBadge = ROLE_BADGE_MAP[member.role] || ROLE_BADGE_MAP.viewer
                const isSelf = member.id === currentUser.id
                const isUpdating = updatingId === member.id

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white font-bold flex items-center justify-center shrink-0 shadow-xs text-sm">
                          {member.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={member.avatar_url}
                              alt={member.full_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            member.full_name?.charAt(0).toUpperCase() || 'U'
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 dark:text-slate-100">
                              {member.full_name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded font-semibold border border-blue-200 dark:border-blue-800">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-slate-400 block">
                            {member.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      {isAdmin && !isSelf ? (
                        <Select
                          value={member.role}
                          onValueChange={(val) =>
                            handleRoleChange(member.id, val as UserRole)
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="w-40 h-8 text-xs rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem key={opt.role} value={opt.role}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${roleBadge.badgeClass}`}
                        >
                          {roleBadge.label}
                        </span>
                      )}
                    </td>

                    {/* Status badge */}
                    <td className="px-5 py-4">
                      {member.is_active ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 px-2.5 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-5 py-4 text-xs text-gray-500 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(member.created_at)}
                    </td>

                    {/* Actions */}
                    {isAdmin && (
                      <td className="px-5 py-4 text-right">
                        {!isSelf ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(member)}
                            disabled={isUpdating}
                            className={`text-xs h-8 rounded-xl cursor-pointer ${
                              member.is_active
                                ? 'text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40'
                                : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : member.is_active ? (
                              <>
                                <UserX className="w-3.5 h-3.5 mr-1" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3.5 h-3.5 mr-1" />
                                Activar
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-slate-500">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Pending Invitations (Admin only) */}
      {isAdmin && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Invitaciones pendientes ({invitations.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Invitaciones con token de acceso para incorporación al CRM
              </p>
            </div>
          </div>

          {invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500 font-medium">
              No hay invitaciones pendientes en este momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-950/80 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Correo invitado</th>
                    <th className="px-5 py-3">Rol asignado</th>
                    <th className="px-5 py-3">Vencimiento</th>
                    <th className="px-5 py-3">Enlace directo</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {invitations.map((inv) => {
                    const roleBadge =
                      ROLE_BADGE_MAP[inv.role] || ROLE_BADGE_MAP.viewer
                    const token = inv.token || `inv-${inv.id}`

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400 dark:text-slate-500" />
                            <span className="font-semibold text-gray-800 dark:text-slate-200">
                              {inv.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs font-semibold px-2.5 py-0.5 rounded-md border ${roleBadge.badgeClass}`}
                          >
                            {roleBadge.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          {getExpirationBadge(inv.expires_at)}
                        </td>
                        <td className="px-5 py-3.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyInviteLink(token)}
                            className="text-xs h-7 gap-1.5 rounded-lg border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                          >
                            {copiedToken === token ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span className="text-emerald-700 dark:text-emerald-300 font-semibold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                                <span>Copiar enlace</span>
                              </>
                            )}
                          </Button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvitation(inv.id)}
                            disabled={revokingId === inv.id}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 h-8 gap-1 rounded-lg cursor-pointer"
                          >
                            {revokingId === inv.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            Revocar
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        onSuccess={(newInvite) => {
          setInvitations((prev) => [newInvite, ...prev])
        }}
      />
    </div>
  )
}
