/**
 * @api {get} /api/debug/auth-status 取得認證狀態（除錯用）
 * @apiName GetAuthStatus
 * @apiGroup Debug
 * @apiPermission public
 *
 * @apiDescription 顯示當前的認證狀態、CSRF token 資訊和診斷建議。只在開發和測試環境啟用
 *
 * @apiSuccess {Object} authStatus 認證狀態資訊
 * @apiSuccess {Object} authStatus.origin 來源驗證資訊
 * @apiSuccess {String} authStatus.origin.value 請求來源
 * @apiSuccess {Boolean} authStatus.origin.valid 來源是否有效
 * @apiSuccess {Object} authStatus.csrf CSRF token 資訊
 * @apiSuccess {Boolean} authStatus.csrf.hasHeaderToken 是否有標頭 token
 * @apiSuccess {Boolean} authStatus.csrf.hasCookieToken 是否有 cookie token
 * @apiSuccess {Boolean} authStatus.csrf.tokensMatch token 是否匹配
 * @apiSuccess {Boolean} authStatus.csrf.validFormat token 格式是否有效
 * @apiSuccess {Object[]} authStatus.cookies Cookie 列表
 * @apiSuccess {Object} authStatus.environment 環境變數資訊
 * @apiSuccess {Object} diagnostics 診斷資訊
 * @apiSuccess {String[]} diagnostics.issues 發現的問題
 * @apiSuccess {String[]} diagnostics.recommendations 建議解決方案
 *
 * @apiSuccessExample {json} 成功回應:
 * {
 *   "authStatus": {
 *     "origin": {
 *       "value": "http://localhost:3000",
 *       "valid": true,
 *       "referer": "http://localhost:3000/admin",
 *       "host": "localhost:3000"
 *     },
 *     "csrf": {
 *       "hasHeaderToken": true,
 *       "hasCookieToken": true,
 *       "headerToken": "a1b2c3d4...",
 *       "cookieToken": "a1b2c3d4...",
 *       "tokensMatch": true,
 *       "validFormat": true
 *     },
 *     "cookies": [
 *       {"name": "csrf-token", "value": "a1b2c3d4..."}
 *     ],
 *     "environment": {
 *       "NODE_ENV": "development",
 *       "VERCEL": "not set"
 *     }
 *   },
 *   "diagnostics": {
 *     "issues": [],
 *     "recommendations": []
 *   },
 *   "message": "Auth status retrieved successfully. This endpoint is for debugging only."
 * }
 *
 * @apiError (404) NotFoundError 在生產環境中端點被停用
 *
 * @apiErrorExample {json} 生產環境錯誤:
 * {
 *   "success": false,
 *   "message": "Debug endpoint is disabled in production",
 *   "error": {
 *     "code": "NOT_FOUND"
 *   }
 * }
 */

/**
 * @api {post} /api/debug/auth-status 測試 CSRF 保護（除錯用）
 * @apiName TestCSRFProtection
 * @apiGroup Debug
 * @apiPermission public
 *
 * @apiDescription 測試來源驗證和 CSRF token 驗證功能。只在開發和測試環境啟用
 *
 * @apiHeader {String} X-CSRF-Token CSRF token
 * @apiHeader {String} Cookie 包含 csrf-token 的 cookie
 *
 * @apiSuccess {String} message 回應訊息
 * @apiSuccess {Object} data 測試結果
 * @apiSuccess {Object} data.testResults 測試結果詳情
 * @apiSuccess {Object} data.testResults.originValidation 來源驗證結果
 * @apiSuccess {Boolean} data.testResults.originValidation.passed 是否通過
 * @apiSuccess {Object} data.testResults.csrfValidation CSRF 驗證結果
 * @apiSuccess {Boolean} data.testResults.csrfValidation.passed 是否通過
 * @apiSuccess {String} data.testResults.overallStatus 整體狀態 (PASS/FAIL)
 *
 * @apiSuccessExample {json} 測試通過:
 * {
 *   "success": true,
 *   "message": "CSRF 保護測試完成",
 *   "data": {
 *     "testResults": {
 *       "originValidation": {
 *         "passed": true,
 *         "origin": "http://localhost:3000"
 *       },
 *       "csrfValidation": {
 *         "passed": true,
 *         "reason": "Valid"
 *       },
 *       "overallStatus": "PASS"
 *     },
 *     "message": "CSRF protection test PASS"
 *   }
 * }
 *
 * @apiError (404) NotFoundError 在生產環境中端點被停用
 */

import { NextRequest, NextResponse } from 'next/server'
import { success } from '@/lib/api-response'
import { NotFoundError } from '@/lib/errors'
import { apiLogger } from '@/lib/logger'
import { CSRFTokenManager, validateOrigin } from '@/lib/middleware/auth-middleware'
import { withErrorHandler } from '@/lib/middleware/error-handler'

/**
 * 調試端點：顯示當前的認證狀態
 * 只在開發和測試環境啟用
 */
