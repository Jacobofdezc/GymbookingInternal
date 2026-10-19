import type { Metadata } from 'next'
import { GymForm } from '@/components/gyms/GymForm'

export const metadata: Metadata = {
  title: 'Nuevo Gimnasio',
  description: 'Dar de alta un nuevo centro deportivo en GymBooking',
}

export default function NewGymPage() {
  return <GymForm isEditing={false} />
}
