import { createClient } from '@/lib/supabase/client'
import type { Tables, TablesInsert } from '@/types/database'

export type IssueRow = Tables<'issues'>
export type IssueInsert = TablesInsert<'issues'>
export type IssueComment = Tables<'issue_comments'>
export type IssueAttachment = Tables<'issue_attachments'>

export interface IssueWithDetails extends IssueRow {
  gym?: {
    id: string
    name: string
    city?: string | null
  } | null
  assignee?: {
    id: string
    full_name: string
    email: string
    avatar_url?: string | null
  } | null
  created_by_profile?: {
    id: string
    full_name: string
    email: string
  } | null
  comments?: Array<
    IssueComment & {
      created_by_profile?: {
        id: string
        full_name: string
        email: string
      } | null
    }
  >
  attachments?: IssueAttachment[]
  linked_tasks?: Array<{
    id: string
    title: string
    status: string
    priority: string
    due_date?: string | null
  }>
}

export async function getIssues(filters?: {
  status?: string
  priority?: string
  type?: string
  assignee_id?: string
  gym_id?: string
}): Promise<IssueWithDetails[]> {
  const supabase = createClient()

  let query = supabase
    .from('issues')
    .select(`
      *,
      gym:gyms ( id, name, city ),
      assignee:profiles!issues_assignee_id_fkey ( id, full_name, email, avatar_url ),
      created_by_profile:profiles!issues_created_by_fkey ( id, full_name, email )
    `)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'open_all') {
      query = query.not('status', 'in', '("resolved","closed")')
    } else {
      query = query.eq('status', filters.status as any)
    }
  }

  if (filters?.priority && filters.priority !== 'all') {
    query = query.eq('priority', filters.priority as any)
  }

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type as any)
  }

  if (filters?.assignee_id && filters.assignee_id !== 'all') {
    query = query.eq('assignee_id', filters.assignee_id)
  }

  if (filters?.gym_id && filters.gym_id !== 'all') {
    query = query.eq('gym_id', filters.gym_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching issues:', error)
    throw new Error(error.message)
  }

  return (data as any) || []
}

export async function getIssueById(id: string): Promise<IssueWithDetails | null> {
  const supabase = createClient()

  const { data: issue, error: issueError } = await supabase
    .from('issues')
    .select(`
      *,
      gym:gyms ( id, name, city ),
      assignee:profiles!issues_assignee_id_fkey ( id, full_name, email, avatar_url ),
      created_by_profile:profiles!issues_created_by_fkey ( id, full_name, email )
    `)
    .eq('id', id)
    .single()

  if (issueError || !issue) {
    return null
  }

  // Fetch comments
  const { data: comments } = await supabase
    .from('issue_comments')
    .select(`
      *,
      created_by_profile:profiles ( id, full_name, email )
    `)
    .eq('issue_id', id)
    .order('created_at', { ascending: true })

  // Fetch attachments
  const { data: attachments } = await supabase
    .from('issue_attachments')
    .select('*')
    .eq('issue_id', id)
    .order('created_at', { ascending: true })

  // Fetch linked tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, status, priority, due_date')
    .eq('issue_id', id)
    .order('created_at', { ascending: false })

  return {
    ...(issue as any),
    comments: (comments as any) || [],
    attachments: attachments || [],
    linked_tasks: tasks || [],
  }
}

export async function createIssue(data: IssueInsert): Promise<IssueRow> {
  const supabase = createClient()

  let orgId = data.organization_id
  let userId = data.created_by

  if (!orgId || !userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      if (!userId) userId = user.id
      if (!orgId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        if (profile) orgId = profile.organization_id
      }
    }
  }

  const payload: IssueInsert = {
    ...data,
    organization_id: orgId || data.organization_id,
    created_by: userId || data.created_by,
    gym_id: data.gym_id || null,
    assignee_id: data.assignee_id || null,
    due_date: data.due_date || null,
    description: data.description || null,
  }

  const { data: issue, error } = await supabase
    .from('issues')
    .insert(payload)
    .select()
    .single()

  if (error) {
    console.error('Error creating issue:', error)
    throw new Error(error.message)
  }

  return issue
}

export async function updateIssue(id: string, data: Partial<IssueInsert>): Promise<IssueRow> {
  const supabase = createClient()

  const payload: Partial<IssueInsert> = {
    ...data,
    updated_at: new Date().toISOString(),
  }

  if (data.status === 'resolved' && !data.resolved_at) {
    payload.resolved_at = new Date().toISOString()
  } else if (data.status && data.status !== 'resolved') {
    payload.resolved_at = null
  }

  const { data: issue, error } = await supabase
    .from('issues')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating issue:', error)
    throw new Error(error.message)
  }

  return issue
}

export async function addIssueComment(issueId: string, content: string): Promise<IssueComment> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data, error } = await supabase
    .from('issue_comments')
    .insert({
      issue_id: issueId,
      content,
      created_by: user?.id || null,
    })
    .select(`
      *,
      created_by_profile:profiles ( id, full_name, email )
    `)
    .single()

  if (error) {
    console.error('Error adding comment to issue:', error)
    throw new Error(error.message)
  }

  return data as any
}

export async function resolveIssue(id: string, solution: string): Promise<IssueRow> {
  return updateIssue(id, {
    status: 'resolved',
    solution_applied: solution,
    resolved_at: new Date().toISOString(),
  })
}
