/**
 * 審計日誌統計 API 路由
 * 提供審計日誌的統計資訊
 */

/**
 * @api {get} /api/audit-logs/stats 取得審計日誌統計
 * @apiName GetAuditLogStats
 * @apiGroup AuditLog
 * @apiPermission user
 *
 * @apiDescription 取得審計日誌的統計資訊，支援多種統計類型。僅限管理員和稽核人員使用
 *
 * @apiQuery {Number} [days=30] 統計天數範圍（1-365）
 * @apiQuery {String} [type=overview] 統計類型 (overview/users/resources/actions)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 統計資料
 *
 * @apiSuccess (overview) {Object} data.audit_stats 操作統計（按日期和操作類型）
 * @apiSuccess (overview) {Object[]} data.user_stats 使用者活動統計（前 10 名）
 * @apiSuccess (overview) {Object[]} data.resource_stats 資源存取統計（前 10 個）
 * @apiSuccess (overview) {Object} data.summary 統計摘要
 * @apiSuccess (overview) {Number} data.summary.total_actions 總操作數
 * @apiSuccess (overview) {Number} data.summary.unique_users 獨立使用者數
 * @apiSuccess (overview) {Object} data.summary.most_active_day 最活躍的日期
 * @apiSuccess (overview) {Number} data.summary.sensitive_actions 敏感操作數（刪除、匯出、更新）
 *
 * @apiSuccess (users) {Object[]} data 使用者活動統計列表
 * @apiSuccess (users) {String} data.user_id 使用者 ID
 * @apiSuccess (users) {String} data.user_email 使用者 Email
 * @apiSuccess (users) {String} data.user_name 使用者名稱
 * @apiSuccess (users) {Number} data.action_count 操作次數
 *
 * @apiSuccess (resources) {Object[]} data 資源存取統計列表
 * @apiSuccess (resources) {String} data.resource_type 資源類型
 * @apiSuccess (resources) {String} data.resource_id 資源 ID
 * @apiSuccess (resources) {Number} data.access_count 存取次數
 *
 * @apiSuccess (actions) {Object[]} data 操作統計列表
 * @apiSuccess (actions) {String} data.action 操作類型
 * @apiSuccess (actions) {String} data.date 日期
 * @apiSuccess (actions) {Number} data.count 次數
 *
 * @apiSuccessExample {json} 綜合統計成功:
 * {
 *   "success": true,
 *   "message": "取得審計統計成功",
 *   "data": {
 *     "audit_stats": [
 *       {"action": "update", "date": "2025-01-07", "count": 45},
 *       {"action": "create", "date": "2025-01-07", "count": 32}
 *     ],
 *     "user_stats": [
 *       {
 *         "user_id": "user_123",
 *         "user_email": "admin@example.com",
 *         "user_name": "管理員",
 *         "action_count": 156
 *       }
 *     ],
 *     "resource_stats": [
 *       {
 *         "resource_type": "product",
 *         "resource_id": "prod_456",
 *         "access_count": 89
 *       }
 *     ],
 *     "summary": {
 *       "total_actions": 1250,
 *       "unique_users": 15,
 *       "most_active_day": {
 *         "date": "2025-01-07",
 *         "count": 125
 *       },
 *       "sensitive_actions": 45
 *     }
 *   }
 * }
 *
 * @apiError (400) ValidationError 查詢天數範圍無效或統計類型不支援
 * @apiError (403) AuthorizationError 權限不足，僅限管理員和稽核人員
 *
 * @apiErrorExample {json} 天數範圍錯誤:
 * {
 *   "success": false,
 *   "message": "查詢天數必須在 1-365 之間",
 *   "error": {
 *     "code": "VALIDATION_ERROR"
 *   }
 * }
 *
 * @apiErrorExample {json} 統計類型錯誤:
 * {
 *   "success": false,
 *   "message": "不支援的統計類型",
 *   "error": {
 *     "code": "VALIDATION_ERROR"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { createServerSupabaseClient } from '@/lib/database/supabase-server'
import { ValidationError, MethodNotAllowedError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { withAuthAndError } from '@/lib/middleware/api-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { auditStatsService } from '@/services/infrastructure/auditStatsService'

// GET /api/audit-logs/stats - 取得審計日誌統計
async function handleGET(request: NextRequest, user: { id: string; role?: string }) {
  apiLogger.info('開始查詢審計日誌統計', {
    module: 'AuditLogsStats',
    action: 'GET',
    metadata: { userId: user.id },
  })

  // 檢查權限（只有管理員和稽核人員可以查看審計日誌統計）
  const supabase = await createServerSupabaseClient()
  const { data: profile, error: profileError } = (await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()) as { data: { role: string } | null; error: Error | null }

  if (profileError) {
    apiLogger.error('查詢使用者資料失敗', profileError, {
      module: 'AuditLogsStats',
      action: 'GET',
      metadata: { userId: user.id },
    })
    throw new Error('無法驗證使用者資料')
  }

  if (!profile || !['admin', 'auditor'].includes(profile.role)) {
    apiLogger.warn('使用者嘗試存取審計統計但權限不足', {
      module: 'AuditLogsStats',
      action: 'GET',
      metadata: { userId: user.id, userRole: profile?.role },
    })
    throw new ValidationError('權限不足，只有管理員和稽核人員可以查看統計資訊')
  }

  // 解析查詢參數
  const { searchParams } = new URL(request.url)
  const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30
  const statsType = searchParams.get('type') || 'overview'

  if (days < 1 || days > 365) {
    throw new ValidationError('查詢天數必須在 1-365 之間')
  }

  let stats

  switch (statsType) {
    case 'overview':
      // 綜合統計
      const [auditStats, userStats, resourceStats] = await Promise.all([
        auditStatsService.getAuditStats({ days }),
        auditStatsService.getUserActivityStats({ days }),
        auditStatsService.getResourceAccessStats({ days }),
      ])

      stats = {
        audit_stats: auditStats,
        user_stats: userStats.slice(0, 10), // 只取前10名活躍用戶
        resource_stats: resourceStats.slice(0, 10), // 只取前10個熱門資源
        summary: {
          total_actions: auditStats.reduce((sum, stat) => sum + stat.count, 0),
          unique_users: new Set(userStats.map(stat => stat.user_id)).size,
          most_active_day: auditStats.reduce(
            (max, stat) => (stat.count > (max?.count || 0) ? stat : max),
            auditStats[0]
          ),
          sensitive_actions: auditStats
            .filter(stat => ['delete', 'export', 'update'].includes(stat.action))
            .reduce((sum, stat) => sum + stat.count, 0),
        },
      }
      break

    case 'users':
      // 使用者活動統計
      stats = await auditStatsService.getUserActivityStats({ days })
      break

    case 'resources':
      // 資源存取統計
      stats = await auditStatsService.getResourceAccessStats({ days })
      break

    case 'actions':
      // 動作統計
      stats = await auditStatsService.getAuditStats({ days })
      break

    default:
      throw new ValidationError('不支援的統計類型')
  }

  apiLogger.info('審計統計查詢成功', {
    module: 'AuditLogsStats',
    action: 'GET',
    metadata: {
      userId: user.id,
      statsType,
      days,
      resultCount: Array.isArray(stats) ? stats.length : Object.keys(stats).length,
    },
  })

  return success(stats, '取得審計統計成功')
}

// 導出使用組合函數的 GET 處理器：權限檢查 + 錯誤處理
export const GET = withAuthAndError(handleGET, { module: 'AuditLogsStatsAPI' })

// 處理其他不支援的 HTTP 方法
async function handleUnsupportedMethod(): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

export const POST = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const PUT = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const DELETE = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
export const PATCH = withErrorHandler(handleUnsupportedMethod, { module: 'AuditLogsStats' })
