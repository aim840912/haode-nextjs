'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  BugAntIcon,
  ExclamationCircleIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  BoltIcon,
  StopIcon,
  TrophyIcon,
  BeakerIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'

interface BusinessMetrics {
  userActions: {
    pageViews: number
    productViews: number
    inquirySubmissions: number
    searchQueries: number
  }
  business: {
    newProducts: number
    totalInquiries: number
    farmTourBookings: number
    newsArticles: number
  }
  performance: {
    apiResponseTime: number[]
    errorRate: number
    activeUsers: number
  }
  content: {
    popularProducts: Array<{ id: string; views: number }>
    searchTerms: Array<{ term: string; count: number }>
    inquiryCategories: Array<{ category: string; count: number }>
  }
}

interface ErrorStats {
  totalErrors: number
  errorRate: number
  criticalErrors: number
  errorsByStatus: Record<string, number>
  topPatterns: Array<{ pattern: string; count: number }>
  recentErrors: Array<{
    message: string
    timestamp: string
    level: string
    count: number
  }>
}

interface PerformanceStats {
  avgResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  totalRequests: number
  limitRate: number
  requestsByHour: Array<{ hour: string; count: number }>
}

export default function MonitoringDashboard() {
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
      newsArticles: 0,
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

  // 模擬數據載入
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
            newsArticles: Math.floor(Math.random() * 15) + 8,
          },
          performance: {
            apiResponseTime: Array(10).fill(0).map(() => Math.random() * 500 + 100),
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
            { message: '資料庫連接逾時', timestamp: new Date().toISOString(), level: 'error', count: 1 },
          ],
        })

        setPerformanceStats({
          avgResponseTime: Math.random() * 200 + 100,
          maxResponseTime: Math.random() * 500 + 300,
          minResponseTime: Math.random() * 50 + 20,
          totalRequests: Math.floor(Math.random() * 1000) + 500,
          limitRate: Math.random() * 10,
          requestsByHour: Array(24).fill(0).map((_, i) => ({
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">載入監控數據中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
          <h3 className="text-sm font-medium text-red-800">載入失敗</h3>
        </div>
        <div className="mt-2 text-sm text-red-700">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 業務指標概覽 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">頁面瀏覽</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.userActions.pageViews}</p>
            </div>
            <EyeIcon className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">產品查看</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.userActions.productViews}</p>
            </div>
            <MagnifyingGlassIcon className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">詢價提交</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.userActions.inquirySubmissions}</p>
            </div>
            <PhoneIcon className="h-8 w-8 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">活躍用戶</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.performance.activeUsers}</p>
            </div>
            <UserGroupIcon className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* 錯誤監控 */}
      {errorStats && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BugAntIcon className="h-5 w-5 text-red-500 mr-2" />
              錯誤監控
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-red-50 to-red-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ExclamationCircleIcon className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-medium">總錯誤數</p>
                    <p className="text-2xl font-bold text-red-700">{errorStats.totalErrors}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ShieldExclamationIcon className="h-8 w-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-yellow-600 font-medium">錯誤率</p>
                    <p className="text-2xl font-bold text-yellow-700">{errorStats.errorRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <XCircleIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-orange-600 font-medium">嚴重錯誤</p>
                    <p className="text-2xl font-bold text-orange-700">{errorStats.criticalErrors}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 效能監控 */}
      {performanceStats && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <BoltIcon className="h-5 w-5 text-blue-500 mr-2" />
              效能監控
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ClockIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-blue-600 font-medium">平均回應時間</p>
                    <p className="text-2xl font-bold text-blue-700">{performanceStats.avgResponseTime.toFixed(0)}ms</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ArrowPathIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-sm text-green-600 font-medium">總請求數</p>
                    <p className="text-2xl font-bold text-green-700">{performanceStats.totalRequests}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <ChartBarIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-purple-600 font-medium">限制率</p>
                    <p className="text-2xl font-bold text-purple-700">{performanceStats.limitRate.toFixed(2)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 系統狀態指示 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">系統狀態</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-blue-900">Vercel Analytics</p>
              <p className="text-blue-600 text-sm">網站流量分析</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                已啟用
              </span>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-green-900">安全監控</p>
              <p className="text-green-600 text-sm">系統安全狀態</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                正常運行
              </span>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <CpuChipIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-900">系統效能</p>
              <p className="text-purple-600 text-sm">伺服器運行狀態</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                良好
              </span>
            </div>

            <div className="text-center p-4 bg-amber-50 rounded-lg">
              <BeakerIcon className="h-8 w-8 text-amber-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-amber-900">測試環境</p>
              <p className="text-amber-600 text-sm">開發測試狀態</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                待完成
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}