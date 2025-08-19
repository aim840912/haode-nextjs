import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // 只對 /admin 路徑進行保護
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // 從 cookies 取得 auth token
    const token = request.cookies.get('auth-token')
    
    // 如果沒有 token，重導向到登入頁
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 簡單的 token 驗證（這裡可以根據實際的 JWT 實作調整）
    try {
      // 解析 token 並檢查用戶角色
      const tokenValue = token.value
      
      // 如果是簡單的 JSON token
      if (tokenValue.startsWith('user:')) {
        const userData = JSON.parse(tokenValue.replace('user:', ''))
        
        // 檢查用戶角色是否為 admin
        if (userData.role !== 'admin') {
          const homeUrl = new URL('/', request.url)
          return NextResponse.redirect(homeUrl)
        }
      } else {
        // 如果 token 格式不正確，重導向到登入頁
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
      }
    } catch (error) {
      // token 解析失敗，重導向到登入頁
      console.error('Token parsing error:', error)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// 設定 matcher 來指定哪些路徑要執行 middleware
export const config = {
  matcher: [
    '/admin/:path*',
  ]
}