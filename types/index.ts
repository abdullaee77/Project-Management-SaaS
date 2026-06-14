export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  is_verified: boolean
  created_at: Date
}

export interface Workspace {
  id: string
  name: string
  slug: string
  logo?: string
  owner_id: string
  plan: string
  created_at: Date
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  description?: string
  color: string
  status: string
  created_by: string
  created_at: Date
}

export interface Task {
  id: string
  project_id: string
  workspace_id: string
  title: string
  description?: string
  status: string
  priority: string
  position: number
  due_date?: Date
  assignee_id?: string
  created_by: string
  created_at: Date
}

export interface Member {
  id: string
  workspace_id: string
  user_id: string
  role: string
  joined_at: Date
  name: string
  email: string
  avatar?: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  link?: string
  created_at: Date
}