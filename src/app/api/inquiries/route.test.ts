import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from './route'

// Mock InquiryService
vi.mock('@/services/core/inquiry/InquiryService', () => ({
  inquiryService: {
    getUserInquiries: vi.fn(),
    getAllInquiries: vi.fn(),
    createInquiry: vi.fn(),
  },
}))

// Mock Supabase client
const mockSingle = vi.fn()
const mockEq = vi.fn(() => ({ single: mockSingle }))
const mockSelect = vi.fn(() => ({ eq: mockEq }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('@/lib/database/supabase-server', () => ({
  createServerSupabaseClient: vi.fn(() => ({
    from: mockFrom,
  })),
}))

// Mock metrics
vi.mock('@/lib/metrics', () => ({
  recordInquirySubmit: vi.fn(),
}))

// Mock AuditLogger
vi.mock('@/services/infrastructure/auditLogService', () => ({
  AuditLogger: {
    logInquiryCreate: vi.fn(() => Promise.resolve()),
  },
}))

// Mock 中間件認證
vi.mock('@/lib/middleware/api-middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/api-middleware')>()

  const { ValidationError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withAuthAndError: (handler: any) => {
      return async (request: NextRequest) => {
        try {
          const mockUser = {
            id: 'user-123',
            email: 'test@example.com',
            role: 'user',
          }
          return await handler(request, mockUser)
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
          throw error
        }
      }
    },
  }
})

// Import after mock
import { inquiryService } from '@/services/core/inquiry/InquiryService'
import { recordInquirySubmit } from '@/lib/metrics'
import { AuditLogger } from '@/services/infrastructure/auditLogService'

const mockGetUserInquiries = inquiryService.getUserInquiries as ReturnType<typeof vi.fn>
const mockGetAllInquiries = inquiryService.getAllInquiries as ReturnType<typeof vi.fn>
const mockCreateInquiry = inquiryService.createInquiry as ReturnType<typeof vi.fn>
const mockRecordInquirySubmit = recordInquirySubmit as ReturnType<typeof vi.fn>
const mockLogInquiryCreate = AuditLogger.logInquiryCreate as ReturnType<typeof vi.fn>

describe('GET /api/inquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取得使用者的詢價單列表', async () => {
    const mockInquiries = [
      {
        id: 'inquiry-1',
        userId: 'user-123',
        inquiryType: 'product',
        status: 'pending',
        items: [],
        createdAt: '2025-01-07T00:00:00Z',
      },
    ]

    // Mock Supabase profile query (非管理員)
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockGetUserInquiries.mockResolvedValue(mockInquiries)

    const request = new NextRequest('http://localhost/api/inquiries')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(1)
    expect(data.data[0].id).toBe('inquiry-1')
    expect(data.message).toContain('庫存查詢單清單取得成功')

    // 驗證呼叫 getUserInquiries (非管理員模式)
    expect(mockGetUserInquiries).toHaveBeenCalledWith('user-123', {
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
    expect(mockGetAllInquiries).not.toHaveBeenCalled()
  })

  it('應該支援管理員模式查詢所有詢價單', async () => {
    const mockInquiries = [
      { id: 'inquiry-1', userId: 'user-123', status: 'pending' },
      { id: 'inquiry-2', userId: 'user-456', status: 'completed' },
    ]

    // Mock Supabase profile query (管理員)
    mockSingle.mockResolvedValue({
      data: { role: 'admin', name: '管理員' },
      error: null,
    })

    mockGetAllInquiries.mockResolvedValue(mockInquiries)

    const request = new NextRequest('http://localhost/api/inquiries?admin=true')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)

    // 驗證呼叫 getAllInquiries (管理員模式)
    expect(mockGetAllInquiries).toHaveBeenCalledWith({
      admin: true,
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
    expect(mockGetUserInquiries).not.toHaveBeenCalled()
  })

  it('應該支援查詢參數過濾（page, limit, status）', async () => {
    // Mock Supabase profile query
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockGetUserInquiries.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/inquiries?page=2&limit=10&status=pending')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // 驗證呼叫時傳入查詢參數（coerce 會轉換為數字，且有預設值）
    expect(mockGetUserInquiries).toHaveBeenCalledWith('user-123', {
      page: 2,
      limit: 10,
      status: 'pending',
      sort_by: 'created_at',
      sort_order: 'desc',
    })
  })

  it('應該返回 400 當查詢參數驗證失敗', async () => {
    const request = new NextRequest('http://localhost/api/inquiries?status=invalid_status')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該在非管理員使用 admin=true 時仍返回使用者自己的資料', async () => {
    // Mock Supabase profile query (非管理員)
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockGetUserInquiries.mockResolvedValue([])

    const request = new NextRequest('http://localhost/api/inquiries?admin=true')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)

    // 驗證呼叫 getUserInquiries 而非 getAllInquiries
    expect(mockGetUserInquiries).toHaveBeenCalledWith('user-123', {
      admin: true,
      page: 1,
      limit: 10,
      sort_by: 'created_at',
      sort_order: 'desc',
    })
    expect(mockGetAllInquiries).not.toHaveBeenCalled()
  })
})

