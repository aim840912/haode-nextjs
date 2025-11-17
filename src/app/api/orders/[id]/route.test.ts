import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, PATCH, PUT, DELETE } from './route'

// Mock OrderService
vi.mock('@/services/core/order/OrderService', () => ({
  orderService: {
    getOrderById: vi.fn(),
    cancelOrder: vi.fn(),
  },
}))

// Mock 中間件認證
vi.mock('@/lib/middleware/api-middleware', async importOriginal => {
  const actual = await importOriginal<typeof import('@/lib/middleware/api-middleware')>()

  const { ValidationError, NotFoundError, MethodNotAllowedError } = await import('@/lib/errors')
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
          if (error instanceof MethodNotAllowedError) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'METHOD_NOT_ALLOWED',
                  message: error.message,
                },
              },
              { status: 405 }
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

const mockGetOrderById = orderService.getOrderById as ReturnType<typeof vi.fn>
const mockCancelOrder = orderService.cancelOrder as ReturnType<typeof vi.fn>

// Helper function to create route context
function createContext(id: string) {
  return {
    params: Promise.resolve({ id }),
  }
}

describe('GET /api/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取得訂單詳情成功', async () => {
    const mockOrder = {
      id: 'order-123',
      orderNumber: 'ORD-20250107-001',
      userId: 'user-123',
      status: 'pending',
      totalAmount: 1500,
      createdAt: '2025-01-07T00:00:00Z',
    }

    mockGetOrderById.mockResolvedValue(mockOrder)

    const request = new NextRequest('http://localhost/api/orders/order-123')
    const context = createContext('order-123')

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.id).toBe('order-123')
    expect(data.data.orderNumber).toBe('ORD-20250107-001')
    expect(data.message).toContain('取得訂單詳情成功')

    // 驗證呼叫 service
    expect(mockGetOrderById).toHaveBeenCalledWith('order-123', 'user-123')
  })

  it('應該返回 404 當訂單不存在', async () => {
    mockGetOrderById.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/orders/nonexistent')
    const context = createContext('nonexistent')

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('訂單不存在或無權限查看')
    expect(data.error.code).toBe('NOT_FOUND')
  })

  it('應該返回 400 當訂單 ID 為空', async () => {
    const request = new NextRequest('http://localhost/api/orders/')
    const context = createContext('')

    const response = await GET(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('訂單 ID 不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('PATCH /api/orders/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('應該返回 200 且取消訂單成功', async () => {
    mockCancelOrder.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
        reason: '不想要了',
      }),
    })
    const context = createContext('order-123')

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toBe(null)
    expect(data.message).toContain('訂單已成功取消')

    // 驗證呼叫 service
    expect(mockCancelOrder).toHaveBeenCalledWith('order-123', 'user-123', '不想要了')
  })

  it('應該允許取消訂單時不提供原因', async () => {
    mockCancelOrder.mockResolvedValue(undefined)

    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
      }),
    })
    const context = createContext('order-123')

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)

    // 驗證呼叫 service（reason 為 undefined）
    expect(mockCancelOrder).toHaveBeenCalledWith('order-123', 'user-123', undefined)
  })

  it('應該返回 400 當 action 不是 cancel', async () => {
    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'complete',
      }),
    })
    const context = createContext('order-123')

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('僅支援取消訂單操作')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當 action 欄位缺失', async () => {
    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reason: '不想要了',
      }),
    })
    const context = createContext('order-123')

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('驗證失敗')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })

  it('應該返回 400 當訂單 ID 為空', async () => {
    const request = new NextRequest('http://localhost/api/orders/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'cancel',
      }),
    })
    const context = createContext('')

    const response = await PATCH(request, context)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('訂單 ID 不能為空')
    expect(data.error.code).toBe('VALIDATION_FAILED')
  })
})

describe('PUT /api/orders/[id]', () => {
  it('應該返回 405 不支援的方法', async () => {
    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'PUT',
    })
    const context = createContext('order-123')

    const response = await PUT(request, context)
    const data = await response.json()

    expect(response.status).toBe(405)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('不支援的方法: PUT')
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })
})

describe('DELETE /api/orders/[id]', () => {
  it('應該返回 405 不支援的方法', async () => {
    const request = new NextRequest('http://localhost/api/orders/order-123', {
      method: 'DELETE',
    })
    const context = createContext('order-123')

    const response = await DELETE(request, context)
    const data = await response.json()

    expect(response.status).toBe(405)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('不支援的方法: DELETE')
    expect(data.error.code).toBe('METHOD_NOT_ALLOWED')
  })
})
