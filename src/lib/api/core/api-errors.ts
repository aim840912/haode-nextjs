/**
 * API 錯誤類別定義
 *
 * 提供統一的錯誤處理機制:
 * - ApiError: 通用 API 錯誤
 * - CSRFError: CSRF token 驗證失敗
 * - RateLimitError: 請求頻率超限
 */

'use client'

/**
 * API 錯誤類
 */
export class ApiError extends Error {
  public status: number
  public code?: string
  public details?: string

  constructor(message: string, status: number, code?: string, details?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

/**
 * CSRF 錯誤類
 */
export class CSRFError extends ApiError {
  constructor(message: string = 'CSRF token validation failed') {
    super(message, 403, 'CSRF_TOKEN_INVALID')
    this.name = 'CSRFError'
  }
}

/**
 * Rate Limit 錯誤類
 */
export class RateLimitError extends ApiError {
  public retryAfter: number
  public limit: number
  public remaining: number
  public resetTime: number

  constructor(
    message: string = 'Rate limit exceeded',
    retryAfter: number = 60,
    limit: number = 0,
    remaining: number = 0,
    resetTime: number = 0
  ) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
    this.name = 'RateLimitError'
    this.retryAfter = retryAfter
    this.limit = limit
    this.remaining = remaining
    this.resetTime = resetTime
  }
}
