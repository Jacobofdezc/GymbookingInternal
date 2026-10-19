'use client'

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole, Invitation } from '@/types/database'
import {
  UserPlus,
  Mail,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'

export const ROLE_OPTIONS: { role: UserRole; label: string; desc: string }[] = [
  {
    role: 'admin',
    label: 'Administrador',
    desc: 'Acceso total y configuración del sistema',
  },
  {
    role: 'commercial',
    label: 'Comercial',
    desc: 'Gestión de gimnasios, contactos y acuerdos',
  },
  {
    role: 'operations',
    label: 'Operaciones',
    desc: 'Gestión de clases, horarios e incidencias',
  },
  {
    role: 'viewer',
    label: 'Observador',
    desc: 'Acceso de solo lectura al sistema',
  },
]

interface InviteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (newInvite: Invitation) => void
}

export function InviteModal({ open, onOpenChange, onSuccess }: InviteModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('commercial')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const resetForm = () => {
    setEmail('')
    setRole('commercial')
    setError(null)
    setSuccessMessage(null)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, introduce un correo electrónico válido')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar la invitación')
      }

      setSuccessMessage(data.message || `Invitación enviada a ${email}`)
      if (onSuccess && data.invitation) {
        onSuccess(data.invitation)
      }

      setTimeout(() => {
        onOpenChange(false)
        resetForm()
      }, 1500)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error inesperado al invitar usuario'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) {
          onOpenChange(next)
          if (!next) resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
            <UserPlus className="w-5 h-5" />
          </div>
          <DialogTitle className="text-lg font-bold text-gray-900">
            Invitar miembro al equipo
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Se enviará un correo con un enlace de acceso para unirse a tu organización.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="invite-email" className="text-xs font-semibold text-gray-700">
              Correo electrónico *
            </Label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="companero@gymbooking.com"
                className="pl-9 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="invite-role" className="text-xs font-semibold text-gray-700">
              Rol asignado *
            </Label>
            <Select
              value={role}
              onValueChange={(val) => setRole(val as UserRole)}
              disabled={loading}
            >
              <SelectTrigger id="invite-role" className="text-sm">
                <SelectValue placeholder="Selecciona un rol" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.role} value={opt.role}>
                    <div className="text-left py-0.5">
                      <span className="font-semibold text-gray-800 block text-xs">
                        {opt.label}
                      </span>
                      <span className="text-[11px] text-gray-400 block">
                        {opt.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !email.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Enviar invitación
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
