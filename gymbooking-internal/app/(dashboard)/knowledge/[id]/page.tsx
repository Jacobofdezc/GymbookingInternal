import { notFound } from 'next/navigation'
import { requireAuth, canWrite } from '@/lib/auth/permissions'
import { getKnowledgePage } from '@/services/knowledge/knowledge.service'
import { KnowledgePage } from '@/components/knowledge/KnowledgePage'
import type { Metadata } from 'next'

export async function generateMetadata(props: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await props.params
  const page = await getKnowledgePage(id)

  return {
    title: page ? `${page.title} | Base de Conocimiento` : 'Artículo',
    description: page?.content?.slice(0, 160) || 'Artículo de la base de conocimiento',
  }
}

export default async function KnowledgeDetailPage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params
  const user = await requireAuth()

  const page = await getKnowledgePage(id)

  if (!page) {
    notFound()
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <KnowledgePage
        initialPage={page}
        userRole={user.role}
        currentUserId={user.id}
        canWrite={canWrite(user.role)}
      />
    </div>
  )
}
