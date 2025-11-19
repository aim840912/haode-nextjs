import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock helpers
vi.mock('./helpers', async _importOriginal => {
  const { ValidationError } = await import('@/lib/errors')

  return {
    validateRouteId: vi.fn(async (context?: unknown) => {
      const routeContext = context as { params: Promise<{ id: string }> } | undefined
      const { id } = await routeContext!.params

      // 簡單 UUID 格式驗證
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!uuidRegex.test(id)) {
        throw new ValidationError(`參數驗證失敗: id: Invalid uuid`)
      }

      return id
    }),
    checkAdminRole: vi.fn(async (_userId: string) => {
      // Will be overridden in tests
      return {
        role: 'user',
        name: 'Test User',
        isAdmin: false,
      }
    }),
    logAuditWithErrorHandling: vi.fn(async () => {}),
  }
})

// Mock InquiryService
vi.mock('@/services/core/inquiry/InquiryService', () => ({
  inquiryService: {
    getInquiryById: vi.fn(),
    getInquiryByIdForAdmin: vi.fn(),
    updateInquiry: vi.fn(),
    updateInquiryStatus: vi.fn(),
    deleteInquiry: vi.fn(),
  },
}))

// Mock Supabase client
const mockSingle = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn(() => ({
  single: mockSingle,
  select: mockSelect, // 為 update().eq() 添加 select() 方法
}))
mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle, // 為 select() 添加 single() 方法（用於 update().eq().select().single()）
})
const mockUpdate = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'profiles') {
    return { select: mockSelect }
  }
  return { update: mockUpdate, select: mockSelect }
})

vi.mock('@/lib/database/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock InquiryUtils
vi.mock('@/types/inquiry', () => ({
  InquiryUtils: {
    isValidStatusTransition: vi.fn(),
    getAvailableStatusTransitions: vi.fn(),
  },
}))

// Mock AuditLogger
vi.mock('@/services/infrastructure/auditLogService', () => ({
  AuditLogger: {
    logInquiryStatusChange: vi.fn(() => Promise.resolve()),
    logInquiryUpdate: vi.fn(() => Promise.resolve()),
    logInquiryDelete: vi.fn(() => Promise.resolve()),
  },
}))

// Mock 中間件認證
vi.mock('@/lib/middleware/api-middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/api-middleware')>()

  const { ValidationError, NotFoundError, AuthorizationError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withAuthAndError: (handler: any) => {
      return async (request: NextRequest, context?: unknown) => {
        try {
          const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          }
          return await handler(request, mockUser, context)
        } catch (error) {
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
          if (error instanceof NotFoundError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: error.message,
                },
              },
              { status: 404 }
            )
          }
          if (error instanceof AuthorizationError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'AUTHORIZATION_ERROR',
                  message: error.message,
                },
              },
              { status: 403 }
            )
          }
          throw error
        }
      }
    },
  }
})

// Import after mock
import { inquiryService } from '@/services/core/inquiry/InquiryService'
import { AuditLogger } from '@/services/infrastructure/auditLogService'
import { InquiryUtils } from '@/types/inquiry'
import { checkAdminRole } from './helpers'
import { GET, PUT, DELETE, PATCH } from './route'

const mockGetInquiryById = inquiryService.getInquiryById as ReturnType<typeof vi.fn>
const mockGetInquiryByIdForAdmin = inquiryService.getInquiryByIdForAdmin as ReturnType<typeof vi.fn>
const mockUpdateInquiry = inquiryService.updateInquiry as ReturnType<typeof vi.fn>
const mockUpdateInquiryStatus = inquiryService.updateInquiryStatus as ReturnType<typeof vi.fn>
const mockDeleteInquiry = inquiryService.deleteInquiry as ReturnType<typeof vi.fn>
const mockIsValidStatusTransition = InquiryUtils.isValidStatusTransition as ReturnType<typeof vi.fn>
const mockGetAvailableStatusTransitions = InquiryUtils.getAvailableStatusTransitions as ReturnType<
  typeof vi.fn
