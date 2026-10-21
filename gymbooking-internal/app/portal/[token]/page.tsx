import React from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { PortalClient } from '@/components/portal/PortalClient'
import Link from 'next/link'
import Image from 'next/image'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PortalPageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token: gymId } = await params

  // 0. Quick check for valid UUID format to avoid Postgres invalid UUID error
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gymId)
  if (!isUuid) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="Gymbooking"
              width={140}
              height={30}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="Gymbooking"
              width={140}
              height={30}
              className="h-7 w-auto hidden dark:block"
            />
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Portal no encontrado
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            El enlace de incorporación no es válido o ha expirado. Por favor, solicita a tu gestor de GymBooking un nuevo enlace de acceso.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/">Volver a GymBooking</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const adminSupabase = await createAdminClient()

  // 1. Fetch gym with owner / onboarding owner
  const { data: gym, error: gymError } = await adminSupabase
    .from('gyms')
    .select(`
      id,
      name,
      legal_name,
      description,
      city,
      address,
      phone,
      email,
      website,
      instagram,
      onboarding_status:onboarding_statuses(id, name, slug, color),
      owner:profiles!gyms_owner_id_fkey(id, full_name, email, avatar_url),
      onboarding_owner:profiles!gyms_onboarding_owner_id_fkey(id, full_name, email, avatar_url)
    `)
    .eq('id', gymId)
    .single()

  if (gymError || !gym) {
    if (gymError) {
      console.error('Portal gym lookup error:', gymError)
    }
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="flex justify-center mb-2">
            <Image
              src="/logo.png"
              alt="Gymbooking"
              width={140}
              height={30}
              className="h-7 w-auto dark:hidden"
            />
            <Image
              src="/logo-dark.png"
              alt="Gymbooking"
              width={140}
              height={30}
              className="h-7 w-auto hidden dark:block"
            />
          </div>
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <AlertCircle className="h-7 w-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Portal no encontrado
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            El enlace de incorporación no es válido o ha expirado. Por favor, solicita a tu gestor de GymBooking un nuevo enlace de acceso.
          </p>
          <div className="pt-2">
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/">Volver a GymBooking</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // 2. Fetch onboarding checklist items
  const { data: onboardingItems } = await adminSupabase
    .from('gym_onboarding_items')
    .select('*')
    .eq('gym_id', gym.id)
    .order('sort_order', { ascending: true })

  // 3. Fetch uploaded documents
  const { data: documents } = await adminSupabase
    .from('documents')
    .select('*')
    .eq('gym_id', gym.id)
    .order('created_at', { ascending: false })

  // 4. Fetch classes with schedules and disciplines
  const { data: classes } = await adminSupabase
    .from('classes')
    .select(`
      id,
      name,
      description,
      level,
      capacity,
      price,
      duration_minutes,
      publication_status,
      discipline:disciplines(id, name),
      class_schedules(id, day_of_week, start_time, end_time, is_active)
    `)
    .eq('gym_id', gym.id)
    .order('name', { ascending: true })

  const advisorRaw = (gym as any).onboarding_owner || (gym as any).owner
  const advisor = {
    full_name: advisorRaw?.full_name || 'Equipo de Operaciones GymBooking',
    email: advisorRaw?.email || 'soporte@gymbooking.app',
    phone: '+34 600 000 000',
    avatar_url: advisorRaw?.avatar_url || null,
  }

  return (
    <PortalClient
      gym={gym as any}
      advisor={advisor}
      initialChecklist={onboardingItems || []}
      initialDocuments={documents || []}
      initialClasses={(classes as any) || []}
    />
  )
}
