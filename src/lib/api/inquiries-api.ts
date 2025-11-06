/**
 * Inquiries API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiClient } from '@/lib/api-client'
import { apiLogger } from '@/lib/logger'
import { InquiryStatsData as InquiryStatsDataUtil } from '@/lib/utils/inquiry-stats-utils'
import { InquiryWithItems, InquiryStatus, InquiryType } from '@/types/inquiry'
import { handleApiError } from './common'

// 重新匯出 InquiryStatsData 供外部使用
export type InquiryStatsData = InquiryStatsDataUtil

/**
 * 詢問單查詢參數
 */
export interface FetchInquiriesParams {
  statusFilter?: InquiryStatus | 'all'
  typeFilter?: InquiryType | 'all'
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * 取得詢問單列表
 * @param params - 查詢參數（篩選、排序）
 * @returns 詢問單陣列
 */
export async function fetchInquiries(params?: FetchInquiriesParams): Promise<InquiryWithItems[]> {
  try {
    // 建立查詢參數
    const searchParams = new URLSearchParams()

    if (params?.statusFilter && params.statusFilter !== 'all') {
      searchParams.append('status', params.statusFilter)
    }

    if (params?.typeFilter && params.typeFilter !== 'all') {
      searchParams.append('inquiry_type', params.typeFilter)
    }

    searchParams.append('sort_by', params?.sortBy || 'created_at')
    searchParams.append('sort_order', params?.sortOrder || 'desc')

    const endpoint = `/api/inquiries${searchParams.toString() ? `?${searchParams}` : ''}`

    const result = await apiClient.get<InquiryWithItems[]>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得詢問單列表失敗')
    }

    apiLogger.info('詢問單列表取得成功', {
      metadata: { count: result.data.length },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchInquiries', 'InquiriesAPI')
  }
}

/**
 * 取得單一詢問單詳情
 * @param id - 詢問單 ID
 * @returns 詢問單詳細資料
 */
export async function fetchInquiryById(id: string): Promise<InquiryWithItems> {
  try {
    const result = await apiClient.get<InquiryWithItems>(`/api/inquiries/${id}`)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得詢問單詳情失敗')
    }

    apiLogger.info('詢問單詳情取得成功', {
      metadata: { inquiryId: id },
    })

    return result.data
  } catch (error) {
    handleApiError(error, 'fetchInquiryById', 'InquiriesAPI')
  }
}

/**
 * 更新詢問單狀態
 * @param id - 詢問單 ID
 * @param status - 新的狀態
 * @returns 是否更新成功
 */
export async function updateInquiryStatus(id: string, status: InquiryStatus): Promise<boolean> {
  try {
    const result = await apiClient.patch<unknown>(`/api/inquiries/${id}`, { status })

    if (!result.success) {
      throw new Error(result.message || '更新詢問單狀態失敗')
    }

    apiLogger.info('詢問單狀態更新成功', {
      metadata: { inquiryId: id, newStatus: status },
    })

    return true
  } catch (error) {
    handleApiError(error, 'updateInquiryStatus', 'InquiriesAPI')
  }
}

/**
 * 刪除詢問單
 * @param id - 詢問單 ID
 * @returns 是否刪除成功
 */
export async function deleteInquiry(id: string): Promise<boolean> {
  try {
    const result = await apiClient.delete<unknown>(`/api/inquiries/${id}`)

    if (!result.success) {
      throw new Error(result.message || '刪除詢問單失敗')
    }

    apiLogger.info('詢問單刪除成功', {
      metadata: { inquiryId: id },
    })

    return true
  } catch (error) {
    handleApiError(error, 'deleteInquiry', 'InquiriesAPI')
  }
}

/**
 * 取得詢問單統計資料
 * @param timeframe - 時間範圍（天數）
 * @returns 詢問單統計資料
 */
export async function fetchInquiryStats(timeframe: number = 30): Promise<InquiryStatsDataUtil> {
  try {
    const params = new URLSearchParams({ timeframe: String(timeframe) })
    const endpoint = `/api/inquiries/stats?${params}`

    const result = await apiClient.get<{ summary: InquiryStatsDataUtil }>(endpoint)

    if (!result.success || !result.data) {
      throw new Error(result.message || '取得詢問單統計資料失敗')
    }

    apiLogger.info('詢問單統計資料取得成功', {
      metadata: { timeframe, totalInquiries: result.data.summary.total_inquiries },
    })

    return result.data.summary
  } catch (error) {
    handleApiError(error, 'fetchInquiryStats', 'InquiriesAPI')
  }
}
