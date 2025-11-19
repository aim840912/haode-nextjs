import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ValidationError } from '@/lib/errors'
import type { CreateInquiryRequest } from '@/types/inquiry'
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

describe('InquiryService - Create Operations', () => {
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
})
