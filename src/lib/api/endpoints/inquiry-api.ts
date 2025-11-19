/**
 * 詢價 API 客戶端
 *
 * 提供詢價相關的 API 端點封裝:
 * - 列表查詢 (支援篩選、排序、分頁)
 * - 單筆查詢
 * - 建立 (認證/訪客)
 * - 更新/刪除
 * - 統計資料
 */

'use client'

import { ApiResponse, ApiRequestOptions, ApiRequestData } from '@/types/infrastructure.types'
import { CreateInquiryRequest } from '@/types/inquiry'

// ApiClient 實例會在主檔案注入
let apiClientInstance: {
  get: <T = unknown>(endpoint: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>
  post: <T = unknown>(
    endpoint: string,
    data?: ApiRequestData,
    options?: ApiRequestOptions
  ) => Promise<ApiResponse<T>>
  put: <T = unknown>(
    endpoint: string,
    data?: ApiRequestData,
    options?: ApiRequestOptions
  ) => Promise<ApiResponse<T>>
  delete: <T = unknown>(endpoint: string, options?: ApiRequestOptions) => Promise<ApiResponse<T>>
}

export function setApiClient(client: typeof apiClientInstance) {
  apiClientInstance = client
}

export const inquiryApi = {
  // 列出詢價單
  list: (params?: {
    status?: string
    search?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
    page?: number
    limit?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/inquiries${searchParams.toString() ? `?${searchParams}` : ''}`
    return apiClientInstance.get(endpoint)
  },

  // 獲取單一詢價單
  get: (id: string) => apiClientInstance.get(`/api/inquiries/${id}`),

  // 創建詢價單（需認證）
  create: (data: CreateInquiryRequest) => apiClientInstance.post('/api/inquiries', data),

  // 創建訪客詢價單（無需認證）
  createGuest: (data: CreateInquiryRequest) => apiClientInstance.post('/api/inquiries/guest', data),

  // 更新詢價單
  update: (id: string, data: Record<string, unknown>) =>
    apiClientInstance.put(`/api/inquiries/${id}`, data),

  // 刪除詢價單
  delete: (id: string) => apiClientInstance.delete(`/api/inquiries/${id}`),

  // 獲取統計資料
  stats: () => apiClientInstance.get('/api/inquiries/stats'),
}