describe('POST /api/inquiries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validInquiryData = {
    inquiry_type: 'product',
    items: [
      {
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        product_name: '測試產品',
        quantity: 2,
        unit_price: 100,
      },
    ],
    customer_name: '王小明',
    customer_email: 'test@example.com',
    customer_phone: '0912345678',
  }

  it('應該返回 201 且建立詢價單成功', async () => {
    const mockInquiry = {
      id: 'inquiry-123',
      customer_name: '王小明',
      customer_email: 'test@example.com',
      total_estimated_amount: 200,
      inquiry_items: validInquiryData.items,
      createdAt: '2025-01-07T00:00:00Z',
    }

    // Mock Supabase profile query
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockCreateInquiry.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validInquiryData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('inquiry-123')
    expect(data.data.customer_name).toBe('王小明')
    expect(data.message).toContain('詢問單建立成功')

    // 驗證呼叫 service
    expect(mockCreateInquiry).toHaveBeenCalledWith('user-123', validInquiryData)
  })

  it('應該記錄業務指標（recordInquirySubmit）', async () => {
    const mockInquiry = {
      id: 'inquiry-123',
      customer_name: '王小明',
      customer_email: 'test@example.com',
      total_estimated_amount: 200,
      inquiry_items: [],
    }

    // Mock Supabase profile query
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockCreateInquiry.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validInquiryData),
    })

    await POST(request)

    // 驗證業務指標記錄
    expect(mockRecordInquirySubmit).toHaveBeenCalledWith('product', 'user-123')
  })

  it('應該記錄審計日誌（AuditLogger.logInquiryCreate）', async () => {
    const mockInquiry = {
      id: 'inquiry-123',
      customer_name: '王小明',
      customer_email: 'test@example.com',
      total_estimated_amount: 200,
      inquiry_items: validInquiryData.items,
    }

    // Mock Supabase profile query
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockCreateInquiry.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validInquiryData),
    })

    await POST(request)

    // 驗證審計日誌記錄
    expect(mockLogInquiryCreate).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      '王小明',
      'user',
      'inquiry-123',
      {
        customer_name: '王小明',
        customer_email: 'test@example.com',
        total_estimated_amount: 200,
        items_count: 1,
      },
      expect.any(Object) // NextRequest object
    )
  })

  it('應該返回 400 當 inquiry_type 缺失', async () => {
    const { inquiry_type, ...invalidData } = validInquiryData

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('資料驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當詢價項目為空', async () => {
    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validInquiryData,
        items: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('資料驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當客戶姓名缺失', async () => {
    const { customer_name, ...invalidData } = validInquiryData

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invalidData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('資料驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該允許可選欄位為空（customer_phone）', async () => {
    const mockInquiry = {
      id: 'inquiry-123',
      customer_name: '王小明',
      customer_email: 'test@example.com',
      total_estimated_amount: 200,
      inquiry_items: [],
    }

    // Mock Supabase profile query
    mockSingle.mockResolvedValue({
      data: { role: 'user', name: '王小明' },
      error: null,
    })

    mockCreateInquiry.mockResolvedValue(mockInquiry)

    const { customer_phone, ...minimalData } = validInquiryData

    const request = new NextRequest('http://localhost/api/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(minimalData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
