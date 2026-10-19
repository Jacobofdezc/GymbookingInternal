import { createClient } from '@/lib/supabase/client'
import type { PriorityLevel, TaskStatus } from '@/types/database'

export interface TaskAssignee {
  id: string
  full_name: string
  email: string
  avatar_url: string | null
}

export interface TaskGym {
  id: string
  name: string
  city: string | null
}

export interface TaskWithRelations {
  id: string
  organization_id: string
  title: string
  description: string | null
  assignee_id: string | null
  priority: PriorityLevel
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  completed_by: string | null
  gym_id: string | null
  contact_id: string | null
  issue_id: string | null
  is_demo: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  assignee?: TaskAssignee | null
  creator?: {
    id: string
    full_name: string
    email: string
  } | null
  gym?: TaskGym | null
  tags?: { id: string; name: string; color: string | null }[]
}

export interface TaskInsert {
  id?: string
  organization_id?: string
  title: string
  description?: string | null
  assignee_id?: string | null
  priority?: PriorityLevel
  status?: TaskStatus
  due_date?: string | null
  completed_at?: string | null
  completed_by?: string | null
  gym_id?: string | null
  contact_id?: string | null
  issue_id?: string | null
  tags?: string[]
}

export interface TaskComment {
  id: string
  task_id: string
  content: string
  created_at: string
  created_by: string | null
  author?: {
    id: string
    full_name: string
    email: string
    avatar_url: string | null
  } | null
}

export interface TaskFilters {
  assignee_id?: string
  status?: string
  priority?: string
  gym_id?: string
  overdue?: boolean
  dueToday?: boolean
  dueThisWeek?: boolean
  unassigned?: boolean
  mine?: boolean
  search?: string
}

export async function getTasks(filters?: TaskFilters): Promise<TaskWithRelations[]> {
  const supabase = createClient()

  let query = supabase
    .from('tasks')
    .select(`
      id,
      organization_id,
      title,
      description,
      assignee_id,
      priority,
      status,
      due_date,
      completed_at,
      completed_by,
      gym_id,
      contact_id,
      issue_id,
      is_demo,
      created_at,
      updated_at,
      created_by,
      assignee:profiles!assignee_id(id, full_name, email, avatar_url),
      creator:profiles!created_by(id, full_name, email),
      gym:gyms!gym_id(id, name, city)
    `)

  const today = new Date().toISOString().split('T')[0]

  if (filters?.mine) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      query = query.eq('assignee_id', user.id)
    }
  } else if (filters?.unassigned) {
    query = query.is('assignee_id', null)
  } else if (filters?.assignee_id && filters.assignee_id !== 'all') {
    query = query.eq('assignee_id', filters.assignee_id)
  }

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status)
  }

  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority)
  }

  if (filters?.gym_id && filters.gym_id !== 'all') {
    query = query.eq('gym_id', filters.gym_id)
  }

  if (filters?.overdue) {
    query = query
      .lt('due_date', today)
      .neq('status', 'completed')
      .neq('status', 'cancelled')
  }

  if (filters?.dueToday) {
    query = query.eq('due_date', today)
  }

  if (filters?.dueThisWeek) {
    const now = new Date()
    const currentDay = now.getDay() // 0 = Sunday
    const distanceToMonday = (currentDay + 6) % 7
    const monday = new Date(now)
    monday.setDate(now.getDate() - distanceToMonday)
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    const startOfWeek = monday.toISOString().split('T')[0]
    const endOfWeek = sunday.toISOString().split('T')[0]

    query = query.gte('due_date', startOfWeek).lte('due_date', endOfWeek)
  }

  if (filters?.search && filters.search.trim()) {
    query = query.ilike('title', `%${filters.search.trim()}%`)
  }

  // Order: due date ascending, then newest
  query = query
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching tasks:', error)
    throw new Error(`Error al obtener tareas: ${error.message}`)
  }

  return (data || []) as unknown as TaskWithRelations[]
}

