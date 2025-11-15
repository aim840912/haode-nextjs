import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { withAuthAndError, withAdminAndError, withOptionalAuthAndError } from './api-middleware'

// Mock Supabase server functions
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/database/supabase-server', () => ({
  getCurrentUser: vi.fn(),
  createServerSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

describe('API Middleware', () => {
  describe('withAuthAndError', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('應該拒絕未認證的請求', async () => {
      const { getCurrentUser } = await import('@/lib/database/supabase-server')

      // Mock getCurrentUser 返回 null (未認證)
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const handler = vi.fn()
      const wrappedHandler = withAuthAndError(handler, { module: 'TestAPI' })

      const request = new NextRequest('http://localhost/api/test')
      const response = await wrappedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.success).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('應該允許已認證用戶存取', async () => {
      const { getCurrentUser } = await import('@/lib/database/supabase-server')

      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      // Mock getCurrentUser 返回認證用戶
      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)

      // Mock Supabase profile query (getUserWithAdminCheck 內部使用)
      mockSingle.mockResolvedValue({
        data: { role: 'user', name: 'Test User' },
        error: null,
      })

      const handler = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
      const wrappedHandler = withAuthAndError(handler, { module: 'TestAPI' })

      const request = new NextRequest('http://localhost/api/test')
      await wrappedHandler(request)

      expect(handler).toHaveBeenCalled()
      const [, user] = handler.mock.calls[0]
      expect(user.id).toBe('user-123')
      expect(user.email).toBe('test@example.com')
    })
  })

  describe('withAdminAndError', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('應該拒絕非管理員用戶', async () => {
      const { getCurrentUser } = await import('@/lib/database/supabase-server')

      const mockCurrentUser = {
        id: 'user-123',
        email: 'test@example.com',
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)

      // Mock Supabase profile query 返回非管理員
      mockSingle.mockResolvedValue({
        data: { role: 'user', name: 'Test User' },
        error: null,
      })

      const handler = vi.fn()
      const wrappedHandler = withAdminAndError(handler, { module: 'AdminAPI' })

      const request = new NextRequest('http://localhost/api/admin/test')
      const response = await wrappedHandler(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.success).toBe(false)
      expect(handler).not.toHaveBeenCalled()
    })

    it('應該允許管理員用戶存取', async () => {
      const { getCurrentUser } = await import('@/lib/database/supabase-server')

      const mockCurrentUser = {
        id: 'admin-123',
        email: 'admin@example.com',
      }

      vi.mocked(getCurrentUser).mockResolvedValue(mockCurrentUser)

      // Mock Supabase profile query 返回管理員
      mockSingle.mockResolvedValue({
        data: { role: 'admin', name: 'Admin User' },
        error: null,
      })

      const handler = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
      const wrappedHandler = withAdminAndError(handler, { module: 'AdminAPI' })

      const request = new NextRequest('http://localhost/api/admin/test')
      await wrappedHandler(request)

      expect(handler).toHaveBeenCalled()
      const [, user] = handler.mock.calls[0]
      expect(user.isAdmin).toBe(true)
    })
  })

  describe('withOptionalAuthAndError', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('應該允許未認證用戶存取但不提供 user', async () => {
      const { getCurrentUser } = await import('@/lib/database/supabase-server')

      // Mock getCurrentUser 返回 null (未認證)
      vi.mocked(getCurrentUser).mockResolvedValue(null)

      const handler = vi
        .fn()
        .mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }))
      const wrappedHandler = withOptionalAuthAndError(handler, { module: 'PublicAPI' })

      const request = new NextRequest('http://localhost/api/public/test')
      await wrappedHandler(request)

      expect(handler).toHaveBeenCalled()
      const [, user] = handler.mock.calls[0]
      expect(user).toBeNull()
    })
  })
})
