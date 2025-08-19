import { NextRequest, NextResponse } from 'next/server'
import { LoginRequest } from '@/types/auth'
import { MockAuthService } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    
    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: '請輸入電子郵件和密碼' },
        { status: 400 }
      )
    }
    
    const result = await MockAuthService.login(body)
    
    // 設定 HTTP-only cookie 用於 middleware 驗證
    const response = NextResponse.json(result)
    
    // 將用戶資訊編碼為 cookie 值（與 middleware 期望的格式相符）
    const cookieValue = `user:${JSON.stringify(result.user)}`
    
    // 設定 HTTP-only cookie，期限 7 天
    response.cookies.set('auth-token', cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 天
      path: '/'
    })
    
    return response
  } catch (error) {
    console.error('Login error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}