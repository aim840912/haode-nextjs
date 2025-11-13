/**
 * @api {get} /api/metrics 取得系統指標
 * @apiName GetMetrics
 * @apiGroup System
 * @apiPermission public
 *
 * @apiDescription 取得系統健康狀況和業務指標
 *
 * @apiQuery {String} [timeRange=24h] 時間範圍 (1h/24h/7d)
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 系統指標資料
 * @apiSuccess {String} data.format 資料格式
 * @apiSuccess {String} data.timeRange 時間範圍
 * @apiSuccess {String} data.timestamp 時間戳記
 * @apiSuccess {Object} data.systemHealth 系統健康狀態
 * @apiSuccess {String} data.systemHealth.status 健康狀態 (healthy/degraded/down)
 * @apiSuccess {String} data.systemHealth.vercelAnalytics Vercel Analytics 狀態
 * @apiSuccess {String} data.systemHealth.customMetrics 自訂指標狀態
 * @apiSuccess {Object} data.systemHealth.errorTracking 錯誤追蹤資訊
 * @apiSuccess {String} data.systemHealth.errorTracking.status 錯誤追蹤狀態
 * @apiSuccess {String} data.systemHealth.errorTracking.provider 錯誤追蹤提供者
 * @apiSuccess {Object} data.metrics 業務指標摘要
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "success": true,
 *   "message": "系統指標取得成功",
 *   "data": {
 *     "format": "comprehensive",
 *     "timeRange": "24h",
 *     "timestamp": "2025-01-07T10:30:00.000Z",
 *     "systemHealth": {
 *       "status": "healthy",
 *       "vercelAnalytics": "active",
 *       "customMetrics": "collecting",
 *       "errorTracking": {
 *         "status": "active",
 *         "provider": "Sentry",
 *         "dashboardUrl": "https://sentry.io/organizations/[org]/issues/"
 *       },
 *       "timestamp": "2025-01-07T10:30:00.000Z"
 *     },
 *     "metrics": {
 *       "requests": {
 *         "total": 1250,
 *         "successful": 1200,
 *         "failed": 50
 *       },
 *       "performance": {
 *         "avgResponseTime": 125,
 *         "p95ResponseTime": 450
 *       }
 *     }
 *   }
 * }
 *
 * @apiErrorExample {json} 錯誤回應:
 * {
 *   "success": false,
 *   "message": "系統指標取得失敗",
 *   "error": {
 *     "code": "INTERNAL_SERVER_ERROR",
 *     "details": "無法取得指標資料"
 *   }
 * }
 */

import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { isErrorTrackingAvailable } from '@/lib/error-tracking'
import { withErrorHandler } from '@/lib/middleware/error-handler'

async function handleGET(request: NextRequest) {
  // 取得時間範圍參數
  const url = new URL(request.url)
  const timeRangeParam = url.searchParams.get('timeRange') || '24h'

  // 計算時間範圍（毫秒）
  const timeRangeMs =
    {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    }[timeRangeParam as '1h' | '24h' | '7d'] || 24 * 60 * 60 * 1000

  // 取得錯誤追蹤狀態
  const errorTrackingStatus: 'active' | 'inactive' = isErrorTrackingAvailable()
    ? 'active'
    : 'inactive'

  // 取得實際業務指標
  const { metrics } = await import('@/lib/metrics')
  const businessMetrics = metrics.getMetricsSummary(timeRangeMs)

  const responseData = {
    format: 'comprehensive',
    timeRange: timeRangeParam,
    timestamp: new Date().toISOString(),
    systemHealth: {
      status: 'healthy' as const,
      vercelAnalytics: process.env.NODE_ENV === 'production' ? 'active' : 'inactive',
      customMetrics: 'collecting',
      errorTracking: {
        status: errorTrackingStatus,
        provider: 'Sentry',
        dashboardUrl: process.env.NEXT_PUBLIC_SENTRY_DSN ? 'https://sentry.io' : 'Not configured',
        note: '詳細錯誤統計請查看 Sentry Dashboard',
      },
      timestamp: new Date().toISOString(),
    },
    metrics: businessMetrics,
  }

  return success(responseData, '系統指標取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'MetricsAPI',
  enableAuditLog: false,
})
