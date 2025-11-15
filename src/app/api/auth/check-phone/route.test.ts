import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

// Mock Supabase client
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/database/supabase-server', () => ({
  createServiceSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

describe('GET /api/auth/check-phone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 400 當手機號碼參數缺失', async () => {
    const request = new NextRequest('http://localhost/api/auth/check-phone')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('請提供手機號碼')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當手機號碼格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/auth/check-phone?phone=1234567890')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('請輸入有效的台灣手機號碼')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 200 且 available=true 當手機號碼可用', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' } as any, // 未找到記錄
      count: null,
      status: 404,
      statusText: 'Not Found',
    })

    const request = new NextRequest('http://localhost/api/auth/check-phone?phone=0912345678')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.phone).toBe('0912345678')
    expect(data.data.available).toBe(true)
    expect(data.data.message).toBe('此手機號碼可以使用')
  })

  it('應該返回 200 且 available=false 當手機號碼已被註冊', async () => {
    mockSingle.mockResolvedValue({
      data: { id: 'user-123' },
      error: null,
      count: null,
      status: 200,
      statusText: 'OK',
    })

    const request = new NextRequest('http://localhost/api/auth/check-phone?phone=0987654321')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.phone).toBe('0987654321')
    expect(data.data.available).toBe(false)
    expect(data.data.message).toBe('此手機號碼已被註冊')
  })

  it('應該正確處理帶有連字號的手機號碼', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' } as any,
      count: null,
      status: 404,
      statusText: 'Not Found',
    })

    const request = new NextRequest('http://localhost/api/auth/check-phone?phone=0912-345-678')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.phone).toBe('0912345678') // 連字號應被移除
    expect(data.data.available).toBe(true)
  })

  it('應該返回 500 當資料庫查詢失敗', async () => {
    mockSingle.mockResolvedValue({
      data: null,
      error: { code: 'DATABASE_ERROR', message: 'Connection failed' } as any,
      count: null,
      status: 500,
      statusText: 'Internal Server Error',
    })

    const request = new NextRequest('http://localhost/api/auth/check-phone?phone=0912345678')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('檢查手機號碼時發生錯誤')
    expect(data.error.code).toBe('INTERNAL_SERVER_ERROR')
  })
})
