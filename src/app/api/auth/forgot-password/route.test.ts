import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock Supabase Auth
vi.mock('@/lib/database/supabase-auth', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}))

// Import after mock
import { supabase } from '@/lib/database/supabase-auth'

const mockResetPasswordForEmail = supabase.auth.resetPasswordForEmail as ReturnType<typeof vi.fn>

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 400 當請求資料格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
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

  it('應該返回 400 當 email 參數缺失', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
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
    expect(data.error.message).toContain('驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當 email 格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'invalid-email' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 200 且發送重設郵件成功', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: null,
      data: {},
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.email).toBe('user@example.com')
    expect(data.message).toContain('如果此電子郵件已註冊')

    // 驗證呼叫 Supabase
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('user@example.com', {
      redirectTo: expect.stringContaining('/auth/confirm'),
    })
  })

  it('應該返回 400 當電子郵件未驗證', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: {
        message: 'Email not confirmed',
        name: 'AuthError',
        status: 400,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'unconfirmed@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('此電子郵件尚未完成驗證')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 200 當使用者不存在（基於安全考量）', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: {
        message: 'User not found',
        name: 'AuthError',
        status: 400,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'nonexistent@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    // 基於安全考量，仍然返回成功訊息
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toContain('如果此電子郵件已註冊')
  })

  it('應該返回 400 當超過速率限制', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: {
        message: 'Email rate limit exceeded',
        name: 'AuthError',
        status: 429,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('發送郵件過於頻繁')
    expect(data.error.message).toContain('每小時限制 2 封郵件')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當發生其他 Supabase 錯誤', async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: {
        message: 'Unknown error',
        name: 'AuthError',
        status: 500,
      },
      data: null,
    })

    const request = new NextRequest('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'user@example.com' }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('發送重設郵件失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })
})
