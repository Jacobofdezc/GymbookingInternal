import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GymForm } from '@/components/gyms/GymForm'

interface EditGymPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: EditGymPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: gym } = await supabase.from('gyms').select('name').eq('id', id).single()

  return {
    title: gym ? `Editar ${gym.name}` : 'Editar Gimnasio',
  }
}

export default async function EditGymPage({ params }: EditGymPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: gym, error } = await supabase
    .from('gyms')
    .select(`
      *,
      disciplines:gym_disciplines(discipline:disciplines(*))
    `)
    .eq('id', id)
    .single()

  if (error || !gym) {
    notFound()
  }

  const flattenedDisciplines = (gym.disciplines || [])
    .map((item: any) => item.discipline)
    .filter(Boolean)

  const initialData = {
    ...gym,
    disciplines: flattenedDisciplines,
  }

  return <GymForm initialData={initialData} isEditing={true} />
}
