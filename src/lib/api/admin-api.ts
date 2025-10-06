/**
 * Admin API 客戶端包裝層
 * 提供管理員專用的監控、統計和系統管理功能
 */

import { apiLogger } from '@/lib/logger'
import { apiClient } from '@/lib/api-client'
import { handleApiError } from './common'

/**
 * 連線池操作類型
 */
export type ConnectionPoolOperation =
  | 'refresh'
  | 'reset'
  | 'status'
  | 'monitor-start'
  | 'monitor-stop'
  | 'monitor-status'
  | 'monitor-check'

/**
 * 連線池操作請求
 */
export interface ConnectionPoolRequest {
  operation: ConnectionPoolOperation
  force?: boolean
  checkInterval?: number
}

/**
 * 連線池狀態回應
 */
export interface ConnectionPoolStatusResponse {
  poolEnabled: boolean
  schemaVersion: string
  poolStats: {
    poolUtilization: number
    averageAcquireTime: number
    totalRequests: number
    failedRequests: number
    totalConnections: number
    unhealthyConnections: number
    activeConnections: number
  } | null
  schemaMonitor: {
    isMonitoring: boolean
    lastCheck: string | null
    checkInterval: number | null
  }
  timestamp: string
}

/**
 * 連線池操作回應
 */
export interface ConnectionPoolOperationResponse {
  operation: string
  message: string
  schemaVersion?: string
  timestamp: string
  hasChanges?: boolean
  checkInterval?: number
  monitorStatus?: {
    isMonitoring: boolean
    lastCheck: string | null
    checkInterval: number | null
  }
}

/**
 * 連線池統計回應
 */
export interface PoolStatsResponse {
  enabled: boolean
  timestamp: string
  stats?: {
    poolUtilization: number
    averageAcquireTime: number
    totalRequests: number
    failedRequests: number
    totalConnections: number
    unhealthyConnections: number
    activeConnections: number
  }
  analysis?: {
    healthScore: number
    utilizationLevel: 'low' | 'normal' | 'high' | 'critical'
    performance: {
      averageAcquireTime: string
      successRate: string
    }
    recommendations: string[]
  }
  message?: string
  error?: string
  fallbackMode?: boolean
}

/**
 * 錯誤統計回應
 */
export interface ErrorStatsResponse {
  timeRange: string
  timestamp: string
  errorStats: {
    totalErrors: number
    errorRate: number
    criticalErrors: number
    recentErrors: Array<{
      timestamp: string
      module: string
      message: string
      severity: string
    }>
  }
  systemStats: {
    uptime: number
    errorsByModule: Record<string, number>
    errorTrend: string
  }
  insights: {
    description: string
    provider: string
    features: string[]
  }
}

/**
 * 速率限制統計回應
 */
export interface RateLimitStatsResponse {
  timestamp: string
  stats: {
    totalRequests: number
    blockedRequests: number
    blockRate: number
    topBlockedIPs: Array<{
      ip: string
      count: number
    }>
    topEndpoints: Array<{
      endpoint: string
      requests: number
    }>
  }
}

/**
 * KPI 報告回應
 */
export interface KPIReportResponse {
  timestamp: string
  overallHealthScore: number
  measurements: Array<{
    metric: string
    value: number
    threshold: number
    status: 'healthy' | 'warning' | 'critical'
    trend: 'up' | 'down' | 'stable'
  }>
  alerts: Array<{
    severity: 'info' | 'warning' | 'error'
    message: string
    metric: string
  }>
  recommendations: string[]
}

/**
 * 執行連線池操作（管理員）
 * @param request - 操作請求
 * @returns 操作結果
 */
