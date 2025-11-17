/**
 * API 標頭管理
 *
 * 負責準備和管理 API 請求標頭:
 * - Content-Type 設置
 * - CSRF token 注入
 * - 自訂標頭合併
 */

'use client'

import { apiLogger } from '@/lib/logger'

/**
 * 從 cookie 中獲取 CSRF token
 */
export function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null

  const cookies = document.cookie.split(';')
  const csrfCookie = cookies.find(cookie => cookie.trim().startsWith('csrf-token='))

  return csrfCookie ? csrfCookie.split('=')[1] : null
}

/**
 * 準備請求標頭
 */
export function prepareHeaders(
  headers: HeadersInit = {},
  skipCSRF = false,
  method = 'GET'
): HeadersInit {
  const preparedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...Object.fromEntries(
      headers instanceof Headers
        ? headers.entries()
        : Array.isArray(headers)
          ? headers
          : Object.entries(headers)
    ),
  }

  // 為寫入操作添加 CSRF token
  if (!skipCSRF && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase())) {
    const csrfToken = getCSRFTokenFromCookie()
    if (csrfToken) {
      preparedHeaders['X-CSRF-Token'] = csrfToken
    } else {
      apiLogger.warn('No CSRF token available for write operation', {
        module: 'api-client',
        action: 'prepareHeaders',
        metadata: { method, endpoint: 'unknown' },
      })
    }
  }

  return preparedHeaders
}
