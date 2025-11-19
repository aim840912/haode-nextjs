import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundError, ValidationError } from '@/lib/errors'
import type { CreateInquiryRequest, UpdateInquiryRequest } from '@/types/inquiry'
import { InquiryService } from './InquiryService'

// Use vi.hoisted() to ensure mock variables are available before hoisting
const {
  mockReserveInventory,
  mockFinalizeInventory,
  mockReleaseInventory,
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

vi.mock('./InquiryInventoryService', () => ({
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

describe('InquiryService', () => {
  let service: InquiryService

  const mockProductInquiryData: CreateInquiryRequest = {
    customer_name: '王小明',
    customer_email: 'test@example.com',
    customer_phone: '0912345678',
    inquiry_type: 'product',
    items: [
      {
        product_id: 'product-1',
        product_name: '測試產品',
        product_category: '水果',
        quantity: 2,
        unit_price: 500,
        notes: '請提供報價',
      },
    ],
    delivery_address: '台北市中正區',
    preferred_delivery_date: '2025-02-01',
    notes: '希望盡快回覆',
  }

  const mockFarmTourInquiryData: CreateInquiryRequest = {
    customer_name: '李小華',
    customer_email: 'test2@example.com',
    customer_phone: '0987654321',
    inquiry_type: 'farm_tour',
    activity_title: '農場參觀',
    visit_date: '2025-02-15',
    visitor_count: '10',
    notes: '學校戶外教學',
  }

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

  // =================================================================
  // 查詢方法測試（Query Operations）
  // =================================================================

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

  // =================================================================
  // 命令方法測試（Command Operations）
  // =================================================================

  describe('createInquiry', () => {
    it('應該成功建立產品詢價單', async () => {
      const mockCreatedInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        customer_name: '王小明',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        inquiry_type: 'product',
        notes: '希望盡快回覆',
        delivery_address: '台北市中正區',
        preferred_delivery_date: '2025-02-01',
        total_estimated_amount: 1000,
        status: 'pending',
        is_read: false,
        read_at: null,
        is_replied: false,
        replied_at: null,
        replied_by: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      const mockInquiryItems = [
        {
          id: 'item-1',
          inquiry_id: 'inquiry-123',
          product_id: 'product-1',
          product_name: '測試產品',
          product_category: '水果',
          quantity: 2,
          unit_price: 500,
          total_price: 1000,
          notes: '請提供報價',
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ]

      // Mock insert inquiry (第一次 from 調用)
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          // 建立詢問單主記錄
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockCreatedInquiry, error: null }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiry_items') {
          // 建立詢問項目
          return {
            insert: () => ({
              select: () => Promise.resolve({ data: mockInquiryItems, error: null }),
            }),
          }
        }
      })

      const result = await service.createInquiry('user-123', mockProductInquiryData)

      expect(result.id).toBe('inquiry-123')
      expect(result.customer_name).toBe('王小明')
      expect(result.inquiry_items).toHaveLength(1)
      expect(result.inquiry_items[0].product_id).toBe('product-1')
    })

    it('應該成功建立農場參觀詢問', async () => {
      const mockCreatedInquiry = {
        id: 'inquiry-456',
        user_id: 'user-123',
        customer_name: '李小華',
        customer_email: 'test2@example.com',
        customer_phone: '0987654321',
        inquiry_type: 'farm_tour',
        notes:
          'FARM_TOUR_DATA:{"activity_title":"農場參觀","visit_date":"2025-02-15","visitor_count":"10","original_notes":"學校戶外教學"}',
        delivery_address: null,
        preferred_delivery_date: null,
        total_estimated_amount: null,
        activity_title: null,
        visit_date: null,
        visitor_count: null,
        status: 'pending',
        is_read: false,
        read_at: null,
        is_replied: false,
        replied_at: null,
        replied_by: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      }

      mockFrom.mockImplementation(table => {
        if (table === 'inquiries') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockCreatedInquiry, error: null }),
              }),
            }),
          }
        }
      })

      const result = await service.createInquiry('user-123', mockFarmTourInquiryData)

      expect(result.id).toBe('inquiry-456')
      expect(result.inquiry_type).toBe('farm_tour')
      expect(result.activity_title).toBe('農場參觀')
      expect(result.visit_date).toBe('2025-02-15')
      expect(result.visitor_count).toBe('10')
    })

    it('應該在客戶名稱為空時拋出 ValidationError', async () => {
      const invalidData = {
        ...mockProductInquiryData,
        customer_name: '',
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        '客戶姓名不能為空'
      )
    })

    it('應該在 Email 為空時拋出 ValidationError', async () => {
      const invalidData = {
        ...mockProductInquiryData,
        customer_email: '',
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        '客戶Email不能為空'
      )
    })

    it('應該在 Email 格式不正確時拋出 ValidationError', async () => {
      const invalidData = {
        ...mockProductInquiryData,
        customer_email: 'invalid-email',
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        'Email格式不正確'
      )
    })

    it('應該在產品詢價缺少項目時拋出 ValidationError', async () => {
      const invalidData = {
        ...mockProductInquiryData,
        items: [],
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        '產品詢價必須包含至少一個項目'
      )
    })

    it('應該在產品項目資料不完整時拋出 ValidationError', async () => {
      const invalidData: CreateInquiryRequest = {
        ...mockProductInquiryData,
        items: [
          {
            product_id: '',
            product_name: '測試產品',
            quantity: 2,
          },
        ],
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        '第 1 項產品ID不能為空'
      )
    })

    it('應該在農場參觀缺少活動標題時拋出 ValidationError', async () => {
      const invalidData: CreateInquiryRequest = {
        ...mockFarmTourInquiryData,
        activity_title: '',
      }

      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(ValidationError)
      await expect(service.createInquiry('user-123', invalidData)).rejects.toThrow(
        '活動標題不能為空'
      )
    })

    it('應該在建立詢問項目失敗時刪除已建立的詢問單', async () => {
      const mockCreatedInquiry = {
        id: 'inquiry-to-rollback',
        user_id: 'user-123',
        // ... other fields
      }

      let fromCallCount = 0
      const mockDeleteFn = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      })

      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          return {
            insert: () => ({
              select: () => ({
                single: () => Promise.resolve({ data: mockCreatedInquiry, error: null }),
              }),
            }),
            delete: mockDeleteFn,
          }
        } else if (fromCallCount === 2 && table === 'inquiry_items') {
          // 建立項目失敗
          return {
            insert: () => ({
              select: () => Promise.resolve({ data: null, error: { code: 'DB_ERROR' } }),
            }),
          }
        } else if (fromCallCount === 3 && table === 'inquiries') {
          // 刪除已建立的詢問單
          return {
            delete: mockDeleteFn,
          }
        }
      })

      await expect(service.createInquiry('user-123', mockProductInquiryData)).rejects.toThrow()

      // 驗證有呼叫刪除
      expect(mockDeleteFn).toHaveBeenCalled()
    })
  })

  describe('updateInquiry', () => {
    it('應該成功更新詢問單', async () => {
      const mockExistingInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        customer_name: '王小明',
        customer_email: 'test@example.com',
        customer_phone: '0912345678',
        status: 'pending',
        inquiry_type: 'product',
        notes: '原始備註',
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

      const updateData: UpdateInquiryRequest = {
        notes: '更新後的備註',
        delivery_address: '台北市大安區',
      }

      const mockUpdatedInquiry = {
        ...mockExistingInquiry,
        notes: '更新後的備註',
        delivery_address: '台北市大安區',
        updated_at: '2025-01-15T11:00:00Z',
      }

      // Mock getInquiryById (內部調用 from)
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          // 第一次：getInquiryById 檢查所有權
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  single: () => Promise.resolve({ data: mockExistingInquiry, error: null }),
                }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiries') {
          // 第二次：update 更新詢問單
          return {
            update: () => ({
              eq: () => ({
                eq: () => ({
                  select: () => ({
                    single: () => Promise.resolve({ data: mockUpdatedInquiry, error: null }),
                  }),
                }),
              }),
            }),
          }
        }
      })

      const result = await service.updateInquiry('user-123', 'inquiry-123', updateData)

      expect(result.id).toBe('inquiry-123')
      expect(result.notes).toBe('更新後的備註')
      expect(result.delivery_address).toBe('台北市大安區')
    })

    it('應該在詢問單不存在時拋出 NotFoundError', async () => {
      const updateData: UpdateInquiryRequest = {
        notes: '更新備註',
      }

      // Mock getInquiryById 返回 null
      mockFrom.mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        }
      })

      await expect(service.updateInquiry('user-123', 'non-existent', updateData)).rejects.toThrow(
        NotFoundError
      )
      await expect(service.updateInquiry('user-123', 'non-existent', updateData)).rejects.toThrow(
        '詢問單不存在或無權限修改'
      )
    })
  })

  describe('updateInquiryStatus', () => {
    it('應該成功更新詢問單狀態為 quoted（報價）', async () => {
      const mockExistingInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        status: 'pending',
        inquiry_type: 'product',
        inquiry_items: [],
        // ... other fields
      }

      const mockUpdatedInquiry = {
        ...mockExistingInquiry,
        status: 'quoted',
        is_replied: true,
        replied_at: '2025-01-15T11:00:00Z',
      }

      // Mock getInquiryByIdForAdmin 和 update
      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          // 第一次：getInquiryByIdForAdmin
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockExistingInquiry, error: null }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiries') {
          // 第二次：update 更新狀態
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockUpdatedInquiry, error: null }),
                }),
              }),
            }),
          }
        }
      })

      const result = await service.updateInquiryStatus('inquiry-123', 'quoted')

      expect(result.status).toBe('quoted')
      expect(result.is_replied).toBe(true)
    })

    it('應該在狀態變更為 confirmed 時保留庫存', async () => {
      const mockExistingInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        status: 'pending',
        inquiry_type: 'product',
        inquiry_items: [
          {
            id: 'item-1',
            product_id: 'product-1',
            quantity: 2,
          },
        ],
        // ... other fields
      }

      const mockUpdatedInquiry = {
        ...mockExistingInquiry,
        status: 'confirmed',
      }

      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockExistingInquiry, error: null }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiries') {
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockUpdatedInquiry, error: null }),
                }),
              }),
            }),
          }
        }
      })

      await service.updateInquiryStatus('inquiry-123', 'confirmed')

      // 驗證有呼叫庫存保留
      expect(mockReserveInventory).toHaveBeenCalledWith(
        'inquiry-123',
        mockExistingInquiry.inquiry_items
      )
    })

    it('應該在狀態從 confirmed → completed 時扣減庫存', async () => {
      const mockExistingInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        status: 'confirmed',
        inquiry_type: 'product',
        inquiry_items: [
          {
            id: 'item-1',
            product_id: 'product-1',
            quantity: 2,
          },
        ],
      }

      const mockUpdatedInquiry = {
        ...mockExistingInquiry,
        status: 'completed',
      }

      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockExistingInquiry, error: null }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiries') {
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockUpdatedInquiry, error: null }),
                }),
              }),
            }),
          }
        }
      })

      await service.updateInquiryStatus('inquiry-123', 'completed')

      // 驗證有呼叫庫存扣減
      expect(mockFinalizeInventory).toHaveBeenCalledWith(mockExistingInquiry.inquiry_items)
    })

    it('應該在狀態從 confirmed → cancelled 時釋放庫存', async () => {
      const mockExistingInquiry = {
        id: 'inquiry-123',
        user_id: 'user-123',
        status: 'confirmed',
        inquiry_type: 'product',
        inquiry_items: [
          {
            id: 'item-1',
            product_id: 'product-1',
            quantity: 2,
          },
        ],
      }

      const mockUpdatedInquiry = {
        ...mockExistingInquiry,
        status: 'cancelled',
      }

      let fromCallCount = 0
      mockFrom.mockImplementation(table => {
        fromCallCount++

        if (fromCallCount === 1 && table === 'inquiries') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: mockExistingInquiry, error: null }),
              }),
            }),
          }
        } else if (fromCallCount === 2 && table === 'inquiries') {
          return {
            update: () => ({
              eq: () => ({
                select: () => ({
                  single: () => Promise.resolve({ data: mockUpdatedInquiry, error: null }),
                }),
              }),
            }),
          }
        }
      })

      await service.updateInquiryStatus('inquiry-123', 'cancelled')

      // 驗證有呼叫庫存釋放
      expect(mockReleaseInventory).toHaveBeenCalledWith(mockExistingInquiry.inquiry_items)
    })

    it('應該在詢問單不存在時拋出 NotFoundError', async () => {
      mockFrom.mockImplementation(() => {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({ data: null, error: { code: 'PGRST116' } }),
            }),
          }),
        }
      })

      await expect(service.updateInquiryStatus('non-existent', 'quoted')).rejects.toThrow(
        NotFoundError
      )
      await expect(service.updateInquiryStatus('non-existent', 'quoted')).rejects.toThrow(
        '詢問單不存在'
      )
    })
  })

  describe('deleteInquiry', () => {
    it('應該成功刪除詢問單', async () => {
      mockFrom.mockImplementation(table => {
        if (table === 'inquiries') {
          return {
            delete: () => ({
              eq: () => Promise.resolve({ error: null }),
            }),
          }
        }
      })

      await expect(service.deleteInquiry('inquiry-123')).resolves.toBeUndefined()
    })

    it('應該處理刪除錯誤', async () => {
      mockFrom.mockImplementation(table => {
        if (table === 'inquiries') {
          return {
            delete: () => ({
              eq: () => Promise.resolve({ error: { code: 'DB_ERROR', message: 'Delete failed' } }),
            }),
          }
        }
      })

      await expect(service.deleteInquiry('inquiry-123')).rejects.toThrow()
    })
  })
})
