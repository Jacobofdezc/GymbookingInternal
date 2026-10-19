'use client'

import React, { useState } from 'react'
import type { Profile, Invitation, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { InviteModal, ROLE_OPTIONS } from '@/components/team/InviteModal'
import { Button } from '@/components/ui/button'
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
} from 'lucide-react'

const ROLE_BADGE_MAP: Record<UserRole, { label: string; badgeClass: string }> = {
  admin: {
    label: 'Administrador',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  commercial: {
    label: 'Comercial',
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  operations: {
    label: 'Operaciones',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  viewer: {
    label: 'Observador',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
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
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  )

  const isAdmin = currentUser.role === 'admin'
  const supabase = createClient()

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    if (!isAdmin || memberId === currentUser.id) return

    setUpdatingId(memberId)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      )
      setMessage({
        type: 'success',
        text: 'Rol de usuario actualizado con éxito',
      })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cambiar rol',
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
      : `¿Deseas desactivar el acceso de ${member.full_name}? No podrá iniciar sesión.`

    if (!window.confirm(confirmText)) return

    setUpdatingId(member.id)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: nextState })
        .eq('id', member.id)

      if (error) throw error

      setMembers((prev) =>
        prev.map((m) => (m.id === member.id ? { ...m, is_active: nextState } : m))
      )
      setMessage({
        type: 'success',
        text: nextState ? 'Usuario reactivado' : 'Usuario desactivado',
      })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al cambiar estado',
      })
    } finally {
      setUpdatingId(null)
    }
  }

  const handleRevokeInvitation = async (invitationId: string) => {
    if (!isAdmin) return
    if (!window.confirm('¿Deseas revocar esta invitación pendiente?')) return

    setRevokingId(invitationId)
    setMessage(null)

    try {
      const res = await fetch(`/api/invitations/${invitationId}`, {
        method: 'DELETE',
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al revocar invitación')
      }

      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId))
      setMessage({
        type: 'success',
        text: 'Invitación revocada correctamente',
      })
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error al revocar',
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
        <span className="text-[11px] text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded font-medium">
          Expirada
        </span>
      )
    }
    return (
      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />
        Expira en {days} {days === 1 ? 'día' : 'días'}
      </span>
    )
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Equipo y Permisos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra los usuarios con acceso al CRM, asigna roles y gestiona invitaciones.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => setIsInviteOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4" />
            Invitar usuario
          </Button>
        )}
      </div>

      {message && (
        <div
          className={`flex items-center gap-2 p-3 text-sm rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Section 1: Team Members Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Miembros de la organización ({members.length})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Usuarios activos y colaboradores con cuenta en GymBooking
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
              <tr>
                <th className="px-5 py-3">Miembro</th>
                <th className="px-5 py-3">Rol asignado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Incorporación</th>
                {isAdmin && <th className="px-5 py-3 text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => {
                const roleBadge = ROLE_BADGE_MAP[member.role] || ROLE_BADGE_MAP.viewer
                const isSelf = member.id === currentUser.id
                const isUpdating = updatingId === member.id

                return (
                  <tr
                    key={member.id}
                    className="hover:bg-gray-50/50 transition-colors"
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
                            <span className="font-bold text-gray-900">
                              {member.full_name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-semibold">
                                Tú
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 block">
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
                          <SelectTrigger className="w-40 h-8 text-xs bg-white">
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
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Joined Date */}
                    <td className="px-5 py-4 text-xs text-gray-500 whitespace-nowrap">
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
                            className={`text-xs h-8 ${
                              member.is_active
                                ? 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50'
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
                          <span className="text-xs text-gray-400">—</span>
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
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                Invitaciones pendientes ({invitations.length})
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Invitaciones enviadas por email que aún no han sido aceptadas
              </p>
            </div>
          </div>

          {invitations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400">
              No hay invitaciones pendientes en este momento.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50/70 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Correo invitado</th>
                    <th className="px-5 py-3">Rol asignado</th>
                    <th className="px-5 py-3">Vencimiento</th>
                    <th className="px-5 py-3">Fecha de envío</th>
                    <th className="px-5 py-3 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {invitations.map((inv) => {
                    const roleBadge =
                      ROLE_BADGE_MAP[inv.role] || ROLE_BADGE_MAP.viewer

                    return (
                      <tr
                        key={inv.id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="font-semibold text-gray-800">
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
                        <td className="px-5 py-3.5 text-xs text-gray-500">
                          {formatDate(inv.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvitation(inv.id)}
                            disabled={revokingId === inv.id}
                            className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-8 gap-1"
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
