/**
 * 統一 API 客戶端
 *
 * 提供全站統一的 API 調用接口,自動處理:
 * - CSRF token 管理
 * - 錯誤處理
 * - 請求/響應攔截
 */

'use client'

import { ApiResponse, ApiRequestOptions, ApiRequestData } from '@/types/infrastructure.types'
import {
  prepareHeaders as prepareHeadersCore,
  getCSRFTokenFromCookie,
} from './api/core/api-headers'

// ============================================
// 客戶端 API 錯誤類別
// ============================================

/**
 * API 錯誤基類
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}

/**
 * CSRF 錯誤
 */
export class CSRFError extends ApiError {
  constructor(message: string = 'CSRF 驗證失敗') {
    super(message, 403, 'CSRF_ERROR')
    this.name = 'CSRFError'
  }
}

// 從統一錯誤系統重新匯出 RateLimitError
export { RateLimitError } from './errors'

// 重新導出 React Hook (向後相容)
export { useApiCall } from './api/hooks/useApiCall'

// ============================================
// API 請求執行器
// ============================================

/**
 * 執行 API 請求
 */
async function executeRequest<T>(
  url: string,
  options: ApiRequestOptions & { method?: string },
  prepareHeaders: typeof prepareHeadersCore,
  timeout: number
): Promise<ApiResponse<T>> {
  const { method = 'GET', headers: customHeaders, body, skipCSRF = false } = options

  // 準備請求標頭
  const headers = prepareHeaders(customHeaders, skipCSRF, method)

  // 建立 AbortController 用於超時控制
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
      credentials: 'include',
    })

    clearTimeout(timeoutId)

    // 處理回應
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(
        errorData.message || errorData.error?.message || `HTTP ${response.status}`,
        response.status,
        errorData.code || errorData.error?.code
      )
    }

    return await response.json()
  } catch (error) {
    clearTimeout(timeoutId)

    if (error instanceof ApiError) {
      throw error
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('請求超時', 408, 'TIMEOUT')
      }
      throw new ApiError(error.message, 500, 'NETWORK_ERROR')
    }

    throw new ApiError('未知錯誤', 500, 'UNKNOWN_ERROR')
  }
}

// ============================================
// API 客戶端類
// ============================================

/**
 * 統一 API 客戶端類
 */
class ApiClient {
  private baseUrl: string
  private defaultTimeout: number

  constructor() {
    this.baseUrl =
      process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_URL || '' : ''
    this.defaultTimeout = 30000 // 30 秒
  }

  /**
   * GET 請求
   */
  async get<T = unknown>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    return executeRequest<T>(
      url,
      { ...options, method: 'GET' },
      prepareHeadersCore,
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
    return executeRequest<T>(
      url,
      {
        ...options,
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
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
    return executeRequest<T>(
      url,
      {
        ...options,
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
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
    return executeRequest<T>(
      url,
      {
        ...options,
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      prepareHeadersCore,
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
    return executeRequest<T>(
      url,
      { ...options, method: 'DELETE' },
      prepareHeadersCore,
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
    const { skipCSRF = false } = options

    // FormData 請求不需要設置 Content-Type
    const headers: Record<string, string> = {}

    // 添加 CSRF token
    if (!skipCSRF) {
      const csrfToken = getCSRFTokenFromCookie()
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken
      }
    }

    const formData =
      file instanceof File
        ? (() => {
            const fd = new FormData()
            fd.append('file', file)
            return fd
          })()
        : file

    // 建立 AbortController 用於超時控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        signal: controller.signal,
        credentials: 'include',
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}`,
          response.status,
          errorData.code
        )
      }

      return await response.json()
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof ApiError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('上傳超時', 408, 'TIMEOUT')
        }
        throw new ApiError(error.message, 500, 'UPLOAD_ERROR')
      }

      throw new ApiError('上傳失敗', 500, 'UNKNOWN_ERROR')
    }
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
