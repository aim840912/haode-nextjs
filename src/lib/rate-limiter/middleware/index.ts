/**
 * Rate Limiter Middleware
 *
 * 提供便利的中間件工廠函數
 */

import { NextRequest, NextResponse } from 'next/server'
import { RateLimiter } from '../core/RateLimiter'
import type { RateLimitConfig } from '../types'

// 創建全域 Rate Limiter 實例
const rateLimiter = new RateLimiter()

/**
 * 創建 Rate Limiting 中間件
 *
 * @param config - Rate Limit 配置
 * @returns Next.js 中間件函數
 *
 * @example
 * ```typescript
 * export const middleware = createRateLimitMiddleware({
 *   maxRequests: 100,
 *   windowMs: 60000,
 *   strategy: IdentifierStrategy.IP
 * })
 * ```
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const result = await rateLimiter.checkRateLimit(request, config)

    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: '請求過於頻繁,請稍後再試',
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
            identifier: result.identifier.startsWith('combined:') ? 'combined' : result.identifier,
          },
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            ...(config.includeHeaders && {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
            }),
          },
        }
      )

      return response
    }

    // 如果請求被允許,可以在這裡添加 rate limit 標頭
    if (config.includeHeaders) {
      // 需要修改原始 response,但在中間件中我們只能返回 null 來繼續
      // Rate limit headers 會在路由處理器中添加
      return null
    }

    return null // 繼續處理請求
  }
}

/**
 * 為 API 路由創建包裝器
 *
 * @param handler - API 路由處理函數
 * @param config - Rate Limit 配置
 * @returns 包裝後的處理函數
 *
 * @example
 * ```typescript
 * export const POST = withRateLimit(handlePOST, {
 *   maxRequests: 5,
 *   windowMs: 60000,
 *   strategy: IdentifierStrategy.COMBINED
 * })
 * ```
 */
export function wrapHandler<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return (async (...args: Parameters<T>) => {
    const request = args[0] as NextRequest
    const result = await rateLimiter.checkRateLimit(request, config)

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: '請求過於頻繁,請稍後再試',
          success: false,
          code: 'RATE_LIMIT_EXCEEDED',
          details: {
            limit: result.limit,
            remaining: result.remaining,
            resetTime: result.resetTime,
          },
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(config.windowMs / 1000).toString(),
            ...(config.includeHeaders && {
              'X-RateLimit-Limit': result.limit.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
            }),
          },
        }
      )
    }

    // 調用原始處理器
    const response = await handler(...args)

    // 添加 rate limit 標頭到成功回應
    if (config.includeHeaders && response.headers) {
      response.headers.set('X-RateLimit-Limit', result.limit.toString())
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString())
    }

    return response
  }) as T
}

// 重載:專門處理 ApiHandler 類型
export function withRateLimit(
  handler: (request: NextRequest, params?: unknown) => Promise<Response | NextResponse>,
  config: RateLimitConfig
): (request: NextRequest, params?: unknown) => Promise<Response | NextResponse>

// 重載:處理一般泛型函數
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T

// 實作
export function withRateLimit<T extends (...args: unknown[]) => Promise<Response | NextResponse>>(
  handler: T,
  config: RateLimitConfig
): T {
  return wrapHandler(handler, config)
}

// 匯出 Rate Limiter 實例供進階使用
export { rateLimiter }
