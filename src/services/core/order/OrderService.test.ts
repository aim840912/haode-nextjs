import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/lib/errors'
import type { CreateOrderRequest, ShippingAddress } from '@/types/order'
import { OrderService } from './OrderService'

// Mock Supabase admin client - 整合 Query 和 Command 所需的所有 Mock
const mockSingle = vi.fn()
const mockIn = vi.fn()
const mockRange = vi.fn()
const mockOrder = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockRpc = vi.fn()
const mockUpdate = vi.fn()
const mockInsert = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()

// 設定動態鏈式調用結構
// select() 可能被 .eq() 或 .single() 接續
mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle, // 支援 select().single() (getOrderSummary)
  in: mockIn,
  order: mockOrder,
})

// eq() 可能被另一個 .eq() 或 .single() 接續
mockEq.mockReturnValue({
  single: mockSingle, // 支援 eq().single() (findById) 和 eq().eq().single() (getOrderById)
  order: mockOrder,
  eq: mockEq, // 支援多次 eq 調用
})

mockOrder.mockReturnValue({
  range: mockRange,
})

// 設定 Insert Mock 鏈
const mockInsertSelectChain = {
  select: vi.fn().mockReturnValue({
    single: mockSingle,
    then: vi.fn(),
  }),
}

mockInsert.mockReturnValue(mockInsertSelectChain)

mockUpdate.mockReturnValue({
  eq: mockEq,
})

mockDelete.mockReturnValue({
  eq: mockEq,
})

mockFrom.mockReturnValue({
  select: mockSelect,
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
})

const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
}

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => mockSupabaseClient),
}))

