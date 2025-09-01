import { NextRequest } from 'next/server'
import { withErrorHandler, ErrorStatsCollector } from '@/lib/error-handler'
import { success } from '@/lib/api-response'

async function handleGET(request: NextRequest) {
  // 取得時間範圍參數
  const url = new URL(request.url)
  const timeRangeParam = url.searchParams.get('timeRange') || '24h'
  
  // 計算時間範圍（毫秒）
  const timeRangeMs = {
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
      features: [
        '自動錯誤收集',
        '智能警報系統',
        '錯誤模式分析',
        '趨勢追蹤',
        '自動清理過期資料'
      ]
    }
  }

  return success(responseData, '錯誤統計資料取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'AdminErrorStats',
  enableAuditLog: true
})