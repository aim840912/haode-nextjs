import { NextRequest } from 'next/server'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from './route'

// Mock OrderService
vi.mock('@/services/core/order/OrderService', () => ({
  orderService: {
    getUserOrders: vi.fn(),
    createOrder: vi.fn(),
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
import { orderService } from '@/services/core/order/OrderService'

const mockGetUserOrders = orderService.getUserOrders as ReturnType<typeof vi.fn>
const mockCreateOrder = orderService.createOrder as ReturnType<typeof vi.fn>

describe('GET /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取得訂單列表成功（預設分頁）', async () => {
    const mockOrders = [
      {
        id: 'order-1',
        orderNumber: 'ORD-20250107-001',
        userId: 'user-123',
        status: 'pending',
        totalAmount: 1500,
        createdAt: '2025-01-07T00:00:00Z',
      },
    ]

    mockGetUserOrders.mockResolvedValue({
      orders: mockOrders,
      total: 1,
    })

    const request = new NextRequest('http://localhost/api/orders')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.orders).toHaveLength(1)
    expect(data.data.orders[0].orderNumber).toBe('ORD-20250107-001')
    expect(data.data.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
      hasNext: false,
      hasPrev: false,
    })
    expect(data.message).toContain('取得訂單列表成功')

    // 驗證呼叫 service
    expect(mockGetUserOrders).toHaveBeenCalledWith('user-123', 20, 0)
  })

  it('應該支援自訂分頁參數', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: [],
      total: 100,
    })

    const request = new NextRequest('http://localhost/api/orders?page=3&limit=10')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.pagination).toEqual({
      page: 3,
      limit: 10,
      total: 100,
      totalPages: 10,
      hasNext: true,
      hasPrev: true,
    })

    // 驗證呼叫 service (offset = (3-1) * 10 = 20)
    expect(mockGetUserOrders).toHaveBeenCalledWith('user-123', 10, 20)
  })

  it('應該限制 limit 最大值為 50', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: [],
      total: 0,
    })

    const request = new NextRequest('http://localhost/api/orders?limit=100')

    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.data.pagination.limit).toBe(50)

    // 驗證呼叫 service 時 limit 被限制為 50
    expect(mockGetUserOrders).toHaveBeenCalledWith('user-123', 50, 0)
  })

  it('應該正確計算 hasNext 和 hasPrev', async () => {
    mockGetUserOrders.mockResolvedValue({
      orders: [],
      total: 50,
    })

    // 第 2 頁，每頁 20 筆，總共 50 筆
    const request = new NextRequest('http://localhost/api/orders?page=2&limit=20')

    const response = await GET(request)
    const data = await response.json()

    expect(data.data.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 50,
      totalPages: 3,
      hasNext: true, // offset(20) + limit(20) = 40 < 50
      hasPrev: true, // page > 1
    })
  })
})

describe('POST /api/orders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const validOrderData = {
    items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 2 }],
    shippingAddress: {
      name: '王小明',
      phone: '0912345678',
      street: '忠孝東路一段 1 號',
      city: '台北市',
      postalCode: '100',
      country: '台灣',
    },
    paymentMethod: '信用卡',
  }

  it('應該返回 201 且建立訂單成功', async () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-20250107-001',
      status: 'pending',
      totalAmount: 1500,
      createdAt: '2025-01-07T00:00:00Z',
    }

    mockCreateOrder.mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validOrderData),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
    expect(data.data.orderNumber).toBe('ORD-20250107-001')
    expect(data.data.totalAmount).toBe(1500)
    expect(data.message).toContain('訂單建立成功')

    // 驗證呼叫 service
    expect(mockCreateOrder).toHaveBeenCalledWith('user-123', validOrderData)
  })

  it('應該返回 400 當訂單項目為空', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        items: [],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('訂單項目不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當產品 ID 格式錯誤', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        items: [{ productId: 'invalid-uuid', quantity: 1 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('產品 ID 格式不正確')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當購買數量無效（<= 0）', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        items: [{ productId: '550e8400-e29b-41d4-a716-446655440000', quantity: 0 }],
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('數量必須大於 0')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當收件人姓名為空', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        shippingAddress: {
          ...validOrderData.shippingAddress,
          name: '',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('收件人姓名不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當收件人電話為空', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        shippingAddress: {
          ...validOrderData.shippingAddress,
          phone: '',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('收件人電話不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當街道地址為空', async () => {
    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...validOrderData,
        shippingAddress: {
          ...validOrderData.shippingAddress,
          street: '',
        },
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('街道地址不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該允許可選欄位為空（paymentMethod, notes）', async () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-20250107-001',
      status: 'pending',
      totalAmount: 1500,
    }

    mockCreateOrder.mockResolvedValue(mockOrder)

    const { paymentMethod, ...orderDataWithoutOptional } = validOrderData

    const request = new NextRequest('http://localhost/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderDataWithoutOptional),
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(data.success).toBe(true)
  })
})
