/**
 * @api {get} /api/admin/dev-notes 取得開發備忘錄列表
 * @apiName GetDevNotes
 * @apiGroup AdminDevNotes
 * @apiPermission admin
 *
 * @apiDescription 取得開發備忘錄列表，支援類型、狀態和優先級篩選。僅限管理員使用
 *
 * @apiQuery {String} [type] 類型篩選 (bug/todo/feature/improvement)
 * @apiQuery {String} [status] 狀態篩選 (pending/in_progress/completed/cancelled)
 * @apiQuery {String} [priority] 優先級篩選 (low/medium/high/urgent)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object[]} data 開發備忘錄列表
 * @apiSuccess {String} data.id 備忘錄 ID
 * @apiSuccess {String} data.type 類型
 * @apiSuccess {String} data.status 狀態
 * @apiSuccess {String} data.priority 優先級
 * @apiSuccess {String} data.title 標題
 * @apiSuccess {String} data.content 內容
 * @apiSuccess {String} data.created_by 建立者 ID
 * @apiSuccess {String} data.created_at 建立時間
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "查詢成功",
 *   "data": [
 *     {
 *       "id": "note_123",
 *       "type": "bug",
 *       "status": "pending",
 *       "priority": "high",
 *       "title": "修復產品價格顯示問題",
 *       "content": "產品價格在某些情況下顯示不正確",
 *       "created_by": "admin_456",
 *       "created_at": "2025-01-07T10:30:00.000Z"
 *     }
 *   ]
 * }
 */

/**
 * @api {post} /api/admin/dev-notes 建立開發備忘錄
 * @apiName CreateDevNote
 * @apiGroup AdminDevNotes
 * @apiPermission admin
 *
 * @apiDescription 建立新的開發備忘錄。僅限管理員使用
 *
 * @apiBody {String} type 類型 (bug/todo/feature/improvement)
 * @apiBody {String} status 狀態 (pending/in_progress/completed/cancelled)
 * @apiBody {String} priority 優先級 (low/medium/high/urgent)
 * @apiBody {String} title 標題
 * @apiBody {String} content 內容
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 建立的開發備忘錄
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "建立成功",
 *   "data": {
 *     "id": "note_123",
 *     "type": "bug",
 *     "status": "pending",
 *     "priority": "high",
 *     "title": "修復產品價格顯示問題",
 *     "content": "產品價格在某些情況下顯示不正確",
 *     "created_by": "admin_456",
 *     "created_at": "2025-01-07T10:30:00.000Z"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success, created } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { DevNoteInput } from '@/types/devNote'

async function handleGET(request: NextRequest, _user: User) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type')
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')

  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('dev_notes')
    .select('*')
    .order('created_at', { ascending: false })

  if (type) query = query.eq('type', type)
  if (status) query = query.eq('status', status)
  if (priority) query = query.eq('priority', priority)

  const { data, error } = await query

  if (error) throw error

  return success(data, '查詢成功')
}

async function handlePOST(request: NextRequest, user: User) {
  const body: DevNoteInput = await request.json()

  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('dev_notes')
    .insert({
      ...body,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) throw error

  return created(data, '建立成功')
}

export const GET = withAdminAndError(handleGET, {
  module: 'DevNotesAPI',
  enableAuditLog: false,
})

export const POST = withAdminAndError(handlePOST, {
  module: 'DevNotesAPI',
  enableAuditLog: true,
})
