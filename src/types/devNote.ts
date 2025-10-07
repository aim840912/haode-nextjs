/**
 * 開發筆記類型定義
 */

export type DevNoteType = 'bug' | 'todo' | 'feature' | 'improvement'
export type DevNotePriority = 'low' | 'medium' | 'high' | 'urgent'
export type DevNoteStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface DevNote {
  id: string
  title: string
  description: string | null
  type: DevNoteType
  priority: DevNotePriority
  status: DevNoteStatus
  tags: string[] | null
  assigned_to: string | null
  created_by: string
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface DevNoteWithUser extends DevNote {
  creator_name?: string
  assignee_name?: string
}

export interface DevNoteInput {
  title: string
  description?: string
  type: DevNoteType
  priority?: DevNotePriority
  status?: DevNoteStatus
  tags?: string[]
  assigned_to?: string
}

export interface DevNoteUpdate {
  title?: string
  description?: string
  type?: DevNoteType
  priority?: DevNotePriority
  status?: DevNoteStatus
  tags?: string[]
  assigned_to?: string
  completed_at?: string | null
}

export interface DevNoteStats {
  total: number
  pending: number
  in_progress: number
  completed: number
  cancelled: number
  by_type: {
    bug: number
    todo: number
    feature: number
    improvement: number
  }
  by_priority: {
    low: number
    medium: number
    high: number
    urgent: number
  }
}
