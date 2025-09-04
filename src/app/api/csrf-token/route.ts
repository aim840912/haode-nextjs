/**
 * CSRF Token API 端點
 *
 * 提供 CSRF token 的生成和刷新功能
 * 使用 double-submit cookie pattern 來防止 CSRF 攻擊
 */

import { NextRequest, NextResponse } from 'next/server'
import { CSRFTokenManager, validateOrigin } from '@/lib/auth-middleware'
import { apiLogger } from '@/lib/logger'
import { withErrorHandler } from '@/lib/error-handler'
import { success } from '@/lib/api-response'
import { AuthorizationError, MethodNotAllowedError } from '@/lib/errors'

/**
 * GET /api/csrf-token
 *
 * 生成新的 CSRF token 並設置為 cookie
 * 前端可以從響應標頭或 cookie 中獲取 token
 */
async function handleGET(request: NextRequest) {
  apiLogger.info('開始生成 CSRF token', {
    module: 'CSRFToken',
    action: 'GET',
  })

  // 驗證請求來源
  if (!validateOrigin(request)) {
    apiLogger.warn('CSRF token 請求來源驗證失敗', {
      module: 'CSRFToken',
      action: 'GET',
      metadata: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
    })
    throw new AuthorizationError('無效的請求來源')
  }

  // 檢查是否需要刷新現有 token
  const existingToken = request.cookies.get('csrf-token')?.value
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true'

  // 如果已有有效 token 且不強制刷新，返回現有 token
  if (existingToken && !forceRefresh && /^[a-f0-9]{64}$/.test(existingToken)) {
    apiLogger.info('使用現有 CSRF token', {
      module: 'CSRFToken',
      action: 'GET',
      metadata: { existingToken: true },
    })

    const response = NextResponse.json(
      {
        token: existingToken,
        success: true,
        message: '使用現有 CSRF token',
      },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': existingToken,
        },
      }
    )

    return response
  }

  // 生成新的 CSRF token
  const { token, headers } = CSRFTokenManager.createTokenResponse()

  // 創建響應
  const response = NextResponse.json(
    {
      token,
      success: true,
      message: '已生成新的 CSRF token',
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小時後過期
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    }
  )

  // 添加 CSRF token headers
  headers.forEach((value, key) => {
    response.headers.set(key, value)
  })

  apiLogger.info('已生成新的 CSRF token', {
    module: 'CSRFToken',
    action: 'GET',
    metadata: { newToken: true },
  })

  return response
}

/**
 * POST /api/csrf-token
 *
 * 驗證現有的 CSRF token
 * 主要用於測試和調試
 */
async function handlePOST(request: NextRequest) {
  apiLogger.info('開始驗證 CSRF token', {
    module: 'CSRFToken',
    action: 'POST',
  })

  // 驗證請求來源
  if (!validateOrigin(request)) {
    apiLogger.warn('CSRF token 驗證請求來源失敗', {
      module: 'CSRFToken',
      action: 'POST',
      metadata: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
    })
    throw new AuthorizationError('無效的請求來源')
  }

  // 驗證 CSRF token
  const validation = CSRFTokenManager.validateToken(request)

  if (!validation.isValid) {
    apiLogger.warn('CSRF token 驗證失敗', {
      module: 'CSRFToken',
      action: 'POST',
      metadata: {
        reason: validation.reason,
        debug:
          process.env.NODE_ENV === 'development'
            ? {
                method: request.method,
                headers: {
                  'x-csrf-token': request.headers.get('x-csrf-token'),
                  'X-CSRF-Token': request.headers.get('X-CSRF-Token'),
                },
                cookies: {
                  'csrf-token': request.cookies.get('csrf-token')?.value,
                },
              }
            : undefined,
      },
    })

    const error = new AuthorizationError('CSRF token 驗證失敗')
    // Add custom properties to error
    Object.assign(error, {
      reason: validation.reason,
      debug:
        process.env.NODE_ENV === 'development'
          ? {
              method: request.method,
              headers: {
                'x-csrf-token': request.headers.get('x-csrf-token'),
                'X-CSRF-Token': request.headers.get('X-CSRF-Token'),
              },
              cookies: {
                'csrf-token': request.cookies.get('csrf-token')?.value,
              },
            }
          : undefined,
    })
    throw error
  }

  const tokenValue = request.cookies.get('csrf-token')?.value

  apiLogger.info('CSRF token 驗證成功', {
    module: 'CSRFToken',
    action: 'POST',
    metadata: { hasToken: !!tokenValue },
  })

  return NextResponse.json(
    {
      success: true,
      message: 'CSRF token 驗證成功',
      token: tokenValue,
    },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * DELETE /api/csrf-token
 *
 * 清除 CSRF token（登出時使用）
 */
async function handleDELETE(request: NextRequest) {
  apiLogger.info('開始清除 CSRF token', {
    module: 'CSRFToken',
    action: 'DELETE',
  })

  // 驗證請求來源
  if (!validateOrigin(request)) {
    apiLogger.warn('CSRF token 清除請求來源失敗', {
      module: 'CSRFToken',
      action: 'DELETE',
      metadata: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      },
    })
    throw new AuthorizationError('無效的請求來源')
  }

  // 創建清除 cookie 的響應
  const response = NextResponse.json(
    {
      success: true,
      message: 'CSRF token 已清除',
    },
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  )

  // 設置過期的 cookie 來清除它
  response.cookies.set('csrf-token', '', {
    expires: new Date(0),
    path: '/',
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })

  apiLogger.info('CSRF token 已清除', {
    module: 'CSRFToken',
    action: 'DELETE',
  })

  return response
}

// 處理不支援的 HTTP 方法
async function handleUnsupportedMethod(request: NextRequest): Promise<never> {
  throw new MethodNotAllowedError('不支援的請求方法')
}

// 導出使用 withErrorHandler 中間件的處理器
export const GET = withErrorHandler(handleGET, { module: 'CSRFToken' })
export const POST = withErrorHandler(handlePOST, { module: 'CSRFToken' })
export const DELETE = withErrorHandler(handleDELETE, { module: 'CSRFToken' })
export const PUT = withErrorHandler(handleUnsupportedMethod, { module: 'CSRFToken' })
export const PATCH = withErrorHandler(handleUnsupportedMethod, { module: 'CSRFToken' })
