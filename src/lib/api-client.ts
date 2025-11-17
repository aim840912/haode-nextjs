/**
 * 統一 API 客戶端
 *
 * 提供全站統一的 API 調用接口,自動處理:
 * - CSRF token 管理
 * - 錯誤處理和重試
 * - 請求/響應攔截
 * - 載入狀態管理
 */

'use client'

import { ApiResponse, ApiRequestOptions, ApiRequestData } from '@/types/infrastructure.types'
import {
  prepareHeaders as prepareHeadersCore,
  getCSRFTokenFromCookie,
} from './api/core/api-headers'
import { executeWithRetry } from './api/core/api-retry'

// 重新導出錯誤類別 (向後相容)
export { ApiError, CSRFError, RateLimitError } from './api/core/api-errors'

// 重新導出 React Hook (向後相容)
export { useApiCall } from './api/hooks/useApiCall'

/**
 * 統一 API 客戶端類
 */
class ApiClient {
  private baseUrl: string
  private defaultTimeout: number
  private defaultRetries: number
  private defaultRetryDelay: number

  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_URL || '' : ''
    this.defaultTimeout = 30000 // 30 秒
    this.defaultRetries = 2 // 增加預設重試次數
    this.defaultRetryDelay = 1000 // 1 秒
  }

  /**
   * GET 請求
   */
  async get<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeWithRetry<T>(
      url,
      {
        ...options,
        method: 'GET',
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }

  /**
   * POST 請求
   */
  async post<T = unknown>(
    endpoint: string,
    data?: ApiRequestData,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeWithRetry<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }

  /**
   * PUT 請求
   */
  async put<T = unknown>(
    endpoint: string,
    data?: ApiRequestData,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeWithRetry<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }

  /**
   * PATCH 請求
   */
  async patch<T = unknown>(
    endpoint: string,
    data?: ApiRequestData,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeWithRetry<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }

  /**
   * DELETE 請求
   */
  async delete<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeWithRetry<T>(
      url,
      {
        ...options,
        method: 'DELETE',
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }

  /**
   * 上傳檔案
   */
  async upload<T = unknown>(
    endpoint: string,
    file: File | FormData,
    options: Omit<ApiRequestOptions, 'body'> = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const { skipCSRF = false, ...otherOptions } = options

    // FormData 請求不需要設置 Content-Type
    const headers: Record<string, string> = {}

    // 添加 CSRF token
    if (!skipCSRF) {
      const csrfToken = getCSRFTokenFromCookie()
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }
    }

    return executeWithRetry<T>(
      url,
      {
        ...otherOptions,
        method: 'POST',
        headers,
        body:
          file instanceof File
            ? (() => {
                const formData = new FormData()
                formData.append('file', file)
                return formData
              })()
            : file,
      },
      prepareHeadersCore,
      this.defaultRetries,
      this.defaultRetryDelay,
      this.defaultTimeout
    )
  }
}

// 導出單例實例
export const apiClient = new ApiClient()

/**
 * 便捷的 API 調用函數
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    apiClient.get<T>(endpoint, options),

  post: <T = unknown>(endpoint: string, data?: ApiRequestData, options?: ApiRequestOptions) =>
    apiClient.post<T>(endpoint, data, options),

  put: <T = unknown>(endpoint: string, data?: ApiRequestData, options?: ApiRequestOptions) =>
    apiClient.put<T>(endpoint, data, options),

  patch: <T = unknown>(endpoint: string, data?: ApiRequestData, options?: ApiRequestOptions) =>
    apiClient.patch<T>(endpoint, data, options),

  delete: <T = unknown>(endpoint: string, options?: ApiRequestOptions) =>
    apiClient.delete<T>(endpoint, options),

  upload: <T = unknown>(
    endpoint: string,
    file: File | FormData,
    options?: Omit<ApiRequestOptions, 'body'>
  ) => apiClient.upload<T>(endpoint, file, options),
}

// 導入並注入 apiClient 實例到端點模組
import { setApiClient as setInquiryApiClient, inquiryApi } from './api/endpoints/inquiry-api'
import {
  setApiClient as setInquiryTemplateApiClient,
  inquiryTemplateApi,
} from './api/endpoints/inquiry-template-api'

setInquiryApiClient(apiClient)
setInquiryTemplateApiClient(apiClient)

// 重新導出端點 API (向後相容)
export { inquiryApi, inquiryTemplateApi }
