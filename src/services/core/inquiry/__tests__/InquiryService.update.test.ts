import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NotFoundError } from '@/lib/errors'
import type { UpdateInquiryRequest } from '@/types/inquiry'
import { InquiryService } from '../InquiryService'

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

describe('InquiryService - Update Operations', () => {
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
})
