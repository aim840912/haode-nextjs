/**
 * Inquiries API 客戶端包裝層
 * 提供類型安全的 API 呼叫函數，供客戶端元件使用
 */

import { apiLogger } from '@/lib/logger'
import { InquiryWithItems, InquiryStatus, InquiryType } from '@/types/inquiry'
import { ApiResponse, handleApiError } from './common'

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

    const url = `/api/inquiries${searchParams.toString() ? `?${searchParams}` : ''}`

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得詢問單列表失敗')
    }

    const result: ApiResponse<InquiryWithItems[]> = await response.json()

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
    const response = await fetch(`/api/inquiries/${id}`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '取得詢問單詳情失敗')
    }

    const result: ApiResponse<InquiryWithItems> = await response.json()

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
    const response = await fetch(`/api/inquiries/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '更新詢問單狀態失敗')
    }

    const result: ApiResponse<unknown> = await response.json()

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
    const response = await fetch(`/api/inquiries/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || '刪除詢問單失敗')
    }

    const result: ApiResponse<unknown> = await response.json()

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
