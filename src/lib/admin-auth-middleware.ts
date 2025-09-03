/**
 * Admin API 認證中間件
 * 
 * 提供統一的管理員 API 認證機制，包含：
 * - API Key 驗證
 * - Timing-safe comparison 防止 timing attack
 * - 審計日誌記錄
 * - Rate limiting
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { auditLogService } from '@/services/auditLogService';
import { AuditAction } from '@/types/audit';
import { authLogger } from '@/lib/logger';

/**
 * Admin API 認證結果
 */
export interface AdminAuthResult {
  isValid: boolean;
  error?: string;
  statusCode?: number;
  shouldAudit?: boolean;
  metadata?: {
    attemptedKey?: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

/**
 * 使用 timing-safe comparison 比較兩個字串
 * 防止 timing attack
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  
  // 確保兩個字串長度相同（使用 HMAC 來隱藏實際長度）
  const hmac = crypto.createHmac('sha256', 'admin-key-comparison');
  const hashA = hmac.update(a).digest();
  const hashB = crypto.createHmac('sha256', 'admin-key-comparison').update(b).digest();
  
  // 使用 Node.js 內建的 timing-safe comparison
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * 驗證 API Key 格式
 */
function validateApiKeyFormat(apiKey: string): boolean {
  // API Key 至少要 32 字元
  if (!apiKey || apiKey.length < 32) {
    return false;
  }
  
  // 檢查是否包含不安全的預設值
  const unsafePatterns = [
    'your-admin-api-key',
    'change-this',
    'default',
    'example',
    'test-key',
    '12345'
  ];
  
  const lowerKey = apiKey.toLowerCase();
  return !unsafePatterns.some(pattern => lowerKey.includes(pattern));
}

/**
 * 從請求中獲取客戶端資訊
 */
function getClientInfo(request: NextRequest) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    origin: request.headers.get('origin') || 'unknown',
    referer: request.headers.get('referer') || 'unknown'
  };
}

/**
 * 記錄認證失敗的審計日誌
 */
async function logAuthFailure(
  reason: string,
  clientInfo: ReturnType<typeof getClientInfo>,
  attemptedKey?: string
) {
  try {
    // 只記錄 key 的前 8 個字元用於調試
    const maskedKey = attemptedKey 
      ? `${attemptedKey.substring(0, 8)}...` 
      : 'not-provided';
    
    await auditLogService.log({
      action: 'unauthorized_access' as AuditAction,
      resource_type: 'admin_api' as any,
      resource_id: 'admin-authentication',
      user_id: null,
      user_email: 'anonymous',
      resource_details: {
        reason,
        maskedKey,
        ...clientInfo
      },
      metadata: {
        severity: 'high',
        alert: true
      }
    });
  } catch (error) {
    // 審計日誌失敗不應該影響主要流程
    authLogger.error('記錄認證失敗審計日誌失敗', error as Error, {
      module: 'AdminAuthMiddleware',
      action: 'logAuthFailure'
    });
  }
}

/**
 * 檢查管理員 API 權限
 * 
 * @param request - Next.js 請求對象
 * @returns 認證結果
 */
