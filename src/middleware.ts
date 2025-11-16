/**
 * Next.js 全域中間件
 *
 * 提供全站級別的安全保護，包括：
 * - Rate Limiting 保護
 * - CSRF 保護
 * - 來源驗證
 * - 安全標頭設置
 * - 審計日誌記錄
 */

import { NextRequest, NextResponse } from 'next/server'
import { getRateLimitConfig, ANTI_DDOS_LIMIT } from '@/config/rate-limits'
import { authLogger } from '@/lib/logger'
import { CSRFTokenManager, validateOrigin } from '@/lib/middleware/auth-middleware'
import { rateLimiter } from '@/lib/rate-limiter'

/**
 * 需要 CSRF 保護的路徑模式
 */
const CSRF_PROTECTED_PATHS = [
  '/api/inquiries',
  '/api/orders',
  '/api/payment',
  '/api/cart',
  '/api/upload',
  // 可以添加更多需要保護的路徑
]

/**
 * 排除 CSRF 檢查的路徑
 */
const CSRF_EXCLUDED_PATHS = [
  '/api/csrf-token',
  '/api/products', // 公開的產品 API（只讀）
  '/api/locations', // 公開的地點 API（只讀）
  '/api/moments', // 公開的精彩時刻 API（GET 請求）
  '/api/farm-tour', // 公開的農場導覽 API（GET 請求）
  '/api/schedule', // 公開的行程 API（GET 請求）
  '/api/payment/callback', // 支付回調（第三方調用）
  '/api/admin', // Admin API 使用 X-Admin-Key 驗證，不需要 CSRF 保護
  '/api/admin-proxy', // Admin Proxy 使用 Supabase 認證 + Admin Key 驗證，不需要 CSRF 保護
  '/_next/', // Next.js 內部請求
  '/favicon.ico',
  // 靜態資源
  '/images/',
  '/css/',
  '/js/',
]

/**
 * 檢查路徑是否需要 CSRF 保護
 */
function needsCSRFProtection(pathname: string, method: string): boolean {
  // GET, HEAD, OPTIONS 請求通常不需要 CSRF 保護
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return false
  }

  // 檢查是否在排除清單中
  if (CSRF_EXCLUDED_PATHS.some(excluded => pathname.startsWith(excluded))) {
    return false
  }

  // 檢查是否在保護清單中
  return CSRF_PROTECTED_PATHS.some(protectedPath => pathname.startsWith(protectedPath))
}

/**
 * 設置動態安全標頭
 * 注意：基本安全標頭已在 next.config.ts 中設置，這裡只處理動態標頭
 */
function setDynamicSecurityHeaders(response: NextResponse): NextResponse {
  // 設置請求 ID 用於審計追蹤（使用 Web Crypto API，Edge Runtime 支援）
  const requestId = crypto.randomUUID()
  response.headers.set('X-Request-ID', requestId)

  // 設置時間戳用於除錯
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('X-Middleware-Time', new Date().toISOString())
  }

  return response
}

/**
 * 記錄安全違反事件
 */
async function logSecurityViolation(
  request: NextRequest,
  type: 'csrf' | 'rate_limit' | 'origin',
  reason: string,
  details?: Record<string, unknown>
) {
  try {
    const clientInfo = {
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      origin: request.headers.get('origin') || 'none',
      referer: request.headers.get('referer') || 'none',
      path: request.nextUrl.pathname,
      method: request.method,
    }

    const logData = {
      type,
      reason,
      ...clientInfo,
      ...details,
      timestamp: new Date().toISOString(),
    }

    authLogger.warn(`${type.toUpperCase()} violation`, { metadata: logData })

    // 在生產環境中，可以發送到監控系統
    // 未來功能：整合 Sentry 或其他監控服務
    if (process.env.NODE_ENV === 'production') {
      // 可以在此處添加 Sentry 或其他監控系統的錯誤報告
      // 例如：Sentry.captureException(new Error(`Security violation: ${type}`))
    }
  } catch (error) {
    authLogger.error('Failed to log security violation', error as Error)
  }
}

