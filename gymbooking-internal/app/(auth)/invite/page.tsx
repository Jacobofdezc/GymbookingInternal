'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Mail,
  ShieldCheck,
  Building,
  ArrowRight,
  LogIn,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, type UserRole } from '@/lib/auth/permissions'

interface InvitationData {
  email: string
  role: UserRole
  organizationName: string
  expiresAt: string
}

function InviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [isMagicLinkSent, setIsMagicLinkSent] = useState(false)

  useEffect(() => {
    if (!token) {
      setError('Enlace de invitación incompleto. Falta el token de acceso.')
      setIsLoading(false)
      return
    }

    async function checkInvitation() {
      try {
        const res = await fetch(`/api/invitations/${encodeURIComponent(token!)}`)
        const data = await res.json()

        if (!res.ok || !data.valid) {
          setError(data.error || 'La invitación es inválida o ha caducado.')
        } else {
          setInvitation(data.invitation)
        }
      } catch (err) {
        console.error('Error verifying invitation:', err)
        setError('Ocurrió un error al verificar la invitación. Inténtalo de nuevo más tarde.')
      } finally {
        setIsLoading(false)
      }
    }

    checkInvitation()
  }, [token])

  const handleAcceptInvitation = async () => {
    if (!invitation?.email) return

    setIsSubmitting(true)
    setError(null)

    try {
      const supabase = createClient()
      const appOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      const emailRedirectTo = `${appOrigin}/auth/callback?redirectTo=/dashboard`

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          emailRedirectTo,
        },
      })

      if (otpError) {
        throw otpError
      }

      setIsMagicLinkSent(true)
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(
        err.message || 'Error al procesar la invitación. Por favor intenta nuevamente.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="shadow-xl border-border/80 bg-white p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-3" />
        <CardTitle className="text-base font-medium text-gray-700">
          Verificando tu invitación...
        </CardTitle>
        <CardDescription className="text-xs text-gray-400 mt-1">
          Por favor espera un momento
        </CardDescription>
      </Card>
    )
  }

  if (error || !invitation) {
    return (
      <Card className="shadow-xl border-border/80 bg-white">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 mb-2">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <CardTitle className="text-lg font-bold text-gray-900">
            Invitación no disponible
          </CardTitle>
          <CardDescription className="text-sm text-gray-600 mt-1">
            {error || 'No hemos podido encontrar la invitación especificada.'}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-2 pt-2 pb-6">
          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
            <Link href="/login">
              <LogIn className="h-4 w-4 mr-2" />
              Ir a iniciar sesión
            </Link>
          </Button>
          <p className="text-xs text-gray-400 text-center">
            Si crees que esto es un error, pide al administrador de tu equipo que te envíe una nueva invitación.
          </p>
        </CardFooter>
      </Card>
    )
  }

  if (isMagicLinkSent) {
    return (
      <Card className="shadow-xl border-border/80 bg-white">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-2">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-xl font-bold text-gray-900">
            ¡Enlace de acceso enviado!
          </CardTitle>
          <CardDescription className="text-sm text-gray-600">
            Hemos enviado las instrucciones para activar tu cuenta a:
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-center">
          <div className="inline-block rounded-md bg-gray-100 px-3.5 py-1.5 text-sm font-semibold text-gray-800">
            {invitation.email}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
            Abre el correo que acabas de recibir y haz clic en el botón de confirmación para completar tu registro e ingresar al panel de control.
          </p>
        </CardContent>

        <CardFooter className="pt-2 pb-6 flex justify-center">
          <Button variant="ghost" asChild className="text-xs text-gray-500 hover:text-gray-800">
            <Link href="/login">Volver a pantalla de acceso</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  const roleLabel = ROLE_LABELS[invitation.role] || invitation.role

  return (
    <Card className="shadow-xl border-border/80 bg-white">
      <CardHeader className="text-center space-y-2 pb-5">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Activity className="h-5 w-5 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">GymBooking</span>
          <Badge variant="info" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Internal
          </Badge>
        </div>

        <CardTitle className="text-xl font-bold text-gray-900">
          Has sido invitado a GymBooking Internal
        </CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Únete a la plataforma para gestionar operaciones y clientes
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border border-gray-100 bg-gray-50/80 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Correo asignado:
            </span>
            <span className="font-semibold text-gray-900">{invitation.email}</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Rol en el equipo:
            </span>
            <Badge variant="secondary" className="capitalize text-xs font-medium">
              {roleLabel}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5" /> Organización:
            </span>
            <span className="font-medium text-gray-800">{invitation.organizationName}</span>
          </div>
        </div>

        <div className="text-xs text-gray-500 leading-normal">
          Al pulsar el botón a continuación, te enviaremos un enlace mágico seguro a tu correo electrónico para que confirmes tu identidad y actives tu sesión.
        </div>

        <Button
          onClick={handleAcceptInvitation}
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium h-10 shadow-sm"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Preparando acceso...
            </>
          ) : (
            <>
              Aceptar invitación y continuar
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </CardContent>

      <CardFooter className="flex justify-center border-t bg-gray-50/50 py-3 rounded-b-lg">
        <Link href="/login" className="text-xs text-gray-500 hover:text-blue-600 font-medium">
          ¿Ya tienes cuenta activa? Inicia sesión aquí
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full p-8 text-center bg-white shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-500 mt-3">Cargando invitación...</p>
        </Card>
      }
    >
      <InviteContent />
    </Suspense>
  )
}
