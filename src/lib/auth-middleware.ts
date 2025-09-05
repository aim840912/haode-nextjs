import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import { authLogger } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 環境變數是必填項目，請在 .env.local 中設定');
}

if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET 必須至少包含 32 個字元以確保安全性');
}

// 輸入清理與驗證
export function sanitizeInput(input: unknown): string {
  if (typeof input !== 'string') {
    return ''
  }
  
  // 基本 XSS 防護和字元過濾
  return input
    .replace(/[<>]/g, '') // 移除 HTML 標籤
    .replace(/javascript:/gi, '') // 移除 JavaScript 協議
    .replace(/on\w+=/gi, '') // 移除事件處理器
    .trim()
    .slice(0, 1000) // 限制長度
}

// 驗證 Email 格式
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 獲取允許的來源清單
 * 從環境變數或使用預設值
 */
function getAllowedOrigins(): string[] {
  // 生產環境從環境變數獲取
  if (process.env.NODE_ENV === 'production') {
    const origins: string[] = [];
    
    // 1. 從 CSRF_ALLOWED_ORIGINS 環境變數獲取
    const allowedOrigins = process.env.CSRF_ALLOWED_ORIGINS;
    if (allowedOrigins) {
      origins.push(...allowedOrigins.split(',').map(origin => origin.trim()));
    }
    
    // 2. 自動包含 NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL) {
      origins.push(process.env.NEXTAUTH_URL);
    }
    
    // 3. 自動包含 Vercel URL（支援預覽部署）
    if (process.env.VERCEL_URL) {
      origins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // 4. 自動包含 Vercel 生產 URL
    if (process.env.NEXT_PUBLIC_VERCEL_URL) {
      origins.push(`https://${process.env.NEXT_PUBLIC_VERCEL_URL}`);
    }
    
    // 5. 包含已知的生產域名
    origins.push('https://haode-nextjs.vercel.app');
    
    // 去除重複並過濾空值
    const uniqueOrigins = [...new Set(origins)].filter(Boolean);
    
    // 記錄允許的來源（幫助調試）
    authLogger.debug('CSRF Allowed origins', { metadata: { origins: uniqueOrigins } });
    
    return uniqueOrigins;
  }
  
  // 開發環境允許的來源
  return [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://0.0.0.0:3000',
    // 支援不同端口
    'http://localhost:3001',
    'http://localhost:3002'
  ];
}