export async function createTask(data: TaskInsert): Promise<TaskWithRelations> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let orgId = data.organization_id

  if (!orgId) {
    // Lookup organization_id from user's profile or first organization
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()
      orgId = profile?.organization_id
    }

    if (!orgId) {
      const { data: org } = await supabase
        .from('organizations')
        .select('id')
        .limit(1)
        .single()
      orgId = org?.id
    }
  }

  if (!orgId) {
    throw new Error('No se encontró una organización activa para crear la tarea.')
  }

  const { tags, ...taskPayload } = data

  const insertPayload = {
    ...taskPayload,
    organization_id: orgId,
    created_by: user?.id || null,
    priority: taskPayload.priority || 'medium',
    status: taskPayload.status || 'pending',
  }

  const { data: created, error } = await supabase
    .from('tasks')
    .insert(insertPayload)
    .select(`
      id,
      organization_id,
      title,
      description,
      assignee_id,
      priority,
      status,
      due_date,
      completed_at,
      completed_by,
      gym_id,
      contact_id,
      issue_id,
      is_demo,
      created_at,
      updated_at,
      created_by,
      assignee:profiles!assignee_id(id, full_name, email, avatar_url),
      creator:profiles!created_by(id, full_name, email),
      gym:gyms!gym_id(id, name, city)
    `)
    .single()

  if (error) {
    console.error('Error creating task:', error)
    throw new Error(`Error al crear la tarea: ${error.message}`)
  }

  return created as unknown as TaskWithRelations
}

export async function updateTask(
  id: string,
  data: Partial<TaskInsert>
): Promise<TaskWithRelations> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { tags, ...updatePayload } = data
  const patch: Record<string, any> = { ...updatePayload, updated_at: new Date().toISOString() }

  if (data.status === 'completed') {
    patch.completed_at = data.completed_at || new Date().toISOString()
    patch.completed_by = user?.id || null
  } else if (data.status && data.status !== 'completed') {
    patch.completed_at = null
    patch.completed_by = null
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', id)
    .select(`
      id,
      organization_id,
      title,
      description,
      assignee_id,
      priority,
      status,
      due_date,
      completed_at,
      completed_by,
      gym_id,
      contact_id,
      issue_id,
      is_demo,
      created_at,
      updated_at,
      created_by,
      assignee:profiles!assignee_id(id, full_name, email, avatar_url),
      creator:profiles!created_by(id, full_name, email),
      gym:gyms!gym_id(id, name, city)
    `)
    .single()

  if (error) {
    console.error('Error updating task:', error)
    throw new Error(`Error al actualizar la tarea: ${error.message}`)
  }

  return updated as unknown as TaskWithRelations
}

export async function completeTask(id: string): Promise<TaskWithRelations> {
  return updateTask(id, { status: 'completed' })
}

export async function deleteTask(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) {
    console.error('Error deleting task:', error)
    throw new Error(`Error al eliminar la tarea: ${error.message}`)
  }
}

export async function addTaskComment(
  taskId: string,
  content: string
): Promise<TaskComment> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      content: content.trim(),
      created_by: user?.id || null,
    })
    .select(`
      id,
      task_id,
      content,
      created_at,
      created_by,
      author:profiles!created_by(id, full_name, email, avatar_url)
    `)
    .single()

  if (error) {
    console.error('Error adding task comment:', error)
    throw new Error(`Error al añadir comentario: ${error.message}`)
  }

  return data as unknown as TaskComment
}

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('task_comments')
    .select(`
      id,
      task_id,
      content,
      created_at,
      created_by,
      author:profiles!created_by(id, full_name, email, avatar_url)
    `)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching task comments:', error)
    throw new Error(`Error al obtener comentarios: ${error.message}`)
  }

  return (data || []) as unknown as TaskComment[]
}

// Helper to fetch team members for selects
export async function getTeamMembers(): Promise<TaskAssignee[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  if (error) {
    console.error('Error fetching team members:', error)
    return []
  }

  return (data || []) as TaskAssignee[]
}

// Helper to fetch gyms for selects
export async function getGymsForSelect(): Promise<TaskGym[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gyms')
    .select('id, name, city')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error fetching gyms for select:', error)
    return []
  }

  return (data || []) as TaskGym[]
}
