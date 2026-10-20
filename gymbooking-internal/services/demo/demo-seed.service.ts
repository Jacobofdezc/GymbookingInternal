export interface SeedResult {
  gymsCount: number
  contactsCount: number
  tasksCount: number
  interactionsCount: number
  issuesCount: number
  message?: string
}

/**
 * Seeds a realistic set of Spanish gyms, contacts, pipeline stages,
 * tasks, and issues into the active organization.
 */
export async function seedDemoDataForOrganization(): Promise<SeedResult> {
  const res = await fetch('/api/demo/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'Error al cargar datos de demostración')
  }

  return {
    gymsCount: data.gymsCount || 6,
    contactsCount: data.contactsCount || 6,
    tasksCount: data.tasksCount || 6,
    interactionsCount: data.interactionsCount || 6,
    issuesCount: data.issuesCount || 2,
    message: data.message,
  }
}
