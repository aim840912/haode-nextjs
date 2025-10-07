import { NextRequest } from 'next/server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { DevNoteStats, DevNoteType, DevNoteStatus, DevNotePriority } from '@/types/devNote'

interface NoteData {
  type: DevNoteType
  status: DevNoteStatus
  priority: DevNotePriority
}

async function handleGET(_request: NextRequest, _user: User) {
  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allNotes } = (await (supabase as any)
    .from('dev_notes')
    .select('type, status, priority')) as { data: NoteData[] | null }

  if (!allNotes) {
    return success(
      {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
        by_type: { bug: 0, todo: 0, feature: 0, improvement: 0 },
        by_priority: { low: 0, medium: 0, high: 0, urgent: 0 },
      } as DevNoteStats,
      '統計查詢成功'
    )
  }

  const stats: DevNoteStats = {
    total: allNotes.length,
    pending: allNotes.filter((n: NoteData) => n.status === 'pending').length,
    in_progress: allNotes.filter((n: NoteData) => n.status === 'in_progress').length,
    completed: allNotes.filter((n: NoteData) => n.status === 'completed').length,
    cancelled: allNotes.filter((n: NoteData) => n.status === 'cancelled').length,
    by_type: {
      bug: allNotes.filter((n: NoteData) => n.type === 'bug').length,
      todo: allNotes.filter((n: NoteData) => n.type === 'todo').length,
      feature: allNotes.filter((n: NoteData) => n.type === 'feature').length,
      improvement: allNotes.filter((n: NoteData) => n.type === 'improvement').length,
    },
    by_priority: {
      low: allNotes.filter((n: NoteData) => n.priority === 'low').length,
      medium: allNotes.filter((n: NoteData) => n.priority === 'medium').length,
      high: allNotes.filter((n: NoteData) => n.priority === 'high').length,
      urgent: allNotes.filter((n: NoteData) => n.priority === 'urgent').length,
    },
  }

  return success(stats, '統計查詢成功')
}

export const GET = withAdminAndError(handleGET, {
  module: 'DevNoteStatsAPI',
  enableAuditLog: false,
})
