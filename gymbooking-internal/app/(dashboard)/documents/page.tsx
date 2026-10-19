import { requireAuth } from '@/lib/auth/server'
import { createClient } from '@/lib/supabase/server'
import { getDocuments } from '@/services/documents/document.service'
import { DocumentListClient } from '@/components/documents/DocumentListClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentos',
  description: 'Gestión de documentos, acuerdos y archivos de GymBooking',
}

export default async function DocumentsPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  // Fetch initial documents and gym options
  const [documents, { data: gyms }] = await Promise.all([
    getDocuments(undefined, supabase),
    supabase
      .from('gyms')
      .select('id, name')
      .eq('organization_id', user.organization_id)
      .order('name'),
  ])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <DocumentListClient
        initialDocuments={documents}
        userRole={user.role}
        userOrgId={user.organization_id}
        currentUserId={user.id}
        gyms={gyms || []}
      />
    </div>
  )
}
