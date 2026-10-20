'use client'

import React, { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import {
  Loader2,
  Mail,
  Activity,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Shield,
  Sparkles,
  UserCheck,
  Briefcase,
  Database,
  ArrowRight,
} from 'lucide-react'
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  const [isLoading, setIsLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [seedingLoading, setSeedingLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [seedNotice, setSeedNotice] = useState<string | null>(null)
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
      const appOrigin =
        typeof window !== 'undefined'
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      const emailRedirectTo = `${appOrigin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

      const { error } = await supabase.auth.signInWithOtp({
        email: data.email.trim().toLowerCase(),
        options: {
          emailRedirectTo,
        },
      })

      if (error) {
        if (error.message?.includes('rate limit')) {
          throw new Error(
            'El proveedor de correo ha alcanzado el límite de envíos por hora. Puedes utilizar el "Acceso Rápido Demo" inferior para entrar inmediatamente.'
          )
        }
        throw error
      }

      setSubmittedEmail(data.email.trim().toLowerCase())
      setIsSuccess(true)
    } catch (err: any) {
      console.error('Error during login:', err)
      setErrorMessage(
        err.message ||
          'No se pudo enviar el enlace de acceso. Por favor, verifica tu conexión o intenta más tarde.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  // Quick Demo Access Handler
  const handleDemoLogin = async (role: 'admin' | 'commercial') => {
    setDemoLoading(role)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/auth/demo-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión demo')
      }

      router.push(redirectTo)
      router.refresh()
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión rápida de prueba')
      setDemoLoading(null)
    }
  }

  // Quick Demo Seed Handler
  const handleSeedDemoData = async () => {
    setSeedingLoading(true)
    setSeedNotice(null)
    setErrorMessage(null)

    try {
      const res = await fetch('/api/demo/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al poblar datos de prueba')
      }

      setSeedNotice(
        `✓ Datos demo cargados: ${data.gymsCount || 6} gimnasios, ${data.contactsCount || 6} contactos y pipeline listos.`
      )
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudieron sembrar los datos demo')
    } finally {
      setSeedingLoading(false)
    }
  }

  return (
    <Card className="shadow-2xl border-border/80 bg-white backdrop-blur-sm rounded-2xl overflow-hidden">
      <CardHeader className="space-y-3 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
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
          <CardDescription className="text-xs text-gray-500 mt-1">
            Plataforma de gestión comercial y operaciones interna
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-5">
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
                Revisa tu bandeja de entrada. Haz clic en el enlace para iniciar sesión.
              </p>
            </div>

            <div className="pt-4">
              <Button
                variant="outline"
                className="w-full text-xs rounded-xl"
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
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800 animate-in fade-in-50">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span className="flex-1 text-xs leading-normal">{errorMessage}</span>
              </div>
            )}

            {seedNotice && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 animate-in fade-in-50">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span className="flex-1 text-xs leading-normal">{seedNotice}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-gray-700">
                Correo corporativo
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@gymbooking.com"
                  className={`pl-9 text-sm rounded-xl ${errors.email ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                  disabled={isLoading || Boolean(demoLoading)}
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all h-10 rounded-xl"
              disabled={isLoading || Boolean(demoLoading)}
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

        {/* DEMO / QUICK ACCESS SECTION */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Acceso Rápido de Prueba
            </span>
            <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600 border-slate-200">
              Sin email
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('admin')}
              disabled={Boolean(demoLoading) || isLoading}
              className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-blue-600">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  Administrador
                </span>
                {demoLoading === 'admin' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">Control total y ajustes</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => handleDemoLogin('commercial')}
              disabled={Boolean(demoLoading) || isLoading}
              className="h-auto py-2.5 px-3 flex flex-col items-start text-left border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 rounded-xl transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-emerald-600">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  Comercial
                </span>
                {demoLoading === 'commercial' ? (
                  <Loader2 className="w-3 h-3 animate-spin text-emerald-600" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                )}
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5">Pipeline y acuerdos</span>
            </Button>
          </div>

          {/* Direct Demo Data Seeder Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleSeedDemoData}
              disabled={seedingLoading}
              className="w-full text-[11px] font-medium text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 py-1.5 px-2.5 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {seedingLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              ) : (
                <Database className="w-3 h-3 text-slate-500" />
              )}
              {seedingLoading ? 'Poblando base de datos...' : 'Cargar datos iniciales de demostración (Gimnasios)'}
            </button>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col border-t border-slate-100 bg-slate-50/50 p-4 text-center rounded-b-2xl">
        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <Shield className="h-3.5 w-3.5 text-gray-400" />
          <span>Acceso seguro protegido para el equipo de GymBooking.</span>
        </div>
      </CardFooter>
    </Card>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full p-8 text-center bg-white shadow-xl rounded-2xl">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-500 mt-3">Cargando acceso...</p>
        </Card>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
