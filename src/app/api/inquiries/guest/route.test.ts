import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from './route'

// Mock InquiryService
vi.mock('@/services/core/inquiry/InquiryService', () => ({
  inquiryService: {
    createInquiry: vi.fn(),
  },
}))

// Mock 錯誤處理中間件
vi.mock('@/lib/middleware/error-handler', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/error-handler')>()

  const { ValidationError } = await import('@/lib/errors')
  const { NextResponse } = await import('next/server')

  return {
    ...actual,
    withErrorHandler: (handler: any) => {
      return async (request: NextRequest) => {
        try {
          return await handler(request)
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

const mockCreateInquiry = inquiryService.createInquiry as ReturnType<typeof vi.fn>

describe('POST /api/inquiries/guest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validGuestInquiry = {
    customer_name: '王小明',
    customer_email: 'test@example.com',
    customer_phone: '0912345678',
    inquiry_type: 'product',
    items: [
      {
        product_id: '550e8400-e29b-41d4-a716-446655440000',
        product_name: '測試產品',
        quantity: 2,
        unit_price: 100,
      },
    ],
    notes: '希望盡快回覆',
    delivery_address: '台北市中正區',
    preferred_delivery_date: '2025-01-15',
  }

  it('應該返回 201 且建立訪客詢價單成功', async () => {
    const mockInquiry = {
      id: 'inquiry-123',
      status: 'pending',
      customer_name: '王小明',
      created_at: '2025-01-07T00:00:00Z',
    }

    mockCreateInquiry.mockResolvedValue(mockInquiry)

    const request = new NextRequest('http://localhost/api/inquiries/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validGuestInquiry),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('inquiry-123')
    expect(data.data.status).toBe('pending')
    expect(data.data.customer_name).toBe('王小明')
    expect(data.message).toContain('詢價已送出')

    // 驗證呼叫 service（使用訪客 user_id: 00000000-0000-0000-0000-000000000000）
    expect(mockCreateInquiry).toHaveBeenCalledWith(
      '00000000-0000-0000-0000-000000000000',
      expect.objectContaining({
        customer_name: '王小明',
        customer_email: 'test@example.com',
        inquiry_type: 'product',
        items: validGuestInquiry.items,
      })
    )
  })

  it('應該在 notes 中標記訪客詢價資訊', async () => {
    mockCreateInquiry.mockResolvedValue({
      id: 'inquiry-123',
      status: 'pending',
      customer_name: '王小明',
    })

    const request = new NextRequest('http://localhost/api/inquiries/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validGuestInquiry),
    })

    await POST(request)

    // 驗證 notes 包含訪客標記和聯絡資訊
    const callArgs = mockCreateInquiry.mock.calls[0][1]
    expect(callArgs.notes).toContain('【訪客詢價】')
    expect(callArgs.notes).toContain('test@example.com')
    expect(callArgs.notes).toContain('0912345678')
  })

  it('應該返回 400 當客戶姓名缺失', async () => {
    const { customer_name, ...invalidData } = validGuestInquiry

    const request = new NextRequest('http://localhost/api/inquiries/guest', {
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

  it('應該返回 400 當客戶 Email 缺失', async () => {
    const { customer_email, ...invalidData } = validGuestInquiry

    const request = new NextRequest('http://localhost/api/inquiries/guest', {
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
    const request = new NextRequest('http://localhost/api/inquiries/guest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validGuestInquiry,
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

  it('應該允許不提供可選欄位（phone, notes, address）', async () => {
    mockCreateInquiry.mockResolvedValue({
      id: 'inquiry-123',
      status: 'pending',
      customer_name: '王小明',
    })

    const { customer_phone, notes, delivery_address, preferred_delivery_date, ...minimalData } =
      validGuestInquiry

    const request = new NextRequest('http://localhost/api/inquiries/guest', {
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
