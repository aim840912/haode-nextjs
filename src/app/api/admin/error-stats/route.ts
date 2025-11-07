import { NextRequest } from 'next/server'
import { success } from '@/lib/api-response'
import { withErrorHandler, ErrorStatsCollector } from '@/lib/middleware/error-handler'

/**
 * @api {GET} /api/admin/error-stats 取得錯誤統計資料
 * @apiName GetErrorStats
 * @apiGroup Admin
 * @apiVersion 1.0.0
 *
 * @apiDescription
 * 取得系統錯誤統計和分析資料，支援自定義時間範圍。
 * 包含錯誤趨勢、分類統計、智能警報等。
 *
 * @apiPermission public
 *
 * @apiQuery {String="1h","24h","7d"} [timeRange=24h] 時間範圍
 *
 * @apiSuccess {Boolean} success 請求是否成功
 * @apiSuccess {Object} data 錯誤統計資料
 * @apiSuccess {String} data.timeRange 時間範圍
 * @apiSuccess {Object} data.errorStats 錯誤統計摘要
 * @apiSuccess {Object} data.systemStats 詳細統計資料
 * @apiSuccess {Object} data.insights 系統洞察資訊
 * @apiSuccess {String} message 回應訊息
 *
 * @apiSuccessExample {json} 成功回應:
 * HTTP/1.1 200 OK
 * {
 *   "success": true,
 *   "data": {
 *     "timeRange": "24h",
 *     "timestamp": "2025-01-07T10:30:00Z",
 *     "errorStats": {...},
 *     "systemStats": {...},
 *     "insights": {
 *       "provider": "BuiltInErrorTracker",
 *       "features": ["自動錯誤收集", "智能警報系統"]
 *     }
 *   },
 *   "message": "錯誤統計資料取得成功"
 * }
 *
 * @apiError (錯誤 4xx) {Object} ValidationError 時間範圍參數無效
 */
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

  // 取得錯誤統計收集器實例
  const errorCollector = ErrorStatsCollector.getInstance()

  // 取得錯誤統計摘要
  const errorSummary = errorCollector.getErrorSummary(timeRangeMs)

  // 取得詳細統計資料
  const detailedStats = errorCollector.getDetailedStats()

  const responseData = {
    timeRange: timeRangeParam,
    timestamp: new Date().toISOString(),
    errorStats: errorSummary,
    systemStats: detailedStats,
    insights: {
      description: '內建錯誤追蹤系統',
      provider: 'BuiltInErrorTracker',
      features: ['自動錯誤收集', '智能警報系統', '錯誤模式分析', '趨勢追蹤', '自動清理過期資料'],
    },
  }

  return success(responseData, '錯誤統計資料取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'AdminErrorStats',
  enableAuditLog: true,
})
