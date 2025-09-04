import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { getHealthStatus } from '@/lib/error-handler'
import { isErrorTrackingAvailable } from '@/lib/error-tracking'

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

  // 取得系統健康稀況
  const healthStatus = getHealthStatus()

  // 取得錯誤追蹤狀態
  const errorTrackingStatus: 'available' | 'unavailable' = isErrorTrackingAvailable()
    ? 'available'
    : 'unavailable'

  // 取得實際業務指標
  const { metrics } = await import('@/lib/metrics')
  const businessMetrics = metrics.getMetricsSummary(timeRangeMs)

  // 取得實際錯誤統計
  const { ErrorStatsCollector } = await import('@/lib/error-handler')
  const errorStatsCollector = ErrorStatsCollector.getInstance()
  const errorSummary = errorStatsCollector.getErrorSummary(300000) as {
    total: number
    byStatus?: Record<number, number>
  } // 5分鐘內的錯誤

  const responseData = {
    format: 'comprehensive',
    timeRange: timeRangeParam,
    timestamp: new Date().toISOString(),
    systemHealth: {
      status: healthStatus.status,
      vercelAnalytics: process.env.NODE_ENV === 'production' ? 'active' : 'inactive',
      customMetrics: 'collecting',
      errorTracking: {
        status: errorTrackingStatus,
        last5Minutes: {
          total: errorSummary.total || 0,
          criticalErrors: errorSummary.byStatus?.[500] || 0,
        },
      },
      timestamp: healthStatus.timestamp,
    },
    metrics: businessMetrics,
  }

  return success(responseData, '系統指標取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'MetricsAPI',
  enableAuditLog: false,
})
