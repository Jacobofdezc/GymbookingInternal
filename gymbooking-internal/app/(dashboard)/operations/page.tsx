import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { OperationsClient } from '@/components/operations/OperationsClient'

export const metadata: Metadata = {
  title: 'Operaciones',
  description: 'Centro de incorporación, checklist y gestión de clases de gimnasios',
}

export default async function OperationsPage() {
  const supabase = await createClient()

  // Fetch gyms with their commercial and onboarding statuses
  const { data: gyms } = await supabase
    .from('gyms')
    .select(`
      id,
      name,
      city,
      commercial_status:commercial_statuses ( name, slug, color ),
      onboarding_status:onboarding_statuses ( name, slug, color )
    `)
    .order('name', { ascending: true })

  const allGyms = (gyms as any) || []

  // Confirmed or active or undergoing onboarding
  // If commercial status is 'confirmed' or has onboarding progress
  const confirmedGyms = allGyms.filter(
    (g: any) =>
      g.commercial_status?.slug === 'confirmed' ||
      (g.onboarding_status?.slug && g.onboarding_status.slug !== 'not_started')
  )

  // Fallback to all gyms if no gyms have confirmed status yet
  const displayedGyms = confirmedGyms.length > 0 ? confirmedGyms : allGyms

  // Calculate statistics
  const confirmedCount = allGyms.filter((g: any) => g.commercial_status?.slug === 'confirmed').length
  const pendingOnboardingCount = allGyms.filter(
    (g: any) =>
      g.onboarding_status?.slug &&
      !['active', 'not_started'].includes(g.onboarding_status.slug)
  ).length
  const activeCount = allGyms.filter((g: any) => g.onboarding_status?.slug === 'active').length

  const stats = {
    confirmedCount: confirmedCount || displayedGyms.length,
    pendingOnboardingCount,
    activeCount,
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      <OperationsClient
        confirmedGyms={displayedGyms.map((g: any) => ({
          id: g.id,
          name: g.name,
          city: g.city,
          commercial_status: g.commercial_status,
          onboarding_status: g.onboarding_status,
        }))}
        stats={stats}
      />
    </div>
  )
}
