/**
 * @api {get} /api/admin/dev-notes/:id 取得單個開發備忘錄
 * @apiName GetDevNoteById
 * @apiGroup AdminDevNotes
 * @apiPermission admin
 * @apiParam {String} id 備忘錄 ID
 */

/**
 * @api {patch} /api/admin/dev-notes/:id 更新開發備忘錄
 * @apiName UpdateDevNote
 * @apiGroup AdminDevNotes
 * @apiPermission admin
 * @apiParam {String} id 備忘錄 ID
 * @apiBody {String} [type] 類型
 * @apiBody {String} [status] 狀態
 * @apiBody {String} [priority] 優先級
 * @apiBody {String} [title] 標題
 * @apiBody {String} [content] 內容
 */

/**
 * @api {delete} /api/admin/dev-notes/:id 刪除開發備忘錄
 * @apiName DeleteDevNote
 * @apiGroup AdminDevNotes
 * @apiPermission admin
 * @apiParam {String} id 備忘錄 ID
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError } from '@/lib/errors'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { DevNoteUpdate } from '@/types/devNote'

async function handleGET(request: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params
  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('dev_notes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error

  return success(data, '查詢成功')
}

async function handlePATCH(request: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params
  const body: DevNoteUpdate = await request.json()

  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('dev_notes')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  return success(data, '更新成功')
}

async function handleDELETE(request: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params
  const supabase = await createServerSupabaseClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from('dev_notes').delete().eq('id', id)

  if (error) throw error

  return success(null, '刪除成功')
}

export const GET = withAdminAndError(handleGET, { module: 'DevNoteAPI' })
export const PATCH = withAdminAndError(handlePATCH, {
  module: 'DevNoteAPI',
  enableAuditLog: true,
})
export const DELETE = withAdminAndError(handleDELETE, {
  module: 'DevNoteAPI',
  enableAuditLog: true,
})