async function handleGET(request: NextRequest) {
  apiLogger.info('除錯認證狀態查詢', {
    module: 'DebugAuthStatus',
    action: 'GET',
  })

  // 安全檢查：只在非生產環境啟用
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    apiLogger.warn('生產環境中嘗試存取除錯端點', {
      module: 'DebugAuthStatus',
      action: 'GET',
    })
    throw new NotFoundError('Debug endpoint is disabled in production')
  }

  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  const userAgent = request.headers.get('user-agent')

  // 提取 CSRF tokens
  const { headerToken, cookieToken } = CSRFTokenManager.extractTokens(request)

  // 驗證來源
  const originValid = validateOrigin(request)

  // 收集所有 cookies
  const cookies = request.cookies.getAll().map(cookie => ({
    name: cookie.name,
    value: cookie.name === 'csrf-token' ? `${cookie.value.substring(0, 8)}...` : '***',
  }))

  // 環境資訊
  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    CSRF_ALLOWED_ORIGINS: process.env.CSRF_ALLOWED_ORIGINS || 'not set',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'not set',
  }

  // 認證狀態
  const authStatus = {
    origin: {
      value: origin || 'null',
      valid: originValid,
      referer: referer || 'null',
      host: host || 'null',
    },
    csrf: {
      hasHeaderToken: !!headerToken,
      hasCookieToken: !!cookieToken,
      headerToken: headerToken ? `${headerToken.substring(0, 8)}...` : null,
      cookieToken: cookieToken ? `${cookieToken.substring(0, 8)}...` : null,
      tokensMatch: headerToken === cookieToken,
      validFormat: headerToken ? /^[a-f0-9]{64}$/.test(headerToken) : false,
    },
    cookies: cookies,
    headers: {
      userAgent: userAgent || 'null',
      contentType: request.headers.get('content-type') || 'null',
    },
    environment,
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method,
  }

  // 新增診斷建議
  const diagnostics = {
    issues: [] as string[],
    recommendations: [] as string[],
  }

  if (!originValid) {
    diagnostics.issues.push('Origin validation failed')
    diagnostics.recommendations.push(
      'Add your domain to CSRF_ALLOWED_ORIGINS environment variable in Vercel'
    )
  }

  if (!cookieToken) {
    diagnostics.issues.push('CSRF cookie not found')
    diagnostics.recommendations.push(
      'Ensure cookies are enabled and the domain is correct',
      'Check if CSRF token endpoint (/api/csrf-token) is accessible'
    )
  }

  if (!headerToken && request.method !== 'GET') {
    diagnostics.issues.push('CSRF header token missing for non-GET request')
    diagnostics.recommendations.push(
      'Ensure x-csrf-token header is included in requests',
      'Check if useCSRFToken hook is properly initialized'
    )
  }

  if (headerToken && cookieToken && headerToken !== cookieToken) {
    diagnostics.issues.push('CSRF token mismatch')
    diagnostics.recommendations.push(
      'Clear cookies and reload the page',
      'Check for multiple domains or subdomains causing cookie conflicts'
    )
  }

  const result = {
    authStatus,
    diagnostics,
    message: 'Auth status retrieved successfully. This endpoint is for debugging only.',
  }

  apiLogger.info('除錯認證狀態查詢完成', {
    module: 'DebugAuthStatus',
    action: 'GET',
    metadata: {
      originValid: result.authStatus.origin.valid,
      hasCSRFToken: result.authStatus.csrf.hasCookieToken,
      issueCount: result.diagnostics.issues.length,
    },
  })

  const response = NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })

  return response
}

/**
 * POST 端點：測試 CSRF 保護
 */
async function handlePOST(request: NextRequest) {
  apiLogger.info('除錯 CSRF 保護測試', {
    module: 'DebugAuthStatus',
    action: 'POST',
  })

  // 安全檢查：只在非生產環境啟用
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    apiLogger.warn('生產環境中嘗試存取除錯端點 POST', {
      module: 'DebugAuthStatus',
      action: 'POST',
    })
    throw new NotFoundError('Debug endpoint is disabled in production')
  }

  // 測試 origin 驗證
  const originValid = validateOrigin(request)

  // 測試 CSRF token 驗證
  const csrfValidation = CSRFTokenManager.validateToken(request)

  const testResults = {
    originValidation: {
      passed: originValid,
      origin: request.headers.get('origin') || 'null',
      referer: request.headers.get('referer') || 'null',
    },
    csrfValidation: {
      passed: csrfValidation.isValid,
      reason: csrfValidation.reason || 'Valid',
    },
    overallStatus: originValid && csrfValidation.isValid ? 'PASS' : 'FAIL',
  }

  const result = {
    testResults,
    message: `CSRF protection test ${testResults.overallStatus}`,
  }

  apiLogger.info('CSRF 保護測試完成', {
    module: 'DebugAuthStatus',
    action: 'POST',
    metadata: {
      overallStatus: testResults.overallStatus,
      originValidation: testResults.originValidation.passed,
      csrfValidation: testResults.csrfValidation.passed,
    },
  })

  return success(result, 'CSRF 保護測試完成')
}

// 導出使用 withErrorHandler 中間件的處理器
export const GET = withErrorHandler(handleGET, { module: 'DebugAuthStatus' })
export const POST = withErrorHandler(handlePOST, { module: 'DebugAuthStatus' })
