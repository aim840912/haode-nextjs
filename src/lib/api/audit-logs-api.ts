/**
 * Audit Logs API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import type { AuditLog, AuditLogQueryParams, AuditAction, ResourceType } from '@/types/audit'
import type {
  FormattedAuditStats,
  FormattedUserActivityStats,
  FormattedResourceAccessStats,
} from '@/types/audit-stats'
import { handleApiError } from './common'

/**
 * 統計查詢參數
 */
export interface AuditStatsParams {
  days?: number
  type?: 'overview' | 'users' | 'resources' | 'actions'
}

/**
 * 統計綜合回應
 */
export interface AuditStatsOverviewResponse {
  audit_stats: FormattedAuditStats[]
  user_stats: FormattedUserActivityStats[]
  resource_stats: FormattedResourceAccessStats[]
  summary: {
    total_actions: number
    unique_users: number
    most_active_day: FormattedAuditStats
    sensitive_actions: number
  }
}

/**
 * 批次操作請求
 */
export interface BatchDeleteRequest {
  operation: 'delete_by_ids' | 'delete_by_filters' | 'cleanup_old'
  ids?: string[]
  filters?: {
    start_date?: string
    end_date?: string
    user_email?: string
    action?: AuditAction
    resource_type?: ResourceType
    days?: number
  }
}

/**
 * 批次操作回應
 */
export interface BatchDeleteResponse {
  deleted_count: number
  days_kept?: number
}

/**
 * 取得審計日誌列表
 * @param params - 查詢參數（篩選、分頁）
 * @returns 審計日誌陣列
 */
export async function fetchAuditLogs(params?: AuditLogQueryParams): Promise<AuditLog[]> {
  try {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/audit-logs${searchParams.toString() ? `?${searchParams}` : ''}`
    const result = await apiClient.get<AuditLog[]>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得審計日誌列表失敗')
    }

    apiLogger.info('審計日誌列表取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAuditLogs', 'AuditLogsAPI')
  }
}

/**
 * 取得單一審計日誌詳情
 * @param id - 審計日誌 ID
 * @returns 審計日誌詳細資料
 */
export async function fetchAuditLogById(id: string): Promise<AuditLog> {
  try {
    const result = await apiClient.get<AuditLog>(`/api/audit-logs/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得審計日誌詳情失敗')
    }

    apiLogger.info('審計日誌詳情取得成功', {
      metadata: { auditLogId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAuditLogById', 'AuditLogsAPI')
  }
}

/**
 * 刪除單一審計日誌
 * @param id - 審計日誌 ID
 * @returns 是否刪除成功
 */
export async function deleteAuditLog(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete<null>(`/api/audit-logs/${id}`)

    if (!result.success) {
      throw new Error(result.message || '刪除審計日誌失敗')
    }

    apiLogger.info('審計日誌刪除成功', {
      metadata: { auditLogId: id },
    })

    return true
  } catch (error) {
    handleApiError(error, 'deleteAuditLog', 'AuditLogsAPI')
  }
}

/**
 * 取得審計統計資料
 * @param params - 統計查詢參數
 * @returns 統計資料（根據 type 返回不同類型）
 */
export async function fetchAuditLogStats(
  params?: AuditStatsParams
): Promise<
  | AuditStatsOverviewResponse
  | FormattedUserActivityStats[]
  | FormattedResourceAccessStats[]
  | FormattedAuditStats[]
> {
  try {
    const searchParams = new URLSearchParams()

    if (params?.days) {
      searchParams.append('days', String(params.days))
    }
    if (params?.type) {
      searchParams.append('type', params.type)
    }

    const endpoint = `/api/audit-logs/stats${searchParams.toString() ? `?${searchParams}` : ''}`
    const result = await apiClient.get<
      | AuditStatsOverviewResponse
      | FormattedUserActivityStats[]
      | FormattedResourceAccessStats[]
      | FormattedAuditStats[]
    >(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得審計統計失敗')
    }

    apiLogger.info('審計統計取得成功', {
      metadata: {
        type: params?.type || 'overview',
        days: params?.days || 30,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchAuditLogStats', 'AuditLogsAPI')
  }
}

/**
 * 批次刪除審計日誌（通過 ID 列表）
 * @param ids - 審計日誌 ID 陣列
 * @returns 刪除結果
 */
export async function batchDeleteAuditLogs(ids: string[]): Promise<BatchDeleteResponse> {
  try {
    const result = await apiClient.post<BatchDeleteResponse>('/api/audit-logs/batch', {
      operation: 'delete_by_ids',
      ids,
    } as unknown as Record<string, unknown>)

    if (!result.success || !result.data) {
      throw new Error(result.message || '批次刪除審計日誌失敗')
    }

    apiLogger.info('批次刪除審計日誌成功', {
      metadata: {
        idsCount: ids.length,
        deletedCount: result.data.deleted_count,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'batchDeleteAuditLogs', 'AuditLogsAPI')
  }
}

/**
 * 批次刪除審計日誌（通過篩選條件）
 * @param filters - 篩選條件
 * @returns 刪除結果
 */
export async function batchDeleteByFilters(
  filters: NonNullable<BatchDeleteRequest['filters']>
): Promise<BatchDeleteResponse> {
  try {
    const result = await apiClient.post<BatchDeleteResponse>('/api/audit-logs/batch', {
      operation: 'delete_by_filters',
      filters,
    } as unknown as Record<string, unknown>)

    if (!result.success || !result.data) {
      throw new Error(result.message || '按條件批次刪除審計日誌失敗')
    }

    apiLogger.info('按條件批次刪除審計日誌成功', {
      metadata: {
        filters,
        deletedCount: result.data.deleted_count,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'batchDeleteByFilters', 'AuditLogsAPI')
  }
}

/**
 * 清理舊審計日誌
 * @param daysToKeep - 保留天數（預設 365 天）
 * @returns 刪除結果
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 365): Promise<BatchDeleteResponse> {
  try {
    const result = await apiClient.post<BatchDeleteResponse>('/api/audit-logs/batch', {
      operation: 'cleanup_old',
      filters: { days: daysToKeep },
    } as unknown as Record<string, unknown>)

    if (!result.success || !result.data) {
      throw new Error(result.message || '清理舊審計日誌失敗')
    }

    apiLogger.info('清理舊審計日誌成功', {
      metadata: {
        daysToKeep,
        deletedCount: result.data.deleted_count,
      },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'cleanupOldAuditLogs', 'AuditLogsAPI')
  }
}