/**
 * 改進的來源驗證
 * 使用可配置的白名單機制
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  if (!host) {
    return false;
  }
  
  const allowedOrigins = getAllowedOrigins();
  
  // 檢查 Origin header
  if (origin) {
    // 直接匹配允許的來源清單
    if (allowedOrigins.includes(origin)) {
      return true;
    }
    
    // 檢查是否與當前 host 匹配
    try {
      const originUrl = new URL(origin);
      if (originUrl.host === host) {
        return true;
      }
    } catch {
      // 無效的 URL
    }
  } else {
    // 當 origin 為 null 時，檢查是否為同源請求
    // 在同源請求中，瀏覽器可能不發送 Origin header
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (refererUrl.host === host) {
          return true; // 同源請求，允許通過
        }
      } catch {
        // 無效的 referer URL
      }
    }
    
    // 在開發環境中，如果沒有 origin 和 referer，但有有效的 host，允許通過
    if (process.env.NODE_ENV === 'development') {
      return true;
    }
  }
  
  // 檢查 Referer header
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      
      if (allowedOrigins.includes(refererOrigin) || refererUrl.host === host) {
        return true;
      }
    } catch {
      // 無效的 URL
    }
  }
  
  // 如果都沒有匹配，記錄詳細資訊以協助調試
  authLogger.warn('CSRF Origin validation failed', { metadata: {
    origin: origin || 'null',
    referer: referer || 'null',
    host,
    allowedOrigins,
    environment: process.env.NODE_ENV,
    vercelUrl: process.env.VERCEL_URL || 'not set'
  } });
  
  // 開發環境中較寬鬆
  if (process.env.NODE_ENV === 'development') {
    // 開發環境中，如果沒有 origin 但有有效的 host，允許通過
    return !origin || true;
  }
  
  // 生產環境中，如果是 Vercel 部署且沒有 origin header（同源請求），允許通過
  if (process.env.VERCEL && !origin && referer) {
    try {
      const refererUrl = new URL(referer);
      // 檢查是否來自相同的 Vercel 域名
      if (refererUrl.hostname.includes('vercel.app') || 
          refererUrl.hostname === host) {
        authLogger.debug('CSRF Allowing same-origin request on Vercel');
        return true;
      }
    } catch {
      // 無效的 referer URL
    }
  }
  
  return false;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

interface JWTPayload {
  userId: string;
  email: string;
  isAdmin?: boolean;
  iat?: number;
  exp?: number;
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as JWTPayload;
    return {
      id: decoded.userId,
      email: decoded.email,
      isAdmin: decoded.isAdmin || false
    };
  } catch (error) {
    return null;
  }
}

export function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '未授權訪問，請先登入' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const authReq = request as AuthenticatedRequest;
    authReq.user = user;
    
    return handler(authReq);
  };
}

export function requireAdmin(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest) => {
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '未授權訪問，請先登入' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    if (!user.isAdmin) {
      return new Response(
        JSON.stringify({ error: '需要管理員權限才能執行此操作' }), 
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const authReq = request as AuthenticatedRequest;
    authReq.user = user;
    
    return handler(authReq);
  };
}

export function validateRequest(request: NextRequest, requiredFields: string[]) {
  return async () => {
    let body;
    try {
      body = await request.json();
    } catch {
      return { 
        error: '無效的 JSON 格式',
        status: 400
      };
    }
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return {
        error: `缺少必要欄位: ${missingFields.join(', ')}`,
        status: 400
      };
    }
    
    return { body };
  };
}

// API Rate Limiting (簡單實作)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 15 * 60 * 1000) {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (request: NextRequest) => {
      const clientIP = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
      const now = Date.now();
      const windowStart = now - windowMs;
      
      const clientData = requestCounts.get(clientIP);
      
      if (!clientData || clientData.resetTime < windowStart) {
        requestCounts.set(clientIP, { count: 1, resetTime: now });
        return handler(request);
      }
      
      if (clientData.count >= maxRequests) {
        return new Response(
          JSON.stringify({ error: '請求過於頻繁，請稍後再試' }),
          { 
            status: 429,
            headers: { 
              'Content-Type': 'application/json',
              'Retry-After': Math.ceil(windowMs / 1000).toString()
            }
          }
        );
      }
      
      clientData.count++;
      return handler(request);
    };
  };
}

/**
 * CSRF Token 管理器
 * 實現 double-submit cookie pattern
 */
export class CSRFTokenManager {
  private static readonly TOKEN_NAME = 'csrf-token';
  private static readonly HEADER_NAME = 'x-csrf-token';
  private static readonly TOKEN_LENGTH = 32;
  
  /**
   * 生成新的 CSRF token
   * 使用 Web Crypto API（Edge Runtime 支援）
   */
  static generateToken(): string {
    // 生成隨機位元組陣列
    const bytes = new Uint8Array(this.TOKEN_LENGTH);
    crypto.getRandomValues(bytes);
    
    // 轉換為 hex 字串
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  /**
   * 創建 CSRF token cookie 選項
   */
  static getCookieOptions(secure?: boolean) {
    // Vercel 環境特殊處理
    const isVercel = process.env.VERCEL === '1';
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      name: this.TOKEN_NAME,
      httpOnly: false, // 允許 JavaScript 讀取以便添加到請求標頭
      secure: secure ?? isProduction,
      // Vercel 環境使用 'lax' 以支援跨子域請求
      sameSite: (isVercel ? 'lax' : 'strict') as 'lax' | 'strict',
      maxAge: 60 * 60 * 24, // 24 小時
      path: '/',
      // 如果有自定義域名，設定 domain
      ...(process.env.COOKIE_DOMAIN ? { domain: process.env.COOKIE_DOMAIN } : {})
    };
  }
  
