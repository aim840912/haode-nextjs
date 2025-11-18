import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import { BusinessMetrics, ErrorStats, PerformanceStats } from './types'

interface UseMockMetricsReturn {
  metrics: BusinessMetrics
  errorStats: ErrorStats | null
  performanceStats: PerformanceStats | null
  isLoading: boolean
  error: string | null
}

/**
 * 模擬監控數據載入 Hook
 *
 * 用於載入模擬的監控數據，未來可替換為真實 API 調用
 *
 * @returns 監控數據、載入狀態和錯誤狀態
 */
export function useMockMetrics(): UseMockMetricsReturn {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    userActions: {
      pageViews: 0,
      productViews: 0,
      inquirySubmissions: 0,
      searchQueries: 0,
    },
    business: {
      newProducts: 0,
      totalInquiries: 0,
      farmTourBookings: 0,
    },
    performance: {
      apiResponseTime: [],
      errorRate: 0,
      activeUsers: 0,
    },
    content: {
      popularProducts: [],
      searchTerms: [],
      inquiryCategories: [],
    },
  })

  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null)
  const [performanceStats, setPerformanceStats] = useState<PerformanceStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setIsLoading(true)

        // 模擬 API 調用延遲
        await new Promise(resolve => setTimeout(resolve, 1000))

        // 設置模擬數據
        setMetrics({
          userActions: {
            pageViews: Math.floor(Math.random() * 1000) + 500,
            productViews: Math.floor(Math.random() * 300) + 150,
            inquirySubmissions: Math.floor(Math.random() * 50) + 20,
            searchQueries: Math.floor(Math.random() * 200) + 80,
          },
          business: {
            newProducts: Math.floor(Math.random() * 10) + 5,
            totalInquiries: Math.floor(Math.random() * 100) + 50,
            farmTourBookings: Math.floor(Math.random() * 20) + 10,
          },
          performance: {
            apiResponseTime: Array(10)
              .fill(0)
              .map(() => Math.random() * 500 + 100),
            errorRate: Math.random() * 5,
            activeUsers: Math.floor(Math.random() * 50) + 20,
          },
          content: {
            popularProducts: [
              { id: 'product1', views: Math.floor(Math.random() * 100) + 50 },
              { id: 'product2', views: Math.floor(Math.random() * 80) + 40 },
            ],
            searchTerms: [
              { term: '農產品', count: Math.floor(Math.random() * 50) + 25 },
              { term: '有機蔬菜', count: Math.floor(Math.random() * 40) + 20 },
            ],
            inquiryCategories: [
              { category: '產品詢價', count: Math.floor(Math.random() * 30) + 15 },
              { category: '農場導覽', count: Math.floor(Math.random() * 20) + 10 },
            ],
          },
        })

        setErrorStats({
          totalErrors: Math.floor(Math.random() * 20),
          errorRate: Math.random() * 2,
          criticalErrors: Math.floor(Math.random() * 3),
          errorsByStatus: {
            '404': Math.floor(Math.random() * 10),
            '500': Math.floor(Math.random() * 5),
          },
          topPatterns: [
            { pattern: 'Database connection timeout', count: 3 },
            { pattern: 'Invalid request format', count: 2 },
          ],
          recentErrors: [
            {
              message: '資料庫連接逾時',
              timestamp: new Date().toISOString(),
              level: 'error',
              count: 1,
            },
          ],
        })

        setPerformanceStats({
          avgResponseTime: Math.random() * 200 + 100,
          maxResponseTime: Math.random() * 500 + 300,
          minResponseTime: Math.random() * 50 + 20,
          totalRequests: Math.floor(Math.random() * 1000) + 500,
          limitRate: Math.random() * 10,
          requestsByHour: Array(24)
            .fill(0)
            .map((_, i) => ({
              hour: `${i}:00`,
              count: Math.floor(Math.random() * 100),
            })),
        })

        logger.info('監控數據載入成功')
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入監控數據失敗'
        setError(errorMessage)
        logger.error('載入監控數據失敗', err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    loadMetrics()
  }, [])

  return {
    metrics,
    errorStats,
    performanceStats,
    isLoading,
    error,
  }
}