export async function manageConnectionPool(
  request: ConnectionPoolRequest
): Promise<ConnectionPoolOperationResponse> {
  try {
    const result = await apiClient.post<ConnectionPoolOperationResponse>(
      '/api/admin/connection-pool',
      request as unknown as Record<string, unknown>
    )

    if (!result.success || !result.data) {
      throw new Error(result.message || '連線池操作失敗')
    }

    apiLogger.info('連線池操作成功', {
      metadata: { operation: request.operation },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'manageConnectionPool', 'AdminAPI')
  }
}

/**
 * 取得連線池狀態（管理員）
 * @returns 連線池狀態
 */
export async function fetchConnectionPoolStatus(): Promise<ConnectionPoolStatusResponse> {
  try {
    const result = await apiClient.get<ConnectionPoolStatusResponse>('/api/admin/connection-pool')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得連線池狀態失敗')
    }

    apiLogger.info('連線池狀態取得成功', {
      metadata: {
        poolEnabled: result.data.poolEnabled,
        schemaVersion: result.data.schemaVersion,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchConnectionPoolStatus', 'AdminAPI')
  }
}

/**
 * 取得連線池統計（管理員）
 * @returns 連線池統計資料
 */
export async function fetchPoolStats(): Promise<PoolStatsResponse> {
  try {
    const result = await apiClient.get<PoolStatsResponse>('/api/admin/pool-status')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得連線池統計失敗')
    }

    apiLogger.info('連線池統計取得成功', {
      metadata: {
        enabled: result.data.enabled,
        healthScore: result.data.analysis?.healthScore,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchPoolStats', 'AdminAPI')
  }
}

/**
 * 取得錯誤統計（管理員）
 * @param timeRange - 時間範圍（1h, 24h, 7d）
 * @returns 錯誤統計資料
 */
export async function fetchErrorStats(
  timeRange: '1h' | '24h' | '7d' = '24h'
): Promise<ErrorStatsResponse> {
  try {
    const params = new URLSearchParams({ timeRange })
    const result = await apiClient.get<ErrorStatsResponse>(`/api/admin/error-stats?${params}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得錯誤統計失敗')
    }

    apiLogger.info('錯誤統計取得成功', {
      metadata: {
        timeRange,
        totalErrors: result.data.errorStats.totalErrors,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchErrorStats', 'AdminAPI')
  }
}

/**
 * 取得速率限制統計（管理員）
 * @returns 速率限制統計資料
 */
export async function fetchRateLimitStats(): Promise<RateLimitStatsResponse> {
  try {
    const result = await apiClient.get<RateLimitStatsResponse>('/api/admin/rate-limit-stats')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得速率限制統計失敗')
    }

    apiLogger.info('速率限制統計取得成功', {
      metadata: {
        totalRequests: result.data.stats.totalRequests,
        blockedRequests: result.data.stats.blockedRequests,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchRateLimitStats', 'AdminAPI')
  }
}

/**
 * 取得 KPI 報告（管理員）
 * @returns KPI 報告
 */
export async function fetchKPIReport(): Promise<KPIReportResponse> {
  try {
    const result = await apiClient.get<KPIReportResponse>('/api/admin/kpi-report')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得 KPI 報告失敗')
    }

    apiLogger.info('KPI 報告取得成功', {
      metadata: {
        overallHealthScore: result.data.overallHealthScore,
        measurementsCount: result.data.measurements.length,
        alertsCount: result.data.alerts.length,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchKPIReport', 'AdminAPI')
  }
}

/**
 * 取得管理員訂單列表（含分頁和篩選）
 * @param params - 查詢參數
 * @returns 訂單列表和統計
 */
export async function fetchAdminOrders(params?: {
  page?: number
  limit?: number
  status?: string
  userId?: string
}): Promise<{
  orders: unknown[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: unknown
}> {
  try {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/admin/orders${searchParams.toString() ? `?${searchParams}` : ''}`
    const result = await apiClient.get<{
      orders: unknown[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
      }
      summary: unknown
    }>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得管理員訂單列表失敗')
    }

    apiLogger.info('管理員訂單列表取得成功', {
      metadata: {
        count: result.data.orders.length,
        page: params?.page || 1,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAdminOrders', 'AdminAPI')
  }
}

/**
 * 取得管理員產品列表（含未啟用產品）
 * @returns 產品列表
 */
export async function fetchAdminProducts(): Promise<unknown[]> {
  try {
    const result = await apiClient.get<unknown[]>('/api/admin-proxy/products')

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得管理員產品列表失敗')
    }

    apiLogger.info('管理員產品列表取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAdminProducts', 'AdminAPI')
  }
}

/**
 * 帶圖片建立產品（管理員）
 * @param formData - 表單資料（包含產品資料和圖片）
 * @returns 建立的產品
 */
export async function createProductWithImages(formData: FormData): Promise<unknown> {
  try {
    // 使用原生 fetch，因為 FormData 需要特殊處理
    const response = await fetch('/api/admin/products/create-with-images', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || '建立產品失敗')
    }

    const result = await response.json()

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立產品失敗')
    }

    apiLogger.info('帶圖片建立產品成功', {
      metadata: { productId: result.data.id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createProductWithImages', 'AdminAPI')
  }
}

/**
 * 帶圖片建立地點（管理員）
 * @param data - 包含地點資料和圖片資料的 JSON 物件
 * @returns 建立的地點
 */
export async function createLocationWithImages(data: Record<string, unknown>): Promise<unknown> {
  try {
    const result = await apiClient.post<unknown>('/api/admin/locations/create-with-images', data)

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立地點失敗')
    }

    apiLogger.info('帶圖片建立地點成功', {
      metadata: { locationId: (result.data as { id?: string }).id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createLocationWithImages', 'AdminAPI')
  }
}

/**
 * 帶圖片建立農場體驗（管理員）
 * @param data - 包含農場體驗資料和圖片資料的 JSON 物件
 * @returns 建立的農場體驗
 */
export async function createFarmTourWithImages(data: Record<string, unknown>): Promise<unknown> {
  try {
    const result = await apiClient.post<unknown>('/api/admin/farm-tour/create-with-images', data)

    if (!result.success || !result.data) {
      throw new Error(result.message || '建立農場體驗失敗')
    }

    apiLogger.info('帶圖片建立農場體驗成功', {
      metadata: { farmTourId: (result.data as { id?: string }).id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'createFarmTourWithImages', 'AdminAPI')
  }
}
