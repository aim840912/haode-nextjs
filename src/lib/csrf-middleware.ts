/**
 * CSRF 中間件輔助函數
 * 
 * 為個別 API 路由提供額外的 CSRF 保護功能
 * 注意：全域 middleware 已經提供基礎保護，這些函數用於特殊情況
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFTokenManager, validateOrigin } from '@/lib/auth-middleware';
import { authLogger } from '@/lib/logger';

/**
 * CSRF 驗證結果
 */
interface CSRFValidationResult {
  isValid: boolean;
  error?: string;
  response?: NextResponse;
}

/**
 * 高級 CSRF 驗證
 * 除了基本的 token 驗證，還包括額外的安全檢查
 */
export async function validateCSRFAdvanced(request: NextRequest): Promise<CSRFValidationResult> {
  try {
    // 1. 基本的來源驗證
    if (!validateOrigin(request)) {
      return {
        isValid: false,
        error: '無效的請求來源',
        response: NextResponse.json(
          { 
            error: '無效的請求來源',
            success: false,
            code: 'INVALID_ORIGIN'
          },
          { status: 403 }
        )
      };
    }

    // 2. CSRF token 驗證
    const tokenValidation = CSRFTokenManager.validateToken(request);
    
    if (!tokenValidation.isValid) {
      return {
        isValid: false,
        error: tokenValidation.reason || 'CSRF token 驗證失敗',
        response: NextResponse.json(
          { 
            error: 'CSRF token 驗證失敗',
            success: false,
            code: 'CSRF_TOKEN_INVALID',
            details: process.env.NODE_ENV === 'development' 
              ? tokenValidation.reason 
              : undefined
          },
          { status: 403 }
        )
      };
    }

    // 3. 額外的安全檢查：檢查 User-Agent
    const userAgent = request.headers.get('user-agent');
    if (!userAgent || userAgent.length < 10) {
      authLogger.warn('CSRF Suspicious request with invalid User-Agent', { metadata: {
        userAgent,
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        path: request.nextUrl.pathname
      } });
      
      // 在生產環境中可能要阻擋這種請求
      if (process.env.NODE_ENV === 'production') {
        return {
          isValid: false,
          error: '無效的請求標頭',
          response: NextResponse.json(
            { 
              error: '請求被拒絕',
              success: false,
              code: 'INVALID_HEADERS'
            },
            { status: 403 }
          )
        };
      }
    }

    return { isValid: true };

  } catch (error) {
    authLogger.error('CSRF validation error', error);
    
    return {
      isValid: false,
      error: '驗證過程發生錯誤',
      response: NextResponse.json(
        { 
          error: '安全驗證失敗',
          success: false,
          code: 'VALIDATION_ERROR'
        },
        { status: 500 }
      )
    };
  }
}

/**
 * CSRF 中間件包裝器
 * 用於包裝現有的 API 路由處理函數
 */
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    skipMethods?: string[];
    advanced?: boolean;
  } = {}
) {
  const { skipMethods = ['GET', 'HEAD', 'OPTIONS'], advanced = false } = options;

  return async (request: NextRequest): Promise<NextResponse> => {
    // 跳過不需要 CSRF 保護的方法
    if (skipMethods.includes(request.method)) {
      return handler(request);
    }

    // 執行 CSRF 驗證
    const validation = advanced 
      ? await validateCSRFAdvanced(request)
      : (() => {
          const tokenValidation = CSRFTokenManager.validateToken(request);
          return {
            isValid: tokenValidation.isValid,
            response: tokenValidation.isValid ? undefined : NextResponse.json(
              { error: 'CSRF 驗證失敗', success: false },
              { status: 403 }
            )
          };
        })();

    if (!validation.isValid) {
      return validation.response || NextResponse.json(
        { error: 'CSRF 驗證失敗', success: false },
        { status: 403 }
      );
    }

    // 驗證通過，執行原始處理函數
    return handler(request);
  };
}

/**
 * 為 API 路由創建 CSRF 保護的便捷函數
 */
export const createProtectedHandler = {
  /**
   * 創建受 CSRF 保護的 POST 處理器
   */
  post: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withCSRFProtection(handler, { skipMethods: ['GET', 'HEAD', 'OPTIONS'] }),

  /**
   * 創建受 CSRF 保護的 PUT 處理器
   */
  put: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withCSRFProtection(handler, { skipMethods: ['GET', 'HEAD', 'OPTIONS'] }),

  /**
   * 創建受 CSRF 保護的 DELETE 處理器
   */
  delete: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withCSRFProtection(handler, { skipMethods: ['GET', 'HEAD', 'OPTIONS'] }),

  /**
   * 創建受高級 CSRF 保護的處理器（用於敏感操作）
   */
  sensitive: (handler: (request: NextRequest) => Promise<NextResponse>) =>
    withCSRFProtection(handler, { 
      skipMethods: ['GET', 'HEAD', 'OPTIONS'], 
      advanced: true 
    })
};

/**
 * CSRF 狀態檢查工具
 */
export const csrfUtils = {
  /**
   * 檢查請求是否包含有效的 CSRF token
   */
  hasValidToken: (request: NextRequest): boolean => {
    return CSRFTokenManager.validateToken(request).isValid;
  },

  /**
   * 提取 CSRF token 資訊（用於調試）
   */
  getTokenInfo: (request: NextRequest) => {
    const { headerToken, cookieToken } = CSRFTokenManager.extractTokens(request);
    return {
      headerToken: headerToken ? `${headerToken.substring(0, 8)}...` : null,
      cookieToken: cookieToken ? `${cookieToken.substring(0, 8)}...` : null,
      hasToken: !!(headerToken && cookieToken),
      tokensMatch: headerToken === cookieToken
    };
  },

  /**
   * 記錄 CSRF 相關的調試資訊
   */
  logDebugInfo: (request: NextRequest, context: string) => {
    if (process.env.NODE_ENV === 'development') {
      const tokenInfo = csrfUtils.getTokenInfo(request);
      authLogger.debug('CSRF Debug', { metadata: { context,
        method: request.method,
        path: request.nextUrl.pathname,
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        ...tokenInfo
      } });
    }
  }
};