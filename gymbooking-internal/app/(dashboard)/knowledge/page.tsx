import { requireAuth, canWrite } from '@/lib/auth/permissions'
import { getKnowledgePages } from '@/services/knowledge/knowledge.service'
import { KnowledgeListClient } from '@/components/knowledge/KnowledgeListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Base de Conocimiento',
  description: 'Documentación interna, procedimientos y decisiones de GymBooking',
}

export default async function KnowledgePage() {
  const user = await requireAuth()
  const pages = await getKnowledgePages()

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <KnowledgeListClient
        initialPages={pages}
        canWrite={canWrite(user.role)}
      />
    </div>
  )
}
