/**
 * 單個審計日誌 API 路由
 * 處理個別審計日誌的刪除操作
 */

/**
 * @api {get} /api/audit-logs/:id 取得單個審計日誌詳情
 * @apiName GetAuditLogById
 * @apiGroup AuditLog
 * @apiPermission user
 *
 * @apiDescription 根據 ID 取得單個審計日誌的詳細資訊。僅限管理員和稽核人員使用
 *
 * @apiParam {String} id 審計日誌 ID
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 審計日誌詳細資料
 * @apiSuccess {String} data.id 日誌 ID
 * @apiSuccess {String} data.user_id 使用者 ID
 * @apiSuccess {String} data.user_email 使用者 Email
 * @apiSuccess {String} data.user_name 使用者名稱
 * @apiSuccess {String} data.user_role 使用者角色
 * @apiSuccess {String} data.action 操作類型
 * @apiSuccess {String} data.resource_type 資源類型
 * @apiSuccess {String} data.resource_id 資源 ID
 * @apiSuccess {Object} [data.previous_data] 變更前資料
 * @apiSuccess {Object} [data.new_data] 變更後資料
 * @apiSuccess {Object} [data.metadata] 額外資料
 * @apiSuccess {String} [data.ip_address] IP 地址
 * @apiSuccess {String} [data.user_agent] 使用者代理
 * @apiSuccess {String} data.created_at 建立時間
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "data": {
 *     "id": "log_123",
 *     "user_id": "user_456",
 *     "user_email": "admin@example.com",
 *     "user_name": "管理員",
 *     "user_role": "admin",
 *     "action": "update",
 *     "resource_type": "product",
 *     "resource_id": "prod_789",
 *     "previous_data": {"price": 100},
 *     "new_data": {"price": 120},
 *     "metadata": {"reason": "價格調整"},
 *     "ip_address": "192.168.1.1",
 *     "user_agent": "Mozilla/5.0...",
 *     "created_at": "2025-01-07T10:30:00.000Z"
 *   }
 * }
 *
 * @apiError (403) AuthorizationError 權限不足
 * @apiError (404) NotFoundError 找不到指定的審計日誌
 *
 * @apiErrorExample {json} 找不到日誌:
 * {
 *   "success": false,
 *   "message": "找不到指定的審計日誌",
 *   "error": {
 *     "code": "NOT_FOUND"
 *   }
 * }
 */

