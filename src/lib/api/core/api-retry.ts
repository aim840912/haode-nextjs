/**
 * API 重試邏輯
 *
 * 提供智慧重試機制:
 * - 指數退避策略
 * - Rate Limit 自動重試
 * - 錯誤分類處理
 */

'use client'

import { apiLogger } from '@/lib/logger'
import { ApiResponse, ApiRequestOptions } from '@/types/infrastructure.types'
import { ApiError, CSRFError, RateLimitError } from './api-errors'

/**
 * 創建帶超時的 fetch
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
    })

    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * 處理 API 錯誤
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: {
    error?: string | { message?: string; code?: string; type?: string }
    code?: string
    details?: string
  }

  try {
    errorData = await response.json()
  } catch {
    errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
  }

  // 正確處理錯誤訊息：伺服器可能返回物件或字串格式
  const message =
    typeof errorData.error === 'object' && errorData.error?.message
      ? errorData.error.message
      : typeof errorData.error === 'string'
        ? errorData.error
        : `Request failed with status ${response.status}`
  const code =
    typeof errorData.error === 'object' && errorData.error?.code
      ? errorData.error.code
      : errorData.code
  const details = errorData.details

  // 特殊處理 CSRF 錯誤
  if (response.status === 403 && (code === 'CSRF_TOKEN_INVALID' || code === 'INVALID_ORIGIN')) {
    throw new CSRFError(message)
  }

  // 特殊處理 Rate Limit 錯誤
  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
    const limit = parseInt(response.headers.get('X-RateLimit-Limit') || '0')
    const remaining = parseInt(response.headers.get('X-RateLimit-Remaining') || '0')
    const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0')

    throw new RateLimitError(message, retryAfter, limit, remaining, resetTime)
  }

  throw new ApiError(message, response.status, code, details)
}

/**
 * 執行帶重試的請求
 */
export async function executeWithRetry<T>(
  url: string,
  options: ApiRequestOptions,
  prepareHeaders: (headers: HeadersInit, skipCSRF: boolean, method: string) => HeadersInit,
  defaultRetries: number,
  defaultRetryDelay: number,
  defaultTimeout: number
): Promise<ApiResponse<T>> {
  const {
    skipCSRF = false,
    retries = defaultRetries,
    retryDelay = defaultRetryDelay,
    timeout = defaultTimeout,
    rateLimitRetry = true,
    maxRetryWait = 60000, // 預設最多等待 60 秒
    ...fetchOptions
  } = options

  const method = fetchOptions.method || 'GET'
  let lastError: Error

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const headers = prepareHeaders(fetchOptions.headers || {}, skipCSRF, method)

      const response = await fetchWithTimeout(
        url,
        {
          ...fetchOptions,
          headers,
        },
        timeout
      )

      if (!response.ok) {
        await handleApiError(response)
      }

      const data = await response.json()
      return data as ApiResponse<T>
    } catch (error) {
      lastError = error as Error

      // 不重試的錯誤類型（客戶端錯誤）
      if (
        error instanceof CSRFError ||
        (error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status))
      ) {
        throw error
      }

      // 特殊處理 Rate Limit 錯誤
      if (error instanceof RateLimitError) {
        // 檢查是否啟用了 rate limit 重試
        if (rateLimitRetry && attempt < retries) {
          const waitTime = Math.min(error.retryAfter * 1000, maxRetryWait)
          apiLogger.warn('Rate limit exceeded, retrying after delay', {
            module: 'api-client',
            action: 'executeWithRetry',
            metadata: {
              attempt: attempt + 1,
              maxAttempts: retries + 1,
              waitTime,
              rateLimitInfo: {
                limit: error.limit,
                remaining: error.remaining,
                resetTime: new Date(error.resetTime * 1000).toLocaleTimeString(),
              },
            },
          })
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
        // 如果不啟用重試或重試次數用完,拋出錯誤
        throw error
      }

      // 其他錯誤的重試邏輯（網路錯誤、5xx 錯誤等）
      if (attempt < retries) {
        apiLogger.warn('API request failed, retrying', {
          module: 'api-client',
          action: 'executeWithRetry',
          metadata: {
            attempt: attempt + 1,
            maxAttempts: retries + 1,
            error: (error as Error).message,
            url,
          },
        })
        const exponentialBackoff = retryDelay * Math.pow(2, attempt)
        await new Promise(resolve => setTimeout(resolve, exponentialBackoff))
        continue
      }
    }
  }

  throw lastError!
}