>
const mockCheckAdminRole = checkAdminRole as ReturnType<typeof vi.fn>

// Helper function to create route context
function createContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  }
}

// 使用有效的 UUID 格式進行測試
const VALID_INQUIRY_ID = '550e8400-e29b-41d4-a716-446655440001'
const INVALID_INQUIRY_ID = 'invalid-uuid'
const NONEXISTENT_INQUIRY_ID = '550e8400-e29b-41d4-a716-446655440999'

describe('GET /api/inquiries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取得詢價單詳情（一般使用者）', async () => {
    const mockInquiry = {
      id: VALID_INQUIRY_ID,
      userId: 'user-123',
      customer_name: '王小明',
      status: 'pending',
      is_read: false,
    }

    // Mock checkAdminRole (非管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    mockGetInquiryById.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123')
    const context = createContext(VALID_INQUIRY_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(VALID_INQUIRY_ID)
    expect(data.message).toContain('查詢成功')

    // 驗證呼叫 service (一般使用者模式)
    expect(mockGetInquiryById).toHaveBeenCalledWith('user-123', VALID_INQUIRY_ID)
    expect(mockGetInquiryByIdForAdmin).not.toHaveBeenCalled()
  })

  it('應該支援管理員模式查詢', async () => {
    const mockInquiry = {
      id: VALID_INQUIRY_ID,
      userId: 'other-user',
      customer_name: '張小華',
      status: 'pending',
      is_read: false,
      read_at: null,
    }

    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    // Mock update (標記已讀) - update().eq() 本身不返回 Promise,應該 mock update 操作完成
    mockUpdate.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValueOnce({ error: null }),
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123?admin=true')
    const context = createContext(VALID_INQUIRY_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // 驗證呼叫管理員查詢
    expect(mockGetInquiryByIdForAdmin).toHaveBeenCalledWith(VALID_INQUIRY_ID)
    expect(mockGetInquiryById).not.toHaveBeenCalled()

    // 驗證自動標記已讀
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_read: true,
      })
    )
  })

  it('應該返回 404 當詢價單不存在', async () => {
    // Mock checkAdminRole
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    mockGetInquiryById.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/inquiries/nonexistent')
    const context = createContext(NONEXISTENT_INQUIRY_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('找不到庫存查詢單')
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('應該返回 400 當 ID 格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/inquiries/invalid-uuid')
    const context = createContext(INVALID_INQUIRY_ID)

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('參數驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('PUT /api/inquiries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該允許一般使用者更新自己的詢價單', async () => {
    const previousInquiry = {
      id: VALID_INQUIRY_ID,
      userId: 'user-123',
      customer_name: '王小明',
      notes: '舊備註',
    }

    const updatedInquiry = {
      ...previousInquiry,
      notes: '新備註',
    }

    // Mock checkAdminRole (非管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    mockGetInquiryById.mockResolvedValue(previousInquiry)
    mockUpdateInquiry.mockResolvedValue(updatedInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: '新備註',
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.notes).toBe('新備註')
    expect(data.message).toContain('詢問單更新成功')

    // 驗證呼叫 service
    expect(mockUpdateInquiry).toHaveBeenCalledWith('user-123', VALID_INQUIRY_ID, {
      notes: '新備註',
    })
  })

  it('應該返回 403 當一般使用者嘗試更新狀態', async () => {
    // Mock checkAdminRole (非管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'completed',
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('只有管理員可以更新庫存查詢單狀態')
    expect(data.error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('應該允許管理員更新詢價單狀態', async () => {
    const currentInquiry = {
      id: VALID_INQUIRY_ID,
      status: 'pending',
      customer_name: '王小明',
      customer_email: 'test@example.com',
    }

    const updatedInquiry = {
      ...currentInquiry,
      status: 'quoted',
    }

    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(currentInquiry)
    mockIsValidStatusTransition.mockReturnValue(true)
    mockUpdateInquiryStatus.mockResolvedValue(updatedInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'quoted',
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.status).toBe('quoted')
    expect(data.message).toContain('詢問單狀態更新成功')

    // 驗證狀態轉換檢查
    expect(mockIsValidStatusTransition).toHaveBeenCalledWith('pending', 'quoted')

    // 驗證呼叫 service
    expect(mockUpdateInquiryStatus).toHaveBeenCalledWith(VALID_INQUIRY_ID, 'quoted')
  })

  it('應該返回 400 當狀態轉換無效', async () => {
    const currentInquiry = {
      id: VALID_INQUIRY_ID,
      status: 'completed',
      customer_name: '王小明',
    }

    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(currentInquiry)
    mockIsValidStatusTransition.mockReturnValue(false)
    mockGetAvailableStatusTransitions.mockReturnValue(['cancelled'])

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'pending',
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error).toBe('無法從 completed 轉換到 pending')
    expect(data.availableTransitions).toEqual(['cancelled'])
  })
})

describe('DELETE /api/inquiries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該允許管理員刪除詢價單', async () => {
    const inquiryToDelete = {
      id: VALID_INQUIRY_ID,
      customer_name: '王小明',
      customer_email: 'test@example.com',
      status: 'pending',
      total_estimated_amount: 1000,
      inquiry_items: [{ id: 'item-1' }],
    }

    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(inquiryToDelete)
    mockDeleteInquiry.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'DELETE',
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe(VALID_INQUIRY_ID)
    expect(data.message).toContain('詢問單刪除成功')

    // 驗證呼叫 service
    expect(mockDeleteInquiry).toHaveBeenCalledWith(VALID_INQUIRY_ID)

    // 驗證審計日誌
    expect(AuditLogger.logInquiryDelete).toHaveBeenCalled()
  })

  it('應該返回 403 當一般使用者嘗試刪除', async () => {
    // Mock checkAdminRole (非管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'DELETE',
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('只有管理員可以刪除詢問單')
    expect(data.error.code).toBe('AUTHORIZATION_ERROR')
  })

  it('應該返回 404 當詢價單不存在', async () => {
    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/inquiries/nonexistent', {
      method: 'DELETE',
    })
    const context = createContext(NONEXISTENT_INQUIRY_ID)

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('找不到庫存查詢單')
    expect(data.error.code).toBe('NOT_FOUND')
  })
})

