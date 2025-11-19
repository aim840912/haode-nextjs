import { describe, it, expect, vi, beforeEach } from 'vitest'
import { InquiryService } from '../InquiryService'

// Use vi.hoisted() to ensure mock variables are available before hoisting
const {
  mockReserveInventory: _mockReserveInventory,
  mockFinalizeInventory: _mockFinalizeInventory,
  mockReleaseInventory: _mockReleaseInventory,
  MockInquiryInventoryService,
} = vi.hoisted(() => {
  const mockReserveInventory = vi.fn()
  const mockFinalizeInventory = vi.fn()
  const mockReleaseInventory = vi.fn()

  class MockInquiryInventoryService {
    reserveInventory = mockReserveInventory
    finalizeInventory = mockFinalizeInventory
    releaseInventory = mockReleaseInventory
  }

  return {
    mockReserveInventory,
    mockFinalizeInventory,
    mockReleaseInventory,
    MockInquiryInventoryService,
  }
})

vi.mock('../InquiryInventoryService', () => ({
  InquiryInventoryService: MockInquiryInventoryService,
}))

// Mock Supabase admin client - 整合 Query 和 Command 所需的所有 Mock
const mockSingle = vi.fn()
const mockIn = vi.fn()
const mockRange = vi.fn()
const mockOrder = vi.fn()
const mockLimit = vi.fn()
const mockOffset = vi.fn()
const mockEq = vi.fn()
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockFrom = vi.fn()

// 設定動態鏈式調用結構
const mockInsertSelectChain = {
  select: vi.fn(() => ({
    single: mockSingle,
  })),
}

mockSelect.mockReturnValue({
  eq: mockEq,
  single: mockSingle,
  in: mockIn,
  order: mockOrder,
  limit: mockLimit,
  offset: mockOffset,
})

mockEq.mockReturnValue({
  single: mockSingle,
  order: mockOrder,
  eq: mockEq, // 支援多次 eq 調用
  limit: mockLimit,
  offset: mockOffset,
  select: mockSelect,
})

mockOrder.mockReturnValue({
  range: mockRange,
  limit: mockLimit,
  offset: mockOffset,
})

mockLimit.mockReturnValue({
  offset: mockOffset,
  range: mockRange,
})

mockOffset.mockReturnValue({
  range: mockRange,
  limit: mockLimit,
})

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

