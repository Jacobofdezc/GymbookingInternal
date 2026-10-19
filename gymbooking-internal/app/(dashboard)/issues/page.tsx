import type { Metadata } from 'next'
import { IssueListClient } from '@/components/issues/IssueListClient'

export const metadata: Metadata = {
  title: 'Incidencias',
  description: 'Gestión y resolución de incidencias en GymBooking',
}

export default function IssuesPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      <IssueListClient />
    </div>
  )
}
