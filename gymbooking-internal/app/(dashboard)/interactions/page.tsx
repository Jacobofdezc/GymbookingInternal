import type { Metadata } from 'next'
import { InteractionListClient } from '@/components/interactions/InteractionListClient'

export const metadata: Metadata = {
  title: 'Interacciones',
  description: 'Historial y registro de interacciones comerciales con gimnasios',
}

export default function InteractionsPage() {
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-7xl">
      <InteractionListClient />
    </div>
  )
}
