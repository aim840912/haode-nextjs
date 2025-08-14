import { NextRequest, NextResponse } from 'next/server'
import { MockAuthService } from '@/lib/mock-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '需要授權' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const user = await MockAuthService.verifyToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: '無效的 token' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(user)
    
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '需要授權' },
        { status: 401 }
      )
    }
    
    const token = authHeader.substring(7)
    const user = await MockAuthService.verifyToken(token)
    
    if (!user) {
      return NextResponse.json(
        { error: '無效的 token' },
        { status: 401 }
      )
    }
    
    const updates = await request.json()
    const updatedUser = await MockAuthService.updateProfile(user.id, updates)
    
    return NextResponse.json(updatedUser)
    
  } catch (error) {
    console.error('Profile update error:', error)
    
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