describe('InquiryService - Query Operations', () => {
  let service: InquiryService

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
      limit: mockLimit,
      offset: mockOffset,
    })

    mockEq.mockReturnValue({
      single: mockSingle,
      order: mockOrder,
      eq: mockEq,
      limit: mockLimit,
      offset: mockOffset,
      select: mockSelect,
    })

    mockOrder.mockReturnValue({
      range: mockRange,
      limit: mockLimit,
      offset: mockOffset,
    })

    mockLimit.mockReturnValue({
      offset: mockOffset,
      range: mockRange,
    })

    mockOffset.mockReturnValue({
      range: mockRange,
      limit: mockLimit,
    })

    mockInsert.mockReturnValue(mockInsertSelectChain)

    mockUpdate.mockReturnValue({
      eq: mockEq,
    })

    mockDelete.mockReturnValue({
      eq: mockEq,
    })

    service = new InquiryService()
  })

  describe('getUserInquiries', () => {
    it('應該正確取得使用者詢問列表', async () => {
      const mockInquiriesData = [
        {
          id: 'inquiry-1',
          user_id: 'user-123',
          customer_name: '王小明',
          customer_email: 'test@example.com',
          customer_phone: '0912345678',
          status: 'pending',
          inquiry_type: 'product',
          notes: '想詢問產品資訊',
          total_estimated_amount: 1000,
          delivery_address: null,
          preferred_delivery_date: null,
          activity_title: null,
          visit_date: null,
          visitor_count: null,
          is_read: false,
          read_at: null,
          is_replied: false,
          replied_at: null,
          replied_by: null,
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
          inquiry_items: [],
        },
      ]

      // getUserInquiries: select().eq() → applyQueryParams → await
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => resolve({ data: mockInquiriesData, error: null })),
      }

      mockSelect.mockReturnValueOnce(mockQueryChain)

      const result = await service.getUserInquiries('user-123')

      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('inquiry-1')
      expect(result[0].customer_name).toBe('王小明')
    })

    it('應該支援查詢參數過濾', async () => {
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => resolve({ data: [], error: null })),
      }

      mockSelect.mockReturnValueOnce(mockQueryChain)

      await service.getUserInquiries('user-123', {
        status: 'pending',
        inquiry_type: 'product',
        limit: 10,
        offset: 0,
      })

      // 驗證查詢有呼叫 eq 方法進行過濾
      expect(mockQueryChain.eq).toHaveBeenCalled()
      expect(mockQueryChain.limit).toHaveBeenCalled()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn(resolve =>
          resolve({ data: null, error: { code: 'DB_ERROR', message: 'Database error' } })
        ),
      }

      mockSelect.mockReturnValueOnce(mockQueryChain)

      await expect(service.getUserInquiries('user-123')).rejects.toThrow()
    })
  })

  describe('getInquiryById', () => {
    it('應該返回 null 當詢問不存在 (PGRST116)', async () => {
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次調用：查詢 inquiry
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

      const result = await service.getInquiryById('user-123', 'inquiry-123')

      expect(result).toBeNull()
    })

    it('應該正確取得詢問詳情', async () => {
      const mockInquiryData = {
        id: 'inquiry-123',
        user_id: 'user-123',
        customer_name: '王小明',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        status: 'pending',
        inquiry_type: 'product',
        notes: '想詢問產品資訊',
        total_estimated_amount: 1000,
        delivery_address: null,
        preferred_delivery_date: null,
        activity_title: null,
        visit_date: null,
        visitor_count: null,
        is_read: false,
        read_at: null,
        is_replied: false,
        replied_at: null,
        replied_by: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        inquiry_items: [
          {
            id: 'item-1',
            inquiry_id: 'inquiry-123',
            product_id: 'product-1',
            quantity: 2,
            estimated_unit_price: 500,
            created_at: '2025-01-15T10:00:00Z',
            updated_at: '2025-01-15T10:00:00Z',
          },
        ],
      }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          // 第一次調用：查詢 inquiry
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () =>
                    Promise.resolve({
                      data: mockInquiryData,
                      error: null,
                    }),
                }),
              }),
            }),
          }
        }
      })

      const result = await service.getInquiryById('user-123', 'inquiry-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('inquiry-123')
      expect(result?.customer_name).toBe('王小明')
      expect(result?.inquiry_items).toBeDefined()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      await expect(service.getInquiryById('user-123', 'inquiry-123')).rejects.toThrow()
    })
  })

  describe('getAllInquiries', () => {
    it('應該正確取得所有詢問（管理員）', async () => {
      const mockInquiriesData = [
        {
          id: 'inquiry-1',
          user_id: 'user-123',
          customer_name: '王小明',
          customer_email: 'test1@example.com',
          customer_phone: '0912345678',
          status: 'pending',
          inquiry_type: 'product',
          notes: null,
          total_estimated_amount: null,
          delivery_address: null,
          preferred_delivery_date: null,
          activity_title: null,
          visit_date: null,
          visitor_count: null,
          is_read: false,
          read_at: null,
          is_replied: false,
          replied_at: null,
          replied_by: null,
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
          inquiry_items: [],
        },
        {
          id: 'inquiry-2',
          user_id: 'user-456',
          customer_name: '李小華',
          customer_email: 'test2@example.com',
          customer_phone: '0987654321',
          status: 'replied',
          inquiry_type: 'farm_tour',
          notes: null,
          total_estimated_amount: null,
          delivery_address: null,
          preferred_delivery_date: null,
          activity_title: '農場參觀',
          visit_date: '2025-02-01',
          visitor_count: '10',
          is_read: true,
          read_at: '2025-01-16T10:00:00Z',
          is_replied: true,
          replied_at: '2025-01-16T11:00:00Z',
          replied_by: 'admin-1',
          created_at: '2025-01-16T09:00:00Z',
          updated_at: '2025-01-16T11:00:00Z',
          inquiry_items: [],
        },
      ]

      // getAllInquiries 使用 await query (不用 range)
      mockSelect.mockReturnValueOnce(
        Promise.resolve({
          data: mockInquiriesData,
          error: null,
        })
      )

      const result = await service.getAllInquiries()

      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('inquiry-1')
      expect(result[1].id).toBe('inquiry-2')
    })

    it('應該支援過濾參數', async () => {
      // 使用 Promise 鏈，因為 applyQueryParams 會調用 eq/order/limit/offset
      const mockQueryChain = {
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockReturnThis(),
        then: vi.fn(resolve => resolve({ data: [], error: null })),
      }

      mockSelect.mockReturnValueOnce(mockQueryChain)

      await service.getAllInquiries({
        status: 'pending',
        unread_only: true,
        limit: 20,
      })

      expect(mockQueryChain.eq).toHaveBeenCalled()
      expect(mockQueryChain.order).toHaveBeenCalled()
      expect(mockQueryChain.limit).toHaveBeenCalled()
    })

    it('應該處理資料庫查詢錯誤', async () => {
      mockSelect.mockReturnValueOnce(
        Promise.resolve({
          data: null,
          error: { code: 'DB_ERROR', message: 'Database error' },
        })
      )

      await expect(service.getAllInquiries()).rejects.toThrow()
    })
  })

  describe('getInquiryByIdForAdmin', () => {
    it('應該返回 null 當詢問不存在', async () => {
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getInquiryByIdForAdmin('inquiry-123')

      expect(result).toBeNull()
    })

    it('應該正確取得詢問（不驗證使用者）', async () => {
      const mockInquiryData = {
        id: 'inquiry-123',
        user_id: 'user-123',
        customer_name: '王小明',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        status: 'pending',
        inquiry_type: 'product',
        notes: null,
        total_estimated_amount: null,
        delivery_address: null,
        preferred_delivery_date: null,
        activity_title: null,
        visit_date: null,
        visitor_count: null,
        is_read: false,
        read_at: null,
        is_replied: false,
        replied_at: null,
        replied_by: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
        inquiry_items: [],
      }

      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                single: () =>
                  Promise.resolve({
                    data: mockInquiryData,
                    error: null,
                  }),
              }),
            }),
          }
        }
      })

      const result = await service.getInquiryByIdForAdmin('inquiry-123')

      expect(result).not.toBeNull()
      expect(result?.id).toBe('inquiry-123')
      expect(result?.customer_name).toBe('王小明')
    })
  })

  describe('getInquiryStats', () => {
    it('應該返回空陣列（佔位實作）', async () => {
      // getInquiryStats 是佔位實作,直接返回空陣列
      const result = await service.getInquiryStats()

      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
    })
  })
})
