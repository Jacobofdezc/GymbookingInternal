'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Mail, Activity, CheckCircle2, AlertCircle, ArrowLeft, Shield } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

const schema = z.object({
  email: z
    .string()
    .min(1, 'El correo electrónico es requerido')
    .email('Introduce un correo electrónico válido'),
})

type FormData = z.infer<typeof schema>

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const supabase = createClient()
      const appOrigin = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
      const emailRedirectTo = `${appOrigin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.signInWithOtp({
        email: data.email.trim().toLowerCase(),
        options: {
          emailRedirectTo,
        },
      })

      if (error) {
        throw error
      }

      setSubmittedEmail(data.email.trim().toLowerCase())
      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error during login:', err)
      setErrorMessage(
        err.message || 'No se pudo enviar el enlace de acceso. Por favor, verifica tu conexión o intenta más tarde.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="shadow-xl border-border/80 bg-white backdrop-blur-sm">
      <CardHeader className="space-y-3 pb-6 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-gray-900">GymBooking</span>
            <Badge variant="info" className="font-semibold px-2 py-0.5 text-xs bg-blue-50 text-blue-700 border-blue-200">
              Internal
            </Badge>
          </div>
        </div>

        <div>
          <CardTitle className="text-xl font-bold text-gray-900">
            Acceso al Sistema
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-1">
            Plataforma de gestión y operaciones interna
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="space-y-4 py-2 text-center animate-in fade-in-50 duration-300">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-semibold text-gray-900">¡Enlace enviado!</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hemos enviado un enlace mágico de acceso a:
              </p>
              <div className="inline-block rounded-md bg-gray-100 px-3 py-1 text-sm font-medium text-gray-800">
                {submittedEmail}
              </div>
              <p className="text-xs text-gray-500 pt-1">
                Revisa tu bandeja de entrada (y la carpeta de spam si no lo ves en unos minutos). Haz clic en el enlace para iniciar sesión.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full text-xs"
                onClick={() => {
                  setIsSuccess(false)
                  setSubmittedEmail('')
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Ingresar con otro correo
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {errorMessage && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="flex-1 text-xs leading-normal">{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                Correo corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@gymbooking.com"
                  className={`pl-9 text-sm ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  disabled={isLoading}
                  autoComplete="email"
                  autoFocus
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all h-10 mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando enlace...
                </>
              ) : (
                'Recibir enlace de acceso'
              )}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex flex-col border-t bg-gray-50/60 p-4 text-center rounded-b-lg">
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          <span>Acceso restringido a personal autorizado.</span>
        </div>
        <p className="text-[11px] text-gray-400 mt-1">
          No se permite el autorregistro público. Contacta al administrador si necesitas acceso.
        </p>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full p-8 text-center bg-white shadow-xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-500 mt-3">Cargando acceso...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
