import { NextRequest, NextResponse } from 'next/server';
import { CSRFTokenManager, validateOrigin } from '@/lib/auth-middleware';

/**
 * 調試端點：顯示當前的認證狀態
 * 只在開發和測試環境啟用
 */
export async function GET(request: NextRequest) {
  // 安全檢查：只在非生產環境啟用
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production' },
      { status: 404 }
    );
  }

  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const userAgent = request.headers.get('user-agent');
  
  // 提取 CSRF tokens
  const { headerToken, cookieToken } = CSRFTokenManager.extractTokens(request);
  
  // 驗證來源
  const originValid = validateOrigin(request);
  
  // 收集所有 cookies
  const cookies = request.cookies.getAll().map(cookie => ({
    name: cookie.name,
    value: cookie.name === 'csrf-token' ? `${cookie.value.substring(0, 8)}...` : '***'
  }));
  
  // 環境資訊
  const environment = {
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL || 'not set',
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
    CSRF_ALLOWED_ORIGINS: process.env.CSRF_ALLOWED_ORIGINS || 'not set',
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'not set'
  };
  
  // 認證狀態
  const authStatus = {
    origin: {
      value: origin || 'null',
      valid: originValid,
      referer: referer || 'null',
      host: host || 'null'
    },
    csrf: {
      hasHeaderToken: !!headerToken,
      hasCookieToken: !!cookieToken,
      headerToken: headerToken ? `${headerToken.substring(0, 8)}...` : null,
      cookieToken: cookieToken ? `${cookieToken.substring(0, 8)}...` : null,
      tokensMatch: headerToken === cookieToken,
      validFormat: headerToken ? /^[a-f0-9]{64}$/.test(headerToken) : false
    },
    cookies: cookies,
    headers: {
      userAgent: userAgent || 'null',
      contentType: request.headers.get('content-type') || 'null'
    },
    environment,
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
    method: request.method
  };
  
  // 新增診斷建議
  const diagnostics = {
    issues: [] as string[],
    recommendations: [] as string[]
  };
  
  if (!originValid) {
    diagnostics.issues.push('Origin validation failed');
    diagnostics.recommendations.push(
      'Add your domain to CSRF_ALLOWED_ORIGINS environment variable in Vercel'
    );
  }
  
  if (!cookieToken) {
    diagnostics.issues.push('CSRF cookie not found');
    diagnostics.recommendations.push(
      'Ensure cookies are enabled and the domain is correct',
      'Check if CSRF token endpoint (/api/csrf-token) is accessible'
    );
  }
  
  if (!headerToken && request.method !== 'GET') {
    diagnostics.issues.push('CSRF header token missing for non-GET request');
    diagnostics.recommendations.push(
      'Ensure x-csrf-token header is included in requests',
      'Check if useCSRFToken hook is properly initialized'
    );
  }
  
  if (headerToken && cookieToken && headerToken !== cookieToken) {
    diagnostics.issues.push('CSRF token mismatch');
    diagnostics.recommendations.push(
      'Clear cookies and reload the page',
      'Check for multiple domains or subdomains causing cookie conflicts'
    );
  }
  
  return NextResponse.json({
    success: true,
    authStatus,
    diagnostics,
    message: 'Auth status retrieved successfully. This endpoint is for debugging only.'
  }, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}

/**
 * POST 端點：測試 CSRF 保護
 */
export async function POST(request: NextRequest) {
  // 安全檢查：只在非生產環境啟用
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG_ENDPOINTS) {
    return NextResponse.json(
      { error: 'Debug endpoint is disabled in production' },
      { status: 404 }
    );
  }
  
  // 測試 origin 驗證
  const originValid = validateOrigin(request);
  
  // 測試 CSRF token 驗證
  const csrfValidation = CSRFTokenManager.validateToken(request);
  
  const testResults = {
    originValidation: {
      passed: originValid,
      origin: request.headers.get('origin') || 'null',
      referer: request.headers.get('referer') || 'null'
    },
    csrfValidation: {
      passed: csrfValidation.isValid,
      reason: csrfValidation.reason || 'Valid'
    },
    overallStatus: originValid && csrfValidation.isValid ? 'PASS' : 'FAIL'
  };
  
  return NextResponse.json({
    success: true,
    testResults,
    message: `CSRF protection test ${testResults.overallStatus}`
  });
}