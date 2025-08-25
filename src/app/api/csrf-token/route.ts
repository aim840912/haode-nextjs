/**
 * CSRF Token API 端點
 * 
 * 提供 CSRF token 的生成和刷新功能
 * 使用 double-submit cookie pattern 來防止 CSRF 攻擊
 */

import { NextRequest, NextResponse } from 'next/server';
import { CSRFTokenManager, validateOrigin } from '@/lib/auth-middleware';

/**
 * GET /api/csrf-token
 * 
 * 生成新的 CSRF token 並設置為 cookie
 * 前端可以從響應標頭或 cookie 中獲取 token
 */
export async function GET(request: NextRequest) {
  try {
    // 驗證請求來源
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { 
          error: '無效的請求來源',
          success: false 
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 檢查是否需要刷新現有 token
    const existingToken = request.cookies.get('csrf-token')?.value;
    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';
    
    // 如果已有有效 token 且不強制刷新，返回現有 token
    if (existingToken && !forceRefresh && /^[a-f0-9]{64}$/.test(existingToken)) {
      return NextResponse.json(
        { 
          token: existingToken,
          success: true,
          message: '使用現有 CSRF token'
        },
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': existingToken
          }
        }
      );
    }

    // 生成新的 CSRF token
    const { token, headers } = CSRFTokenManager.createTokenResponse();
    
    // 創建響應
    const response = NextResponse.json(
      { 
        token,
        success: true,
        message: '已生成新的 CSRF token',
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24小時後過期
      },
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );

    // 添加 CSRF token headers
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });

    return response;

  } catch (error) {
    console.error('CSRF token generation failed:', error);
    
    return NextResponse.json(
      { 
        error: '生成 CSRF token 失敗',
        success: false,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * POST /api/csrf-token
 * 
 * 驗證現有的 CSRF token
 * 主要用於測試和調試
 */
export async function POST(request: NextRequest) {
  try {
    // 驗證請求來源
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { 
          error: '無效的請求來源',
          success: false 
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 驗證 CSRF token
    const validation = CSRFTokenManager.validateToken(request);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'CSRF token 驗證失敗',
          success: false,
          reason: validation.reason,
          // 在開發環境中提供調試資訊
          debug: process.env.NODE_ENV === 'development' ? {
            method: request.method,
            headers: {
              'x-csrf-token': request.headers.get('x-csrf-token'),
              'X-CSRF-Token': request.headers.get('X-CSRF-Token')
            },
            cookies: {
              'csrf-token': request.cookies.get('csrf-token')?.value
            }
          } : undefined
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'CSRF token 驗證成功',
        token: request.cookies.get('csrf-token')?.value
      },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('CSRF token validation failed:', error);
    
    return NextResponse.json(
      { 
        error: '驗證 CSRF token 時發生錯誤',
        success: false,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * DELETE /api/csrf-token
 * 
 * 清除 CSRF token（登出時使用）
 */
export async function DELETE(request: NextRequest) {
  try {
    // 驗證請求來源
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { 
          error: '無效的請求來源',
          success: false 
        },
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 創建清除 cookie 的響應
    const response = NextResponse.json(
      { 
        success: true,
        message: 'CSRF token 已清除'
      },
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    // 設置過期的 cookie 來清除它
    response.cookies.set('csrf-token', '', {
      expires: new Date(0),
      path: '/',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    return response;

  } catch (error) {
    console.error('CSRF token deletion failed:', error);
    
    return NextResponse.json(
      { 
        error: '清除 CSRF token 失敗',
        success: false,
        details: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : 'Unknown error')
          : undefined
      },
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 不支援其他 HTTP 方法
export async function PUT() {
  return NextResponse.json(
    { error: '不支援的請求方法', success: false },
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { error: '不支援的請求方法', success: false },
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
}