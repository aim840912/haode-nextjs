import { describe, it, expect, vi, beforeEach } from 'vitest'
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

describe('InquiryService - Delete Operations', () => {
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
