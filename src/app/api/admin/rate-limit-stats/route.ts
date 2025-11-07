/**
 * Rate Limiting 統計 API 路由
 * 提供 rate limiting 監控數據給管理員儀表板
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { getRateLimitStats } from '@/services/infrastructure/rateLimitMonitoringService'

/**
 * @api {GET} /api/admin/rate-limit-stats 取得 Rate Limiting 統計
 * @apiName GetRateLimitStats
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得 rate limiting 的統計和監控資料。
 * 包含請求頻率、限制觸發次數、被封鎖的請求等資訊。
 *
 * @apiPermission admin
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data Rate limiting 統計資料
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "totalRequests": 50000,
 *     "blockedRequests": 120,
 *     "rateLimitHits": 150
 *   },
 *   "message": "Rate Limiting 統計數據取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} AuthorizationError 需要管理員權限
 */
async function handleGET(request: NextRequest, user: User & { isAdmin: true }) {
  apiLogger.info('管理員查詢 Rate Limiting 統計', {
    metadata: {
      userId: user.id,
      userEmail: user.email,
    },
  })

  // 取得 rate limiting 統計數據
  const stats = await getRateLimitStats()

  return success(stats, 'Rate Limiting 統計數據取得成功')
}

// 導出處理器 - 使用組合函數：權限檢查 + 錯誤處理
export const GET = withAdminAndError(handleGET, { module: 'RateLimitStatsAPI' })
