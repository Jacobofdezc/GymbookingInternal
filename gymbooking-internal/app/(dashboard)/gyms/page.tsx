import type { Metadata } from 'next'
import { GymListClient } from '@/components/gyms/GymListClient'

export const metadata: Metadata = {
  title: 'Gimnasios',
  description: 'Gestión y directorio de gimnasios en GymBooking Internal CRM',
}

export default function GymsPage() {
  return <GymListClient />
}