/**
 * @api {delete} /api/audit-logs/:id 刪除單個審計日誌
 * @apiName DeleteAuditLogById
 * @apiGroup AuditLog
 * @apiPermission admin
 *
 * @apiDescription 根據 ID 刪除單個審計日誌。僅限管理員使用，刪除操作會被記錄
 *
 * @apiParam {String} id 審計日誌 ID
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Null} data 空資料
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "審計日誌已成功刪除",
 *   "data": null
 * }
 *
 * @apiError (403) AuthorizationError 權限不足，僅限管理員
 * @apiError (404) NotFoundError 找不到指定的審計日誌
 *
 * @apiErrorExample {json} 權限不足:
 * {
 *   "success": false,
 *   "message": "權限不足，只有管理員可以刪除審計日誌",
 *   "error": {
 *     "code": "AUTHORIZATION_ERROR"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success, error as errorResponse } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { AuthorizationError, NotFoundError, ValidationError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { auditLogService } from '@/services/infrastructure/auditLogService'

// GET /api/audit-logs/[id] - 取得單個審計日誌詳情
async function handleGET(request: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params

  // 檢查權限（只有管理員和稽核人員可以查看審計日誌詳情）
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null; error: Error | null }

  if (!profile || !['admin', 'auditor'].includes(profile.role)) {
    throw new AuthorizationError('權限不足，只有管理員和稽核人員可以查看審計日誌')
  }

  // 取得審計日誌
  const { data: auditLog, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    apiLogger.error('取得審計日誌失敗', error as Error, {
      module: 'AuditLogDetailAPI',
      action: 'GET /api/audit-logs/[id]',
      metadata: { auditLogId: id },
    })
    throw new Error('取得審計日誌失敗')
  }

  if (!auditLog) {
    throw new NotFoundError('找不到指定的審計日誌')
  }

  apiLogger.info('取得審計日誌詳情成功', {
    module: 'AuditLogDetailAPI',
    action: 'GET /api/audit-logs/[id]',
    metadata: { auditLogId: id },
  })

  return success(auditLog)
}

export const GET = withAuthAndError(handleGET, { module: 'AuditLogDetailAPI' })

// DELETE /api/audit-logs/[id] - 刪除單個審計日誌
async function handleDELETE(request: NextRequest, user: User, context?: unknown) {
  const routeContext = context as { params: Promise<{ id: string }> } | undefined
  if (!routeContext?.params) {
    throw new ValidationError('缺少路由參數')
  }
  const { id } = await routeContext.params

  // 檢查權限（只有管理員可以刪除審計日誌）
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()) as { data: { role: string; name: string } | null; error: Error | null }

  if (!profile || profile.role !== 'admin') {
    throw new AuthorizationError('權限不足，只有管理員可以刪除審計日誌')
  }

  // 先取得要刪除的日誌資料（用於記錄刪除操作）
  const { data: auditLogToDelete, error: fetchError } = (await supabase
    .from('audit_logs')
    .select('*')
    .eq('id', id)
    .single()) as { data: Record<string, unknown> | null; error: Error | null }

  if (fetchError) {
    apiLogger.error('取得待刪除審計日誌失敗', fetchError, {
      module: 'AuditLogDetailAPI',
      action: 'DELETE /api/audit-logs/[id]',
      metadata: { auditLogId: id },
    })
    throw new NotFoundError('找不到指定的審計日誌')
  }

  if (!auditLogToDelete) {
    throw new NotFoundError('找不到指定的審計日誌')
  }

  // 執行刪除操作
  const { error: deleteError } = await supabase.from('audit_logs').delete().eq('id', id)

  if (deleteError) {
    apiLogger.error('刪除審計日誌失敗', deleteError, {
      module: 'AuditLogDetailAPI',
      action: 'DELETE /api/audit-logs/[id]',
      metadata: { auditLogId: id },
    })
    throw new Error('刪除審計日誌失敗')
  }

  // 記錄刪除操作的審計日誌
  await auditLogService
    .log({
      user_id: user.id,
      user_email: user.email || 'unknown@email.com',
      user_name: profile.name || 'Unknown',
      user_role: profile.role || 'Unknown',
      action: 'delete',
      resource_type: 'audit_log',
      resource_id: id,
      previous_data: auditLogToDelete,
      metadata: {
        deletion_reason: 'admin_manual_deletion',
        deleted_log_action: auditLogToDelete.action,
        deleted_log_resource: auditLogToDelete.resource_type,
        deleted_log_date: auditLogToDelete.created_at,
      },
      ip_address:
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      user_agent: request.headers.get('user-agent') || undefined,
    })
    .catch(error => {
      apiLogger.error('記錄刪除審計日誌操作失敗', error as Error, {
        module: 'AuditLogDetailAPI',
        action: 'DELETE /api/audit-logs/[id]',
      })
    }) // 不讓審計日誌記錄失敗影響主要操作

  apiLogger.info('刪除審計日誌成功', {
    module: 'AuditLogDetailAPI',
    action: 'DELETE /api/audit-logs/[id]',
    metadata: { auditLogId: id },
  })

  return success(null, '審計日誌已成功刪除')
}

export const DELETE = withAuthAndError(handleDELETE, {
  module: 'AuditLogDetailAPI',
  enableAuditLog: true,
})

// 處理其他不支援的 HTTP 方法
export async function POST() {
  return errorResponse('不支援的請求方法', 405)
}

export async function PUT() {
  return errorResponse('不支援的請求方法', 405)
}

export async function PATCH() {
  return errorResponse('不支援的請求方法', 405)
}
