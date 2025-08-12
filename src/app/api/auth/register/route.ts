import { NextRequest, NextResponse } from 'next/server'
import { RegisterRequest } from '@/types/auth'
import { MockAuthService } from '@/lib/mock-auth'

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json()
    
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json(
        { error: '請輸入電子郵件、密碼和姓名' },
        { status: 400 }
      )
    }
    
    const result = await MockAuthService.register(body)
    
    return NextResponse.json(result, { status: 201 })
    
  } catch (error) {
    console.error('Register error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}