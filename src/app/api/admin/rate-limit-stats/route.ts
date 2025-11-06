/**
 * Rate Limiting 統計 API 路由
 * 提供 rate limiting 監控數據給管理員儀表板
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { apiLogger } from '@/lib/logger'
import { withAdminAndError, User } from '@/lib/middleware/api-middleware'
import { getRateLimitStats } from '@/services/infrastructure/rateLimitMonitoringService'

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
