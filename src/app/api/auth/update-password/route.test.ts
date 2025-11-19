import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Supabase Auth
vi.mock('@/lib/database/supabase-auth', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn(),
      signOut: vi.fn(),
    },
  },
}))

// Mock 中間件認證
vi.mock('@/lib/middleware/api-middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/api-middleware')>()

  // Import ValidationError for error handling
  const { ValidationError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withAuthAndError: (handler: any) => {
      return async (request: NextRequest) => {
        try {
          // 模擬已認證使用者
          const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          }
          return await handler(request, mockUser)
        } catch (error) {
          // 模擬錯誤處理中間件的行為
          if (error instanceof ValidationError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'VALIDATION_FAILED',
                  message: error.message,
                },
              },
              { status: 400 }
            )
          }
          throw error
        }
      }
    },
  }
})

// Import after mock
import { supabase } from '@/lib/database/supabase-auth'

const mockUpdateUser = supabase.auth.updateUser as ReturnType<typeof vi.fn>
const mockSignOut = supabase.auth.signOut as ReturnType<typeof vi.fn>

describe('POST /api/auth/update-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 400 當請求資料格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      body: 'invalid json',
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('請求資料格式錯誤')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當密碼參數缺失', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當密碼類型錯誤', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 123456 }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼格式錯誤')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當密碼過短（< 6 字元）', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: '12345' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼至少需要 6 個字元')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當密碼過長（> 128 字元）', async () => {
    const longPassword = 'a'.repeat(129)
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: longPassword }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼不能超過 128 個字元')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當使用弱密碼（123456）', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: '123456' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('請選擇更安全的密碼')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當使用弱密碼（password）', async () => {
    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'password' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('請選擇更安全的密碼')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 200 且更新密碼成功', async () => {
    mockUpdateUser.mockResolvedValue({
      error: null,
      data: { user: { id: 'user-123' } },
    })
    mockSignOut.mockResolvedValue({
      error: null,
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'newSecurePassword123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toContain('密碼更新成功，請重新登入')
    expect(data.message).toContain('密碼已成功更新')

    // 驗證呼叫 Supabase updateUser
    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: 'newSecurePassword123',
    })

    // 驗證呼叫 Supabase signOut
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('應該返回 400 當新密碼與目前密碼相同', async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        message: 'Same password',
        name: 'AuthError',
        status: 400,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'currentPassword123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('新密碼不能與目前密碼相同')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當密碼不符合 Supabase 安全要求', async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        message: 'Password should be at least 8 characters',
        name: 'AuthError',
        status: 400,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'weak12' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼不符合安全要求')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當使用者會話已過期', async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        message: 'User not found',
        name: 'AuthError',
        status: 404,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'newPassword123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('使用者不存在或會話已過期')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當發生其他 Supabase 錯誤', async () => {
    mockUpdateUser.mockResolvedValue({
      error: {
        message: 'Unknown error',
        name: 'AuthError',
        status: 500,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'newPassword123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('密碼更新失敗，請稍後再試')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該成功更新密碼即使登出失敗', async () => {
    mockUpdateUser.mockResolvedValue({
      error: null,
      data: { user: { id: 'user-123' } },
    })
    mockSignOut.mockResolvedValue({
      error: {
        message: 'Sign out failed',
        name: 'AuthError',
      },
    })

    const request = new NextRequest('http://localhost/api/auth/update-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: 'newSecurePassword123' }),
    })

    const response = await POST(request)
    const data = await response.json()

    // 即使登出失敗，密碼更新仍然成功
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.message).toContain('密碼更新成功，請重新登入')
  })
})
