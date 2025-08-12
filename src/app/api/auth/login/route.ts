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
    
    return NextResponse.json(result)
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