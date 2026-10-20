import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient, type DashboardStats } from '@/components/dashboard/DashboardClient'

export const metadata: Metadata = {
  title: 'Panel de Control',
  description: 'Panel general de GymBooking Internal CRM',
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const todayStr = new Date().toISOString().split('T')[0]
  const in7DaysDate = new Date()
  in7DaysDate.setDate(in7DaysDate.getDate() + 7)
  const in7DaysStr = in7DaysDate.toISOString().split('T')[0]

  // Execute queries in parallel
  const [
    gymsRes,
    overdueTasksRes,
    pendingTasksRes,
    openIssuesRes,
    tasksDueTodayRes,
    recentActivityRes,
  ] = await Promise.all([
    // 1. Gyms with statuses and owner
    supabase
      .from('gyms')
      .select(`
        id,
        name,
        city,
        next_followup_date,
        next_action,
        created_at,
        commercial_status:commercial_statuses ( id, name, slug, color ),
        onboarding_status:onboarding_statuses ( id, name, slug, color ),
        owner:profiles!gyms_owner_id_fkey ( id, full_name )
      `)
      .order('created_at', { ascending: false }),

    // 2. Overdue tasks count
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .lt('due_date', todayStr)
      .not('status', 'in', '("completed","cancelled")'),

    // 3. Pending tasks count
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("completed","cancelled")'),

    // 4. Open issues count
    supabase
      .from('issues')
      .select('id', { count: 'exact', head: true })
      .not('status', 'in', '("resolved","closed")'),

    // 5. Tasks due today
    supabase
      .from('tasks')
      .select(`
        id,
        title,
        priority,
        due_date,
        assignee:profiles!tasks_assignee_id_fkey ( id, full_name ),
        gym:gyms ( id, name )
      `)
      .eq('due_date', todayStr)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false }),

    // 6. Recent activity (last 20)
    supabase
      .from('audit_logs')
      .select(`
        id,
        action,
        entity_type,
        created_at,
        actor:profiles!audit_logs_actor_user_id_fkey ( id, full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const allGyms = (gymsRes.data as any[]) || []

  // Metrics
  const totalGyms = allGyms.length

  const inProcessCommercialSlugs = [
    'prospect',
    'identified',
    'pending_first_contact',
    'first_contact',
    'contacted',
    'waiting_response',
    'interested',
    'meeting_pending',
    'meeting_scheduled',
    'meeting_done',
    'negotiation',
    'negotiating',
    'verbal_confirmation',
    'agreement_pending',
    'proposal_sent',
  ]

  const confirmedCommercialSlugs = [
    'confirmed',
    'agreement_formalized',
    'verbal_confirmation',
    'agreement_pending',
  ]

  const commercialInProcessCount = allGyms.filter((g) =>
    g.commercial_status?.slug ? inProcessCommercialSlugs.includes(g.commercial_status.slug) : true
  ).length

  const confirmedGymsCount = allGyms.filter(
    (g) => g.commercial_status?.slug && confirmedCommercialSlugs.includes(g.commercial_status.slug)
  ).length

  const activeGymsCount = allGyms.filter(
    (g) => g.onboarding_status?.slug === 'active'
  ).length

  // Upcoming followups (next 7 days)
  const upcomingFollowups = allGyms
    .filter((g) => {
      if (!g.next_followup_date) return false
      return g.next_followup_date >= todayStr && g.next_followup_date <= in7DaysStr
    })
    .sort((a, b) => (a.next_followup_date > b.next_followup_date ? 1 : -1))
    .slice(0, 8)
    .map((g) => ({
      id: g.id,
      name: g.name,
      next_followup_date: g.next_followup_date,
      next_action: g.next_action,
      owner: g.owner,
    }))

  // Latest 5 gyms
  const latestGyms = allGyms.slice(0, 5).map((g) => ({
    id: g.id,
    name: g.name,
    city: g.city,
    created_at: g.created_at,
    commercial_status: g.commercial_status,
  }))

  const stats: DashboardStats = {
    totalGyms,
    commercialInProcessCount,
    confirmedGymsCount,
    activeGymsCount,
    overdueTasksCount: overdueTasksRes.count || 0,
    openIssuesCount: openIssuesRes.count || 0,
    pendingTasksCount: pendingTasksRes.count || 0,
    upcomingFollowups,
    tasksDueToday: (tasksDueTodayRes.data as any[]) || [],
    recentActivity: (recentActivityRes.data as any[]) || [],
    latestGyms,
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      <DashboardClient stats={stats} />
    </div>
  )
}
