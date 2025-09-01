'use client'

import { useState, useEffect } from 'react'
import {
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  NewspaperIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
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

interface MetricsResponse {
  success: boolean
  data: {
    format: string
    timeRange: string
    timestamp: string
    metrics: BusinessMetrics
  }
  message: string
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'error'
  vercelAnalytics: 'active' | 'inactive'
  customMetrics: 'collecting' | 'paused'
  timestamp: string
}

export default function MonitoringDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    status: 'healthy',
    vercelAnalytics: 'active',
    customMetrics: 'collecting',
    timestamp: new Date().toISOString(),
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<string>('')
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d'>('24h')

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      // 計算時間範圍（毫秒）
      const timeRangeMs = {
        '1h': 60 * 60 * 1000,
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
      }[timeRange]

      const response = await fetch(`/api/metrics?timeRange=${timeRangeMs}&format=summary`)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result: MetricsResponse = await response.json()

      if (result.success) {
        setMetrics(result.data.metrics)
        setSystemHealth(prev => ({
          ...prev,
          status: 'healthy',
          timestamp: result.data.timestamp,
        }))
      } else {
        throw new Error(result.message || '無法載入指標數據')
      }

      setLastRefresh(new Date().toLocaleString('zh-TW'))
    } catch (err) {
      console.error('獲取指標時發生錯誤:', err)
      setError(err instanceof Error ? err.message : '未知錯誤')
      setSystemHealth(prev => ({ ...prev, status: 'error' }))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()

    // 設定自動刷新（每5分鐘）
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [timeRange])

  const getStatusColor = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: SystemHealth['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon className="h-5 w-5" />
      case 'degraded':
        return <ExclamationTriangleIcon className="h-5 w-5" />
      case 'error':
        return <XCircleIcon className="h-5 w-5" />
      default:
        return <ClockIcon className="h-5 w-5" />
    }
  }

  const calculateAverageResponseTime = (times: number[]) => {
    if (times.length === 0) return 0
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length)
  }

  if (loading && !metrics) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <p className="text-gray-600">載入監控數據中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* 頁面標題和控制項 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">監控儀表板</h1>
          <p className="text-gray-600 mt-1">即時業務指標和系統健康狀態</p>
        </div>

        <div className="flex items-center gap-4">
          {/* 時間範圍選擇器 */}
          <div className="flex rounded-md shadow-sm">
            {(['1h', '24h', '7d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-2 text-sm font-medium border ${
                  timeRange === range
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } ${range === '1h' ? 'rounded-l-md' : range === '7d' ? 'rounded-r-md' : '-ml-px'}`}
              >
                {range === '1h' ? '1小時' : range === '24h' ? '24小時' : '7天'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchMetrics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 錯誤顯示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">載入錯誤</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* 系統健康狀態 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            系統健康狀態
            {lastRefresh && (
              <span className="text-sm text-gray-500 font-normal">最後更新: {lastRefresh}</span>
            )}
          </h2>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(systemHealth.status)}`}
            >
              {getStatusIcon(systemHealth.status)}
              <div>
                <p className="font-medium">整體狀態</p>
                <p className="text-sm capitalize">{systemHealth.status}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-blue-200 bg-blue-50 text-blue-700">
              <ChartBarIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">Vercel Analytics</p>
                <p className="text-sm">已啟用</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 text-green-700">
              <ClockIcon className="h-5 w-5" />
              <div>
                <p className="font-medium">自訂指標收集</p>
                <p className="text-sm">運作中</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 當前為測試模式，顯示簡化的指標儀表板 */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">指標系統測試</h2>
          <p className="text-sm text-gray-600 mt-1">監控系統已就緒，正在收集業務指標數據</p>
        </div>
        <div className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-blue-900">Vercel Analytics</p>
              <p className="text-blue-600 text-sm">網站流量分析</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                已啟用
              </span>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <ClockIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-green-900">自訂指標收集</p>
              <p className="text-green-600 text-sm">業務數據追蹤</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
                運作中
              </span>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-purple-900">API 監控</p>
              <p className="text-purple-600 text-sm">請求效能追蹤</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-2">
                自動記錄
              </span>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <p className="text-xl font-bold text-orange-900">錯誤追蹤</p>
              <p className="text-orange-600 text-sm">異常監控警報</p>
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
                待完成
              </span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">系統功能狀態</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">✅ Vercel Analytics 網站流量分析</span>
                <span className="text-green-600 font-medium">已整合</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">✅ 自訂業務指標收集系統</span>
                <span className="text-green-600 font-medium">已部署</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">✅ API 請求效能自動監控</span>
                <span className="text-green-600 font-medium">運作中</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">⏳ Sentry 錯誤追蹤系統</span>
                <span className="text-yellow-600 font-medium">計劃中</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-700">✅ 即時監控儀表板</span>
                <span className="text-green-600 font-medium">已完成</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 實際業務指標 */}
      {metrics && (
        <>
          {/* 使用者行為指標 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">使用者行為指標</h2>
              <p className="text-sm text-gray-600 mt-1">
                過去 {timeRange === '1h' ? '1小時' : timeRange === '24h' ? '24小時' : '7天'}{' '}
                的使用者互動統計
              </p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <EyeIcon className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">
                      {metrics.userActions.pageViews}
                    </p>
                    <p className="text-blue-600">頁面瀏覽</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <ChartBarIcon className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-green-900">
                      {metrics.userActions.productViews}
                    </p>
                    <p className="text-green-600">產品查看</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <PhoneIcon className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold text-purple-900">
                      {metrics.userActions.inquirySubmissions}
                    </p>
                    <p className="text-purple-600">詢問提交</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg">
                  <MagnifyingGlassIcon className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-900">
                      {metrics.userActions.searchQueries}
                    </p>
                    <p className="text-orange-600">搜尋查詢</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 系統效能指標 */}
          <div className="bg-white rounded-lg shadow border">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">系統效能指標</h2>
              <p className="text-sm text-gray-600 mt-1">API 回應時間、錯誤率和使用者活動</p>
            </div>
            <div className="px-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ClockIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {calculateAverageResponseTime(metrics.performance.apiResponseTime)}ms
                  </p>
                  <p className="text-gray-600">平均回應時間</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                    {metrics.performance.apiResponseTime.length} 個請求
                  </span>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <ExclamationTriangleIcon
                    className={`h-8 w-8 mx-auto mb-2 ${
                      metrics.performance.errorRate > 5
                        ? 'text-red-600'
                        : metrics.performance.errorRate > 1
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  />
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.performance.errorRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">錯誤率</p>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                      metrics.performance.errorRate > 5
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {metrics.performance.errorRate > 5 ? '需要關注' : '正常'}
                  </span>
                </div>

                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <UserGroupIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">
                    {metrics.performance.activeUsers}
                  </p>
                  <p className="text-gray-600">活躍使用者</p>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                    在線人數
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