describe('PATCH /api/inquiries/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該允許管理員快速標記已讀', async () => {
    const currentInquiry = {
      id: VALID_INQUIRY_ID,
      is_read: false,
      is_replied: false,
      customer_name: '王小明',
      customer_email: 'test@example.com',
    }

    const updatedInquiry = {
      ...currentInquiry,
      is_read: true,
      read_at: '2025-01-07T00:00:00Z',
    }

    // Mock checkAdminRole (管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'admin',
      name: '管理員',
      isAdmin: true,
    })

    // Mock update result
    mockSingle.mockResolvedValueOnce({
      data: updatedInquiry,
      error: null,
    })

    mockGetInquiryByIdForAdmin.mockResolvedValue(currentInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_read: true,
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.is_read).toBe(true)
    expect(data.message).toContain('詢問單更新成功')

    // 驗證更新調用包含自動時間戳
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        is_read: true,
        read_at: expect.any(String),
      })
    )
  })

  it('應該返回 403 當一般使用者嘗試 PATCH', async () => {
    // Mock checkAdminRole (非管理員)
    mockCheckAdminRole.mockResolvedValue({
      role: 'user',
      name: '王小明',
      isAdmin: false,
    })

    const request = new NextRequest('http://localhost/api/inquiries/inquiry-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_read: true,
      }),
    })
    const context = createContext(VALID_INQUIRY_ID)

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(403)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('只有管理員可以更新庫存查詢單狀態')
    expect(data.error.code).toBe('AUTHORIZATION_ERROR')
  })
})