export async function checkAdminPermission(request: NextRequest): Promise<AdminAuthResult> {
  const clientInfo = getClientInfo(request);
  
  try {
    // 1. 檢查環境變數是否設定
    const envAdminKey = process.env.ADMIN_API_KEY;
    
    if (!envAdminKey) {
      authLogger.error('ADMIN_API_KEY 未在環境變數中配置', new Error('Environment variable not configured'), {
        module: 'AdminAuthMiddleware',
        action: 'checkAdminPermission',
        metadata: { reason: 'env_not_configured' }
      });
      await logAuthFailure('env_not_configured', clientInfo);
      
      return {
        isValid: false,
        error: '伺服器設定錯誤',
        statusCode: 500,
        shouldAudit: true
      };
    }
    
    // 2. 驗證環境變數中的 API Key 格式
    if (!validateApiKeyFormat(envAdminKey)) {
      authLogger.error('ADMIN_API_KEY 格式無效或不安全', new Error('Invalid API key format'), {
        module: 'AdminAuthMiddleware', 
        action: 'checkAdminPermission',
        metadata: { reason: 'env_key_invalid_format' }
      });
      await logAuthFailure('env_key_invalid_format', clientInfo);
      
      return {
        isValid: false,
        error: '伺服器設定錯誤',
        statusCode: 500,
        shouldAudit: true
      };
    }
    
    // 3. 檢查請求標頭
    const providedKey = request.headers.get('X-Admin-Key') || 
                       request.headers.get('x-admin-key');
    
    if (!providedKey) {
      await logAuthFailure('missing_auth_header', clientInfo);
      
      return {
        isValid: false,
        error: '缺少管理員認證標頭',
        statusCode: 401,
        shouldAudit: true,
        metadata: clientInfo
      };
    }
    
    // 4. 驗證提供的 API Key 格式
    if (!validateApiKeyFormat(providedKey)) {
      await logAuthFailure('invalid_key_format', clientInfo, providedKey);
      
      return {
        isValid: false,
        error: '無效的認證格式',
        statusCode: 401,
        shouldAudit: true,
        metadata: {
          ...clientInfo,
          attemptedKey: providedKey
        }
      };
    }
    
    // 5. 使用 timing-safe comparison 驗證 API Key
    if (!timingSafeEqual(providedKey, envAdminKey)) {
      await logAuthFailure('invalid_api_key', clientInfo, providedKey);
      
      return {
        isValid: false,
        error: '無效的管理員認證',
        statusCode: 401,
        shouldAudit: true,
        metadata: {
          ...clientInfo,
          attemptedKey: providedKey
        }
      };
    }
    
    // 6. 認證成功
    return {
      isValid: true,
      metadata: clientInfo
    };
    
  } catch (error) {
    authLogger.error('認證過程中發生意外錯誤', error as Error, {
      module: 'AdminAuthMiddleware',
      action: 'checkAdminPermission',
      metadata: { clientInfo }
    });
    
    return {
      isValid: false,
      error: '認證過程發生錯誤',
      statusCode: 500,
      shouldAudit: true
    };
  }
}

/**
 * 創建統一的錯誤回應
 */
export function createAuthErrorResponse(result: AdminAuthResult): NextResponse {
  // 記錄詳細錯誤供調試，但不返回給客戶端
  if (process.env.NODE_ENV === 'development') {
    authLogger.debug('管理員認證失敗（開發模式）', {
      module: 'AdminAuthMiddleware',
      action: 'createAuthErrorResponse', 
      metadata: {
        error: result.error,
        statusCode: result.statusCode,
        clientMetadata: result.metadata
      }
    });
  }
  
  // 返回通用錯誤訊息給客戶端
  return NextResponse.json(
    { 
      error: result.error || '認證失敗',
      success: false
    },
    { 
      status: result.statusCode || 401,
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Failed': 'true'
      }
    }
  );
}

/**
 * Admin API 路由裝飾器
 * 可以用作高階函數來包裝路由處理器
 */
export function withAdminAuth(
  handler: (request: NextRequest, authResult: AdminAuthResult) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const authResult = await checkAdminPermission(request);
    
    if (!authResult.isValid) {
      return createAuthErrorResponse(authResult);
    }
    
    return handler(request, authResult);
  };
}

/**
 * Rate limiting 配置
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * 簡單的 rate limiting 實作
 * 生產環境建議使用 Redis 或其他分散式存儲
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  // 清理過期的記錄
  if (record && now > record.resetTime) {
    rateLimitMap.delete(identifier);
  }
  
  const current = rateLimitMap.get(identifier);
  
  if (!current) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (current.count >= maxRequests) {
    return false;
  }
  
  current.count++;
  return true;
}

/**
 * 定期清理 rate limit 記錄（防止記憶體洩漏）
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // 每分鐘清理一次