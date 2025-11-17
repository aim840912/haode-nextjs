/**
 * 詢價範本 API 客戶端
 *
 * 提供詢價範本相關的 API 端點封裝:
 * - 列表查詢 (支援類型、狀態篩選)
 * - 單筆查詢
 * - 建立/更新/刪除
 * - 使用範本
 */

'use client'

import { ApiResponse, ApiRequestOptions, ApiRequestData } from '@/types/infrastructure.types'

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

export const inquiryTemplateApi = {
  // 列出範本
  list: (params?: {
    inquiry_type?: 'product' | 'farm_tour'
    is_active?: boolean
    is_favorite?: boolean
    limit?: number
    offset?: number
    sort_by?: 'created_at' | 'updated_at' | 'usage_count' | 'name'
    sort_order?: 'asc' | 'desc'
  }) => {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const endpoint = `/api/inquiry-templates${searchParams.toString() ? `?${searchParams}` : ''}`
    return apiClientInstance.get(endpoint)
  },

  // 獲取單一範本
  get: (id: string) => apiClientInstance.get(`/api/inquiry-templates/${id}`),

  // 建立範本
  create: (data: Record<string, unknown>) => apiClientInstance.post('/api/inquiry-templates', data),

  // 更新範本
  update: (id: string, data: Record<string, unknown>) =>
    apiClientInstance.put(`/api/inquiry-templates/${id}`, data),

  // 刪除範本
  delete: (id: string) => apiClientInstance.delete(`/api/inquiry-templates/${id}`),

  // 使用範本（取得表單資料）
  use: (id: string) => apiClientInstance.post(`/api/inquiry-templates/${id}/use`, {}),
}
