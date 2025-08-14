import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
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