// Mock logger
vi.mock('@/lib/logger', () => ({
  dbLogger: {
    timer: vi.fn(() => ({
      end: vi.fn(),
    })),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('OrderService', () => {
  let service: OrderService

  beforeEach(() => {
    vi.clearAllMocks()

    // 重置所有 Mocks 為預設實作
    mockFrom.mockReturnValue({
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    })

    mockSelect.mockReturnValue({
      eq: mockEq,
      single: mockSingle,
      in: mockIn,
      order: mockOrder,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      eq: mockEq,
    })

    mockOrder.mockReturnValue({
      range: mockRange,
    })

    mockInsert.mockReturnValue(mockInsertSelectChain)

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockDelete.mockReturnValue({
      eq: mockEq,
    })

    service = new OrderService()
  })

  // ==================== 查詢方法測試 (Query Methods) ====================

  describe('getUserOrders', () => {
    it('應該拋出 ValidationError 當 userId 為空', async () => {
      await expect(service.getUserOrders('', 20, 0)).rejects.toThrow(ValidationError)
      await expect(service.getUserOrders('', 20, 0)).rejects.toThrow('使用者 ID 不能為空')
    })

    it('應該正確取得使用者訂單（含分頁）', async () => {
      const mockOrdersData = [
        {
          id: 'order-1',
          user_id: 'user-123',
          total_amount: 100,
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'order-2',
          user_id: 'user-123',
          total_amount: 200,
          status: 'processing',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      // Mock count query
      const mockCountSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null,
          count: 2,
        })),
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      // Mock data query
      mockRange.mockResolvedValueOnce({
        data: mockOrdersData,
        error: null,
      })

      // Mock order items batch query (空數組)
      mockIn.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getUserOrders('user-123', 20, 0)

      expect(result.orders).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.orders[0].id).toBe('order-1')
      expect(result.orders[0].items).toEqual([])
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Mock count query with error
      const mockCountSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: { code: 'DB_ERROR', message: 'Database error' },
          count: null,
        })),
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      await expect(service.getUserOrders('user-123', 20, 0)).rejects.toThrow()
    })
  })

  describe('getOrderById', () => {
    it('應該拋出 ValidationError 當參數為空', async () => {
      await expect(service.getOrderById('', 'user-123')).rejects.toThrow(ValidationError)
      await expect(service.getOrderById('order-123', '')).rejects.toThrow(ValidationError)
      await expect(service.getOrderById('', '')).rejects.toThrow('訂單 ID 和使用者 ID 不能為空')
    })

    it('應該返回 null 當訂單不存在 (PGRST116)', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getOrderById('order-123', 'user-123')

      expect(result).toBeNull()
    })

    it('應該正確取得訂單詳情', async () => {
      const mockOrderData = {
        id: 'order-123',
        user_id: 'user-123',
        total_amount: 100,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      const mockOrderItems = [
        {
          id: 'item-1',
          order_id: 'order-123',
          product_id: 'product-1',
          quantity: 2,
          price: 50,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ]

      // Mock 第一次查詢：from('orders').select().eq().eq().single()
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次調用：查詢 order
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: mockOrderData,
                      error: null,
                    }),
                }),
              }),
            }),
          }
        } else {
          // 第二次調用：查詢 order_items
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: mockOrderItems,
                  error: null,
                }),
            }),
          }
        }
      })

      const result = await service.getOrderById('order-123', 'user-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('order-123')
      expect(result?.totalAmount).toBe(100)
      expect(result?.items).toHaveLength(1)
      expect(result?.items[0].quantity).toBe(2)
    })

    it('應該處理資料庫查詢錯誤', async () => {
      // Mock order query 返回錯誤
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // 不需要 mock order items，因為應該在第一個查詢就失敗
      await expect(service.getOrderById('order-123', 'user-123')).rejects.toThrow('資料庫操作失敗')
    })
  })

  describe('getOrderSummary', () => {
    it('應該正確取得訂單統計', async () => {
      const mockSummaryData = {
        total_orders: 100,
        total_amount: '10000.50',
        pending_orders: 20,
        processing_orders: 30,
        delivered_orders: 50,
      }

      // Mock from('order_summary_view').select('*').single()
      mockSingle.mockResolvedValueOnce({
        data: mockSummaryData,
        error: null,
      })

      const result = await service.getOrderSummary()

      expect(result.totalOrders).toBe(100)
      expect(result.totalAmount).toBe(10000.5)
      expect(result.pendingOrders).toBe(20)
      expect(result.processingOrders).toBe(30)
      expect(result.deliveredOrders).toBe(50)
    })

    it('應該處理空數據（預設值為 0）', async () => {
      // 清除之前測試的 mock 並設定新的返回值
      mockSingle.mockResolvedValueOnce({
        data: {},
        error: null,
      })

      const result = await service.getOrderSummary()

      expect(result.totalOrders).toBe(0)
      expect(result.totalAmount).toBe(0)
      expect(result.pendingOrders).toBe(0)
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getOrderSummary()).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('應該返回 null 當訂單不存在', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.findById('order-123')

      expect(result).toBeNull()
    })

    it('應該正確取得訂單（不驗證使用者）', async () => {
      const mockOrderData = {
        id: 'order-123',
        user_id: 'user-123',
        total_amount: 100,
        status: 'pending',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }

      // Mock 第一次查詢：from('orders').select().eq().single()
      // Mock 第二次查詢：from('order_items').select().eq()
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次調用：查詢 order
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockOrderData,
                    error: null,
                  }),
              }),
            }),
          }
        } else {
          // 第二次調用：查詢 order_items
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
            }),
          }
        }
      })

      const result = await service.findById('order-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('order-123')
      expect(result?.items).toEqual([])
    })
  })

  describe('getAllOrders', () => {
    it('應該正確取得所有訂單（管理員）', async () => {
      const mockOrdersData = [
        {
          id: 'order-1',
          user_id: 'user-123',
          total_amount: 100,
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'order-2',
          user_id: 'user-456',
          total_amount: 200,
          status: 'delivered',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ]

      // Mock count query
      const mockCountSelect = vi.fn(() => ({
        data: null,
        error: null,
        count: 2,
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      // Mock data query
      mockRange.mockResolvedValueOnce({
        data: mockOrdersData,
        error: null,
      })

      // Mock order items batch query (空數組)
      mockIn.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getAllOrders(20, 0)

      expect(result.orders).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.orders[0].id).toBe('order-1')
      expect(result.orders[1].id).toBe('order-2')
    })

    it('應該處理資料庫查詢錯誤（count）', async () => {
      // Mock count query with error
      const mockCountSelect = vi.fn(() => ({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
        count: null,
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      await expect(service.getAllOrders(20, 0)).rejects.toThrow()
    })

    it('應該處理資料庫查詢錯誤（data）', async () => {
      // Mock count query
      const mockCountSelect = vi.fn(() => ({
        data: null,
        error: null,
        count: 10,
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      // Mock data query with error
      mockRange.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getAllOrders(20, 0)).rejects.toThrow()
    })
  })

  // ==================== 命令方法測試 (Command Methods) ====================

  describe('createOrder', () => {
    const mockShippingAddress: ShippingAddress = {
      name: '王小明',
      phone: '0912345678',
      postalCode: '100',
      city: '台北市',
      street: '中正區中山路 1 號',
      country: '台灣',
    }

    it('應該拋出 ValidationError 當 userId 為空', async () => {
      const orderData: CreateOrderRequest = {
        items: [{ productId: 'product-1', quantity: 1 }],
        shippingAddress: mockShippingAddress,
        paymentMethod: 'credit_card',
      }

      await expect(service.createOrder('', orderData)).rejects.toThrow(ValidationError)
      await expect(service.createOrder('', orderData)).rejects.toThrow(
        '使用者 ID 和訂單項目不能為空'
      )
    })

    it('應該拋出 ValidationError 當 items 為空', async () => {
      const orderData: CreateOrderRequest = {
        items: [],
        shippingAddress: mockShippingAddress,
        paymentMethod: 'credit_card',
      }

      await expect(service.createOrder('user-123', orderData)).rejects.toThrow(ValidationError)
    })

    it('應該拋出錯誤當產品不存在', async () => {
      const orderData: CreateOrderRequest = {
        items: [{ productId: 'product-1', quantity: 1 }],
        shippingAddress: mockShippingAddress,
        paymentMethod: 'credit_card',
      }

      // Mock getProductById 返回 null (產品不存在)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock generate_order_number
      mockRpc.mockResolvedValueOnce({
        data: 'ORD-20240101-0001',
        error: null,
      })

      await expect(service.createOrder('user-123', orderData)).rejects.toThrow('產品不存在')
    })

    it('應該拋出錯誤當產品庫存不足', async () => {
      const orderData: CreateOrderRequest = {
        items: [{ productId: 'product-1', quantity: 10 }],
        shippingAddress: mockShippingAddress,
        paymentMethod: 'credit_card',
      }

      // Mock getProductById 返回庫存不足的產品
      mockSingle.mockResolvedValueOnce({
        data: {
          id: 'product-1',
          name: '測試產品',
          price: 100,
          inventory: 5, // 庫存只有 5
          priceUnit: '台斤',
          unitQuantity: 1,
          images: ['image1.jpg'],
        },
        error: null,
      })

      // Mock generate_order_number
      mockRpc.mockResolvedValueOnce({
        data: 'ORD-20240101-0001',
        error: null,
      })

      await expect(service.createOrder('user-123', orderData)).rejects.toThrow('產品庫存不足')
    })

    it('應該成功建立訂單', async () => {
      const orderData: CreateOrderRequest = {
        items: [{ productId: 'product-1', quantity: 2 }],
        shippingAddress: mockShippingAddress,
        paymentMethod: 'credit_card',
        notes: '請在下午送達',
      }

      // Mock generate_order_number (第一次 RPC 調用)
      mockRpc.mockResolvedValueOnce({
        data: 'ORD-20240101-0001',
        error: null,
      })

      // Mock client.from() calls
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'products') {
          // 第一次：getProductById - .select().eq().eq().single()
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 'product-1',
                        name: '測試產品',
                        price: 500,
                        inventory: 10,
                        priceUnit: '台斤',
                        unitQuantity: 1,
                        images: ['image1.jpg'],
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'orders') {
          // 第二次：insert order
          return {
            insert: () => ({
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'order-123',
                      order_number: 'ORD-20240101-0001',
                      user_id: 'user-123',
                      status: 'pending',
                      subtotal: 1000,
                      shipping_fee: 0,
                      tax: 0,
                      total_amount: 1000,
                      created_at: '2024-01-01T00:00:00Z',
                      updated_at: '2024-01-01T00:00:00Z',
                    },
                    error: null,
                  }),
              }),
            }),
          }
        } else if (fromCallCount === 3 && table === 'order_items') {
          // 第三次：insert order items
          return {
            insert: () => ({
              select: () =>
                Promise.resolve({
                  data: [
                    {
                      id: 'item-1',
                      order_id: 'order-123',
                      product_id: 'product-1',
                      product_name: '測試產品',
                      product_image: 'image1.jpg',
                      quantity: 2,
                      unit_price: 500,
                      price_unit: '台斤',
                      unit_quantity: 1,
                      subtotal: 1000,
                      created_at: '2024-01-01T00:00:00Z',
                      updated_at: '2024-01-01T00:00:00Z',
                    },
                  ],
                  error: null,
                }),
            }),
          }
        } else {
          // Default: return mock structure for other tables
          return {
            select: mockSelect,
            insert: mockInsert,
            update: mockUpdate,
            delete: mockDelete,
          }
        }
      })

      // Mock update_product_inventory (第二次 RPC 調用)
      mockRpc.mockResolvedValueOnce({ data: null, error: null })

      const result = await service.createOrder('user-123', orderData)

      expect(result.id).toBe('order-123')
      expect(result.orderNumber).toBe('ORD-20240101-0001')
      expect(result.totalAmount).toBe(1000)
      expect(result.items).toHaveLength(1)
    })
  })

  describe('cancelOrder', () => {
    it('應該拋出 ValidationError 當參數為空', async () => {
      await expect(service.cancelOrder('', 'user-123')).rejects.toThrow(ValidationError)
      await expect(service.cancelOrder('order-123', '')).rejects.toThrow(ValidationError)
      await expect(service.cancelOrder('', '')).rejects.toThrow('訂單 ID 和使用者 ID 不能為空')
    })

    it('應該拋出錯誤當訂單不存在', async () => {
      // Mock getOrderById 返回 null
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: null,
                      error: { code: 'PGRST116' },
                    }),
                }),
              }),
            }),
          }
        }
      })

      await expect(service.cancelOrder('order-123', 'user-123')).rejects.toThrow(
        '訂單不存在或無權限'
      )
    })

    it('應該拋出錯誤當訂單狀態無法取消', async () => {
      // Mock getOrderById 返回已送達的訂單
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 'order-123',
                        status: 'delivered', // 已送達,無法取消
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }
        } else if (callCount === 2) {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [],
                  error: null,
                }),
            }),
          }
        }
      })

      await expect(service.cancelOrder('order-123', 'user-123')).rejects.toThrow(
        '此訂單狀態無法取消'
      )
    })

    it('應該成功取消訂單', async () => {
      // Mock getOrderById
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++
        if (fromCallCount === 1 && table === 'orders') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: {
                        id: 'order-123',
                        status: 'pending',
                      },
                      error: null,
                    }),
                }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'order_items') {
          return {
            select: () => ({
              eq: () =>
                Promise.resolve({
                  data: [
                    {
                      product_id: 'product-1',
                      quantity: 2,
                    },
                  ],
                  error: null,
                }),
            }),
          }
        } else if (fromCallCount === 3 && table === 'orders') {
          // Update call
          return {
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }
        }
      })

      // Mock restore inventory
      mockRpc.mockResolvedValueOnce({ data: null, error: null })

      await service.cancelOrder('order-123', 'user-123', '不想要了')

      expect(mockRpc).toHaveBeenCalledWith('update_product_inventory', {
        p_product_id: 'product-1',
        p_quantity_change: 2, // 恢復庫存
      })
    })
  })

  describe('updateOrderStatus', () => {
    it('應該拋出 ValidationError 當參數為空', async () => {
      await expect(service.updateOrderStatus('', 'pending')).rejects.toThrow(ValidationError)
      await expect(service.updateOrderStatus('order-123', '' as any)).rejects.toThrow(
        ValidationError
      )
    })

    it('應該成功更新訂單狀態', async () => {
      mockEq.mockResolvedValueOnce({ error: null })

      await service.updateOrderStatus('order-123', 'processing', '開始處理')

      expect(mockUpdate).toHaveBeenCalledWith({
        status: 'processing',
        notes: '開始處理',
      })
      expect(mockEq).toHaveBeenCalledWith('id', 'order-123')
    })

    it('應該在狀態為 delivered 時設定實際送達日期', async () => {
      mockEq.mockResolvedValueOnce({ error: null })

      await service.updateOrderStatus('order-123', 'delivered')

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'delivered',
          actual_delivery_date: expect.any(String),
        })
      )
    })

    it('應該處理資料庫更新錯誤', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.updateOrderStatus('order-123', 'processing')).rejects.toThrow()
    })
  })

  describe('updateOrder', () => {
    it('應該拋出 ValidationError 當 orderId 為空', async () => {
      await expect(service.updateOrder('', { notes: '測試' })).rejects.toThrow(ValidationError)
      await expect(service.updateOrder('', { notes: '測試' })).rejects.toThrow('訂單 ID 不能為空')
    })

    it('應該成功更新訂單並返回更新後的訂單', async () => {
      // Mock update - client.from().update().eq()
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++
        if (fromCallCount === 1) {
          // 第一次：update 查詢
          return {
            update: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }
        } else {
          // 第二次：select 查詢
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: {
                      id: 'order-123',
                      order_number: 'ORD-20240101-0001',
                      user_id: 'user-123',
                      status: 'pending',
                      notes: '更新後的備註',
                      created_at: '2024-01-01T00:00:00Z',
                      updated_at: '2024-01-01T01:00:00Z',
                    },
                    error: null,
                  }),
              }),
            }),
          }
        }
      })

      const result = await service.updateOrder('order-123', { notes: '更新後的備註' })

      expect(result.id).toBe('order-123')
    })

    it('應該處理更新錯誤', async () => {
      mockEq.mockResolvedValueOnce({
        error: { code: 'DB_ERROR', message: 'Update failed' },
      })

      await expect(service.updateOrder('order-123', { notes: '測試' })).rejects.toThrow()
    })

    it('應該處理取得更新後訂單錯誤', async () => {
      // Mock update success
      let callCount = 0
      mockEq.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次：update 成功
          return Promise.resolve({ error: null })
        } else {
          // 第二次：single() 返回錯誤
          return {
            single: () =>
              Promise.resolve({
                data: null,
                error: { code: 'DB_ERROR', message: 'Fetch failed' },
              }),
          }
        }
      })

      await expect(service.updateOrder('order-123', { notes: '測試' })).rejects.toThrow()
    })
  })
})