  /**
   * 從請求中提取 token
   */
  static extractTokens(request: NextRequest): {
    headerToken?: string;
    cookieToken?: string;
  } {
    const headerToken = request.headers.get(this.HEADER_NAME) || 
                       request.headers.get('X-CSRF-Token') || // 支援大寫
                       undefined;
    
    const cookieToken = request.cookies.get(this.TOKEN_NAME)?.value;
    
    return { headerToken, cookieToken };
  }
  
  /**
   * 驗證 CSRF token（雙重提交模式）
   */
  static validateToken(request: NextRequest): {
    isValid: boolean;
    reason?: string;
  } {
    // GET 請求和其他安全方法不需要 CSRF 保護
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return { isValid: true };
    }
    
    const { headerToken, cookieToken } = this.extractTokens(request);
    
    // 檢查是否都存在
    if (!headerToken) {
      authLogger.warn('CSRF Missing header token', { metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      } });
      return { 
        isValid: false, 
        reason: `Missing CSRF token in ${this.HEADER_NAME} header` 
      };
    }
    
    if (!cookieToken) {
      authLogger.warn('CSRF Missing cookie token', { metadata: {
        path: request.nextUrl.pathname,
        method: request.method,
        cookies: request.cookies.getAll().map(c => c.name)
      } });
      return { 
        isValid: false, 
        reason: `Missing CSRF token in ${this.TOKEN_NAME} cookie` 
      };
    }
    
    // 檢查是否匹配
    if (headerToken !== cookieToken) {
      authLogger.warn('CSRF Token mismatch', { metadata: {
        path: request.nextUrl.pathname,
        headerToken: `${headerToken.substring(0, 8)}...`,
        cookieToken: `${cookieToken.substring(0, 8)}...`
      } });
      return { 
        isValid: false, 
        reason: 'CSRF token mismatch between header and cookie' 
      };
    }
    
    // 檢查 token 格式（32 字節的十六進制字符串）
    if (!/^[a-f0-9]{64}$/.test(headerToken)) {
      return { 
        isValid: false, 
        reason: 'Invalid CSRF token format' 
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * 創建設置 CSRF token 的 response headers
   */
  static createTokenResponse(token?: string): {
    token: string;
    headers: Headers;
  } {
    const csrfToken = token || this.generateToken();
    const headers = new Headers();
    const cookieOptions = this.getCookieOptions();
    
    // 設置 cookie
    const cookieValue = `${cookieOptions.name}=${csrfToken}; ` +
      `Path=${cookieOptions.path}; ` +
      `Max-Age=${cookieOptions.maxAge}; ` +
      `SameSite=${cookieOptions.sameSite}; ` +
      (cookieOptions.secure ? 'Secure; ' : '') +
      (!cookieOptions.httpOnly ? '' : 'HttpOnly; ');
    
    headers.set('Set-Cookie', cookieValue.trim());
    headers.set('X-CSRF-Token', csrfToken);
    
    return { token: csrfToken, headers };
  }
}

// 向後兼容的函數
export function generateCSRFToken(): string {
  return CSRFTokenManager.generateToken();
}

export function validateCSRFToken(request: NextRequest): boolean {
  const result = CSRFTokenManager.validateToken(request);
  
  if (!result.isValid && process.env.NODE_ENV === 'development') {
    authLogger.warn('CSRF Token validation failed', { metadata: { reason: result.reason } });
  }
  
  return result.isValid;
}

// 組合的安全檢查中間件
export function validateSecureRequest(request: NextRequest, requiredFields: string[]) {
  return async () => {
    // 檢查來源
    if (!validateOrigin(request)) {
      return {
        error: '無效的請求來源',
        status: 403
      };
    }
    
    // 對於 POST, PUT, DELETE 請求檢查 CSRF Token
    if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
      if (!validateCSRFToken(request)) {
        return {
          error: '缺少或無效的 CSRF Token',
          status: 403
        };
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return { 
        error: '無效的 JSON 格式',
        status: 400
      };
    }
    
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return {
        error: `缺少必要欄位: ${missingFields.join(', ')}`,
        status: 400
      };
    }
    
    return { body };
  };
}