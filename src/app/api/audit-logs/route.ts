/**
 * 審計日誌 API 路由
 * 處理審計日誌的查詢和統計
 */

/**
 * @api {get} /api/audit-logs 取得審計日誌列表
 * @apiName GetAuditLogs
 * @apiGroup AuditLog
 * @apiPermission user
 *
 * @apiDescription 查詢審計日誌列表，支援多種篩選條件。僅限管理員和稽核人員使用
 *
 * @apiQuery {String} [user_id] 使用者 ID 篩選
 * @apiQuery {String} [user_email] 使用者 Email 篩選
 * @apiQuery {String} [user_role] 使用者角色篩選 (admin/auditor/user)
 * @apiQuery {String} [action] 操作類型篩選 (create/read/update/delete/export)
 * @apiQuery {String} [resource_type] 資源類型篩選 (product/order/inquiry/location/user)
 * @apiQuery {String} [resource_id] 資源 ID 篩選
 * @apiQuery {String} [start_date] 開始日期（ISO 8601 格式）
 * @apiQuery {String} [end_date] 結束日期（ISO 8601 格式）
 * @apiQuery {String} [ip_address] IP 地址篩選
 * @apiQuery {Number} [limit=50] 每頁筆數（最大 100）
 * @apiQuery {Number} [offset=0] 偏移量（分頁用）
 * @apiQuery {String} [sort_by=created_at] 排序欄位 (created_at/user_email/action)
 * @apiQuery {String} [sort_order=desc] 排序方向 (asc/desc)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 審計日誌資料
 * @apiSuccess {Object[]} data.logs 日誌列表
 * @apiSuccess {String} data.logs.id 日誌 ID
 * @apiSuccess {String} data.logs.user_id 使用者 ID
 * @apiSuccess {String} data.logs.user_email 使用者 Email
 * @apiSuccess {String} data.logs.user_name 使用者名稱
 * @apiSuccess {String} data.logs.user_role 使用者角色
 * @apiSuccess {String} data.logs.action 操作類型
 * @apiSuccess {String} data.logs.resource_type 資源類型
 * @apiSuccess {String} data.logs.resource_id 資源 ID
 * @apiSuccess {Object} [data.logs.metadata] 額外資料
 * @apiSuccess {String} data.logs.created_at 建立時間
 * @apiSuccess {Number} data.total 總筆數
 * @apiSuccess {Number} data.limit 每頁筆數
 * @apiSuccess {Number} data.offset 當前偏移量
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "審計日誌查詢成功",
 *   "data": {
 *     "logs": [
 *       {
 *         "id": "log_123",
 *         "user_id": "user_456",
 *         "user_email": "admin@example.com",
 *         "user_name": "管理員",
 *         "user_role": "admin",
 *         "action": "update",
 *         "resource_type": "product",
 *         "resource_id": "prod_789",
 *         "metadata": {
 *           "changes": {"price": {"old": 100, "new": 120}}
 *         },
 *         "ip_address": "192.168.1.1",
 *         "created_at": "2025-01-07T10:30:00.000Z"
 *       }
 *     ],
 *     "total": 100,
 *     "limit": 50,
 *     "offset": 0
 *   }
 * }
 *
 * @apiError (403) AuthorizationError 權限不足，僅限管理員和稽核人員
 *
 * @apiErrorExample {json} 權限不足:
 * {
 *   "success": false,
 *   "message": "權限不足，只有管理員和稽核人員可以查看審計日誌",
 *   "error": {
 *     "code": "AUTHORIZATION_ERROR"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { AuthorizationError, MethodNotAllowedError } from '@/lib/errors'
import { withAuthAndError, User } from '@/lib/middleware/api-middleware'
import { auditLogService } from '@/services/infrastructure/auditLogService'
import { AuditLogQueryParams, AuditAction, ResourceType, UserRole } from '@/types/audit'

// GET /api/audit-logs - 取得審計日誌清單
async function handleGET(request: NextRequest, user: User) {
  // 檢查權限（只有管理員和稽核人員可以查看審計日誌）
  const supabase = await createServerSupabaseClient()
  const { data: profile } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null; error: Error | null }

  if (!profile || !['admin', 'auditor'].includes(profile.role)) {
    throw new AuthorizationError('權限不足，只有管理員和稽核人員可以查看審計日誌')
  }

  // 解析查詢參數
  const { searchParams } = new URL(request.url)
  const queryParams: AuditLogQueryParams = {
    user_id: searchParams.get('user_id') || undefined,
    user_email: searchParams.get('user_email') || undefined,
    user_role: (searchParams.get('user_role') as UserRole) || undefined,
    action: (searchParams.get('action') as AuditAction) || undefined,
    resource_type: (searchParams.get('resource_type') as ResourceType) || undefined,
    resource_id: searchParams.get('resource_id') || undefined,
    start_date: searchParams.get('start_date') || undefined,
    end_date: searchParams.get('end_date') || undefined,
    ip_address: searchParams.get('ip_address') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
    offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    sort_by:
      (searchParams.get('sort_by') as 'created_at' | 'user_email' | 'action') || 'created_at',
    sort_order: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  }

  // 取得審計日誌
  const auditLogs = await auditLogService.getAuditLogs(queryParams)

  return success(auditLogs, '審計日誌查詢成功')
}

// 導出 API 處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'AuditLogsAPI' })

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethods(): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const POST = withAuthAndError(handleUnsupportedMethods, { module: 'AuditLogsAPI' })
export const PUT = withAuthAndError(handleUnsupportedMethods, { module: 'AuditLogsAPI' })
export const DELETE = withAuthAndError(handleUnsupportedMethods, { module: 'AuditLogsAPI' })
export const PATCH = withAuthAndError(handleUnsupportedMethods, { module: 'AuditLogsAPI' })
