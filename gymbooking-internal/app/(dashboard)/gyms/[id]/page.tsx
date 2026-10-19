import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GymDetailClient } from '@/components/gyms/GymDetailClient'
import type { FullGymDetail } from '@/services/gyms/gym.service'
import type { Discipline, Tag, GymContact } from '@/types/database'

interface GymDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: GymDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: gym } = await supabase.from('gyms').select('name, city').eq('id', id).single()

  return {
    title: gym ? `${gym.name} ${gym.city ? `(${gym.city})` : ''}` : 'Detalle de Gimnasio',
    description: `Ficha técnica, historial e información operativa de ${gym?.name || 'gimnasio'}`,
  }
}

export default async function GymDetailPage({ params }: GymDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch gym
  const { data: gym, error } = await supabase
    .from('gyms')
    .select(`
      *,
      commercial_status:commercial_statuses(*),
      onboarding_status:onboarding_statuses(*),
      owner:profiles!gyms_owner_id_fkey(*),
      onboarding_owner:profiles!gyms_onboarding_owner_id_fkey(*)
    `)
    .eq('id', id)
    .single()

  if (error || !gym) {
    notFound()
  }

  // 2. Fetch relations in parallel
  const [
    contactsRes,
    disciplinesRes,
    tagsRes,
    interactionsRes,
    tasksRes,
    docsRes,
    onbRes,
    classesRes,
  ] = await Promise.all([
    supabase
      .from('gym_contacts')
      .select('*')
      .eq('gym_id', id)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),

    supabase
      .from('gym_disciplines')
      .select('discipline:disciplines(*)')
      .eq('gym_id', id),

    supabase
      .from('gym_tags')
      .select('tag:tags(*)')
      .eq('gym_id', id),

    supabase
      .from('interactions')
      .select(`
        *,
        registered_by_user:profiles!interactions_registered_by_fkey(id, full_name, avatar_url),
        contact:gym_contacts(*)
      `)
      .eq('gym_id', id)
      .order('interaction_date', { ascending: false }),

    supabase
      .from('tasks')
      .select(`
        *,
        assignee:profiles!tasks_assignee_id_fkey(id, full_name, avatar_url)
      `)
      .eq('gym_id', id)
      .order('due_date', { ascending: true }),

    supabase
      .from('documents')
      .select('*')
      .eq('gym_id', id)
      .order('created_at', { ascending: false }),

    supabase
      .from('gym_onboarding_items')
      .select('*')
      .eq('gym_id', id)
      .order('sort_order', { ascending: true }),

    supabase
      .from('classes')
      .select('*, discipline:disciplines(*)')
      .eq('gym_id', id)
      .order('name', { ascending: true }),
  ])

  const disciplines = (disciplinesRes.data || [])
    .map((item: any) => item.discipline)
    .filter(Boolean) as Discipline[]

  const tags = (tagsRes.data || [])
    .map((item: any) => item.tag)
    .filter(Boolean) as Tag[]

  const fullGym: FullGymDetail = {
    ...gym,
    commercial_status: (gym as any).commercial_status || null,
    onboarding_status: (gym as any).onboarding_status || null,
    owner: (gym as any).owner || null,
    onboarding_owner: (gym as any).onboarding_owner || null,
    gym_contacts: (contactsRes.data || []) as GymContact[],
    disciplines,
    tags,
    interactions: (interactionsRes.data || []) as any,
    tasks: (tasksRes.data || []) as any,
    documents: (docsRes.data || []) as any,
    gym_onboarding_items: (onbRes.data || []) as any,
    classes: (classesRes.data || []) as any,
  }

  return <GymDetailClient initialGym={fullGym} />
}
