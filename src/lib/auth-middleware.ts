import { NextRequest } from 'next/server';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

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

// CSRF 增強保護
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  
  // 開發環境中也執行基本檢查，但較為寬鬆
  if (process.env.NODE_ENV === 'development') {
    // 允許 localhost, 127.0.0.1 和本機 IP
    const allowedHosts = ['localhost', '127.0.0.1', '0.0.0.0']
    
    if (host) {
      const hostWithoutPort = host.split(':')[0]
      if (allowedHosts.includes(hostWithoutPort) || hostWithoutPort.startsWith('192.168.') || hostWithoutPort.startsWith('10.')) {
        return true
      }
    }
    
    // 檢查是否為本機開發域名
    if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.'))) {
      return true
    }
    
    if (referer && (referer.includes('localhost') || referer.includes('127.0.0.1') || referer.includes('192.168.'))) {
      return true
    }
  }
  
  // 生產環境的嚴格檢查
  if (!host) {
    return false
  }
  
  // 檢查來源是否與主機匹配
  if (origin) {
    try {
      const originUrl = new URL(origin)
      return originUrl.host === host
    } catch {
      return false
    }
  }
  
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.host === host
    } catch {
      return false
    }
  }
  
  return false
}

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as any;
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

// CSRF Token 機制
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCSRFToken(request: NextRequest): boolean {
  const token = request.headers.get('x-csrf-token');
  const sessionToken = request.cookies.get('csrf-token')?.value;
  
  // 如果都不存在，檢查是否為 GET 請求（通常不需要 CSRF 保護）
  if (!token && !sessionToken && request.method === 'GET') {
    return true;
  }
  
  return !!(token && sessionToken && token === sessionToken);
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