/**
 * 主要中間件函數
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  try {
    // 創建基礎響應
    let response: NextResponse

    // === 第一階段：Rate Limiting 檢查 ===

    // 1. 檢查 Anti-DDoS 限制（全域 IP 限制）
    const antiDdosResult = await rateLimiter.checkRateLimit(request, ANTI_DDOS_LIMIT)
    if (!antiDdosResult.allowed) {
      await logSecurityViolation(request, 'rate_limit', 'Anti-DDoS triggered', {
        limit: antiDdosResult.limit,
        current: antiDdosResult.currentRequests,
        identifier: antiDdosResult.identifier,
      })

      return NextResponse.json(
        {
          error: 'IP 級別限制觸發，請聯絡技術支援',
          success: false,
          code: 'ANTI_DDOS_TRIGGERED',
        },
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil(ANTI_DDOS_LIMIT.windowMs / 1000).toString(),
            'X-RateLimit-Limit': antiDdosResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': antiDdosResult.resetTime.toString(),
          },
        }
      )
    }

    // 2. 檢查 API 路徑的特定 rate limiting
    if (pathname.startsWith('/api/')) {
      const rateLimitConfig = getRateLimitConfig(pathname)

      if (rateLimitConfig) {
        const rateLimitResult = await rateLimiter.checkRateLimit(request, rateLimitConfig)

        if (!rateLimitResult.allowed) {
          await logSecurityViolation(request, 'rate_limit', 'API rate limit exceeded', {
            path: pathname,
            limit: rateLimitResult.limit,
            current: rateLimitResult.currentRequests,
            identifier: rateLimitResult.identifier,
            strategy: rateLimitConfig.strategy,
          })

          return NextResponse.json(
            {
              error: '請求過於頻繁，請稍後再試',
              success: false,
              code: 'RATE_LIMIT_EXCEEDED',
              details: {
                limit: rateLimitResult.limit,
                remaining: rateLimitResult.remaining,
                resetTime: rateLimitResult.resetTime,
                retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
              },
            },
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': Math.ceil(rateLimitConfig.windowMs / 1000).toString(),
                'X-RateLimit-Limit': rateLimitResult.limit.toString(),
                'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
                'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
              },
            }
          )
        }

        // 為允許的請求準備 rate limit 標頭（稍後添加到回應中）
        response = NextResponse.next()
        if (rateLimitConfig.includeHeaders) {
          response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString())
          response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
          response.headers.set('X-RateLimit-Reset', rateLimitResult.resetTime.toString())
        }
      } else {
        response = NextResponse.next()
      }
    } else {
      response = NextResponse.next()
    }

    // === 第二階段：CSRF 保護檢查 ===

    // 檢查是否需要 CSRF 保護
    if (needsCSRFProtection(pathname, method)) {
      // 1. 驗證請求來源
      if (!validateOrigin(request)) {
        await logSecurityViolation(request, 'origin', 'Invalid origin')

        return NextResponse.json(
          {
            error: '無效的請求來源',
            success: false,
            code: 'INVALID_ORIGIN',
          },
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }

      // 2. 驗證 CSRF token
      const csrfValidation = CSRFTokenManager.validateToken(request)

      if (!csrfValidation.isValid) {
        await logSecurityViolation(
          request,
          'csrf',
          csrfValidation.reason || 'Token validation failed'
        )

        return NextResponse.json(
          {
            error: 'CSRF token 驗證失敗',
            success: false,
            code: 'CSRF_TOKEN_INVALID',
            details: process.env.NODE_ENV === 'development' ? csrfValidation.reason : undefined,
          },
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        )
      }
    }

    // === 第三階段：自動 CSRF Token 設置 ===

    // 為所有頁面請求自動設置 CSRF token
    if (
      pathname.startsWith('/') &&
      !pathname.startsWith('/api/') &&
      !pathname.startsWith('/_next/') &&
      method === 'GET'
    ) {
      const existingToken = request.cookies.get('csrf-token')?.value

      // 如果沒有 token 或 token 無效，生成新的
      if (!existingToken || !/^[a-f0-9]{64}$/.test(existingToken)) {
        const { token: _token, headers } = CSRFTokenManager.createTokenResponse()

        headers.forEach((value, key) => {
          response.headers.set(key, value)
        })
      }
    }

    // === 第四階段：動態安全標頭設置 ===
    response = setDynamicSecurityHeaders(response)

    return response
  } catch (error) {
    authLogger.error('Middleware error', error as Error)

    // 發生錯誤時，仍然繼續處理請求，但記錄錯誤
    const response = NextResponse.next()
    return setDynamicSecurityHeaders(response)
  }
}

/**
 * 中間件配置
 * 定義哪些路徑需要經過中間件處理
 *
 * 優化策略：只匹配需要安全保護的路徑
 * - API routes: 需要 rate limiting 和 CSRF 保護
 * - 認證相關頁面: login, register, profile 等
 * - 管理員頁面: /admin/*
 *
 * 排除公開頁面以減少 Function Invocations：
 * - 首頁 (/)
 * - 產品列表 (/products)
 * - 地點列表 (/locations)
 * - 農場導覽 (/farm-tour)
 * - 行程表 (/schedule)
 * - 搜尋頁 (/search)
 */
export const config = {
  matcher: [
    // API routes - 需要 rate limiting 和 CSRF 保護
    '/api/:path*',

    // 認證相關頁面 - 需要 CSRF token 設置
    '/login',
    '/register',
    '/forgot-password',
    '/verify-email',
    '/auth/:path*',

    // 用戶功能頁面 - 需要認證和 CSRF 保護
    '/profile',
    '/inquiries/:path*',
    '/inquiry/:path*',
    '/orders/:path*',

    // 管理員頁面 - 需要完整安全保護
    '/admin/:path*',
  ],
}

// 導出配置供測試使用
export const middlewareConfig = {
  CSRF_PROTECTED_PATHS,
  CSRF_EXCLUDED_PATHS,
  needsCSRFProtection,
}
