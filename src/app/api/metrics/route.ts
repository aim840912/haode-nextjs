import { NextRequest } from 'next/server'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { getHealthStatus } from '@/lib/error-handler'
import { isErrorTrackingAvailable } from '@/lib/error-tracking'
import { MetricsCollector } from '@/lib/metrics'

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

  // 取得系統健康稀況
  const healthStatus = getHealthStatus()
  
  // 取得錯誤追蹤狀態
  const errorTrackingStatus: 'available' | 'unavailable' = 
    isErrorTrackingAvailable() ? 'available' : 'unavailable'
    
  // 取得業務指標 - 創建一個新的收集器實例用於演示
  const collector = new MetricsCollector()
  // 在實際實現中，這裡會從持久化存儲或全域實例取得指標
  const businessMetrics = {
    userActions: {
      pageViews: 1250,
      productViews: 834,
      inquirySubmissions: 23,
      searchQueries: 156
    },
    business: {
      newProducts: 5,
      totalInquiries: 89,
      farmTourBookings: 12,
      newsArticles: 3
    },
    performance: {
      apiResponseTime: [45, 52, 38, 67, 43],
      errorRate: 0.02,
      activeUsers: 67
    },
    content: {
      popularProducts: [
        { id: 'prod-1', views: 234 },
        { id: 'prod-2', views: 189 },
        { id: 'prod-3', views: 156 }
      ],
      searchTerms: [
        { term: '有機蔬菜', count: 45 },
        { term: '農場參觀', count: 32 },
        { term: '新鮮水果', count: 28 }
      ],
      inquiryCategories: [
        { category: '產品詢問', count: 34 },
        { category: '參觀預約', count: 28 },
        { category: '合作提案', count: 12 }
      ]
    }
  }

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
          total: 0, // 暫時硬編碼，實際應從錯誤統計系統取得
          criticalErrors: 0 // 暫時硬編碼，實際應從錯誤統計系統取得
        }
      },
      timestamp: healthStatus.timestamp
    },
    metrics: businessMetrics
  }

  return success(responseData, '系統指標取得成功')
}

export const GET = withErrorHandler(handleGET, {
  module: 'MetricsAPI',
  enableAuditLog: false,
})
