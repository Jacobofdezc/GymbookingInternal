import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { CalendarClient, CalendarEvent } from '@/components/calendar/CalendarClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Calendario',
  description: 'Calendario de actividades, tareas y seguimientos comerciales en GymBooking',
}

export default async function CalendarPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch tasks with due_date
  const tasksPromise = supabase
    .from('tasks')
    .select('id, title, due_date, priority, status, gym_id, gym:gyms(id, name)')
    .eq('organization_id', user.organization_id)
    .not('due_date', 'is', null)

  // Fetch gyms with next_followup_date
  const gymsPromise = supabase
    .from('gyms')
    .select('id, name, next_followup_date, next_action')
    .eq('organization_id', user.organization_id)
    .not('next_followup_date', 'is', null)

  // Fetch interactions
  const interactionsPromise = supabase
    .from('interactions')
    .select('id, gym_id, interaction_date, type, summary, gym:gyms(id, name)')
    .eq('organization_id', user.organization_id)
    .order('interaction_date', { ascending: false })
    .limit(100)

  const [{ data: tasks }, { data: gyms }, { data: interactions }] =
    await Promise.all([tasksPromise, gymsPromise, interactionsPromise])

  const events: CalendarEvent[] = []

  // Add tasks
  tasks?.forEach((task) => {
    if (!task.due_date) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gymObj = task.gym as any
    events.push({
      id: `task-${task.id}`,
      type: 'task',
      title: task.title,
      date: task.due_date.split('T')[0],
      gymId: task.gym_id,
      gymName: gymObj?.name || null,
      link: task.gym_id ? `/gyms/${task.gym_id}` : '/tasks',
      priority: task.priority,
      status: task.status,
    })
  })

  // Add gym followups
  gyms?.forEach((gym) => {
    if (!gym.next_followup_date) return
    events.push({
      id: `followup-${gym.id}`,
      type: 'followup',
      title: gym.next_action ? `Seguimiento: ${gym.next_action}` : `Seguimiento: ${gym.name}`,
      date: gym.next_followup_date.split('T')[0],
      gymId: gym.id,
      gymName: gym.name,
      link: `/gyms/${gym.id}`,
    })
  })

  // Add interactions
  interactions?.forEach((inter) => {
    if (!inter.interaction_date) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gymObj = inter.gym as any
    events.push({
      id: `interaction-${inter.id}`,
      type: 'interaction',
      title: inter.summary || `Interacción (${inter.type})`,
      date: inter.interaction_date.split('T')[0],
      gymId: inter.gym_id,
      gymName: gymObj?.name || null,
      link: `/gyms/${inter.gym_id}`,
    })
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <CalendarClient initialEvents={events} />
    </div>
  )
}
