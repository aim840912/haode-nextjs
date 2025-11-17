/**
 * OrderService 查詢操作測試
 *
 * 包含所有查詢相關的測試:
 * - getUserOrders
 * - getOrderById
 * - getOrderSummary
 * - findById
 * - getAllOrders
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/lib/errors'
import { OrderService } from '../OrderService'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

// 使用 vi.hoisted 建立 mocks
const hoistedMocks = vi.hoisted(() => {
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

  const mockSupabaseClient = {
    from: mockFrom,
    rpc: mockRpc,
  }

  return {
    mockSingle,
    mockIn,
    mockRange,
    mockOrder,
    mockEq,
    mockSelect,
    mockRpc,
    mockUpdate,
    mockInsert,
    mockDelete,
    mockFrom,
    mockSupabaseClient,
  }
})

const {
  mockSingle,
  mockIn,
  mockRange,
  mockOrder,
  mockEq,
  mockSelect,
  mockFrom,
  mockSupabaseClient,
} = hoistedMocks

// Vi.mock 必須在同一檔案中才能正確 hoist
vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => hoistedMocks.mockSupabaseClient),
}))

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

// ============================================================================
// Mock Chain Setup
// ============================================================================

function setupMockChains() {
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

  mockFrom.mockReturnValue({
    select: mockSelect,
  })
}

function resetAllMocks() {
  vi.clearAllMocks()
  mockFrom.mockReturnValue({
    select: mockSelect,
  })
  setupMockChains()
}

describe('OrderService - 查詢操作', () => {
  let service: OrderService

  beforeEach(() => {
    service = new OrderService()
    resetAllMocks()
  })

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
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const result = await service.getOrderSummary()

      expect(result.totalOrders).toBe(0)
      expect(result.totalAmount).toBe(0)
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getOrderSummary()).rejects.toThrow()
    })
  })

  describe('findById', () => {
    it('應該返回 null 當訂單不存在', async () => {
      mockSingle.mockResolvedValueOnce({
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
        shipping_address: { city: 'Taipei', district: "Da'an" },
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

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
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

      const result = await service.findById('order-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('order-123')
      expect(result?.totalAmount).toBe(100)
      expect(result?.shippingAddress?.city).toBe('Taipei')
      expect(result?.items).toHaveLength(1)
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
      ]

      // Mock count query
      const mockCountSelect = vi.fn(() => ({
        data: null,
        error: null,
        count: 1,
      }))

      mockFrom.mockImplementationOnce(() => ({
        select: mockCountSelect,
      }))

      // Mock data query
      mockRange.mockResolvedValueOnce({
        data: mockOrdersData,
        error: null,
      })

      // Mock order items batch query
      mockIn.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      const result = await service.getAllOrders(20, 0)

      expect(result.orders).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('應該處理資料庫查詢錯誤（count）', async () => {
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
      // Mock count query success
      const mockCountSelect = vi.fn(() => ({
        data: null,
        error: null,
        count: 1,
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
})
