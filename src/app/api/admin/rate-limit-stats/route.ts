/**
 * Rate Limiting 統計 API 路由
 * 提供 rate limiting 監控數據給管理員儀表板
 */

import { NextRequest } from 'next/server'
import { requireAdmin, User } from '@/lib/api-middleware'
import { success } from '@/lib/api-response'
import { getRateLimitStats } from '@/services/rateLimitMonitoringService'
import { apiLogger } from '@/lib/logger'

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

// 導出處理器 - 需要管理員權限
export const GET = requireAdmin(handleGET)
