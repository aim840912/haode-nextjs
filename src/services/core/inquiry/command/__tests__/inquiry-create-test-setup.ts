/**
 * InquiryCreateService 測試共用設置
 *
 * 包含所有測試共用的 Mock 設置和工具函數
 */

import { vi } from 'vitest'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

// 使用 vi.hoisted 建立 mocks（必須先儲存到變數再解構導出）
const hoistedMocks = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockInsert = vi.fn()
  const mockDelete = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  return {
    mockSingle,
    mockEq,
    mockSelect,
    mockInsert,
    mockDelete,
    mockFrom,
    mockSupabaseClient,
  }
})

// 解構並導出（Vitest 4.0 要求分兩步驟）
export const {
  mockSingle,
  mockEq,
  mockSelect,
  mockInsert,
  mockDelete,
  mockFrom,
  mockSupabaseClient,
} = hoistedMocks

/**
 * 設定 Mock 鏈式調用結構
 */
export function setupMockChains() {
  // insert() 鏈: insert().select().single()
  const mockInsertSelectChain = {
    select: vi.fn().mockReturnValue({
      single: mockSingle,
    }),
  }

  mockInsert.mockReturnValue(mockInsertSelectChain)

  // select() 鏈: select() (用於 inquiry_items)
  mockSelect.mockReturnValue({
    data: [],
    error: null,
  })

  // delete() 鏈: delete().eq()
  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    data: null,
    error: null,
  })

  // from() 返回包含所有操作的對象
  mockFrom.mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  })
}

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/lib/database/supabase-auth', () => ({
  getSupabaseAdmin: vi.fn(() => hoistedMocks.mockSupabaseClient),
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Mock inquiry-validation (避免實際驗證邏輯執行)
vi.mock('../../inquiry-validation', () => ({
  validateCreateInquiryRequest: vi.fn(),
  calculateTotalAmount: vi.fn((data: any) => {
    if (data.inquiry_type !== 'product' || !data.items) {
      return null
    }
    const total = data.items.reduce((sum: number, item: any) => {
      return sum + (item.unit_price || 0) * item.quantity
    }, 0)
    return total > 0 ? total : null
  }),
}))

// Mock inquiry-helpers
vi.mock('../../inquiry-helpers', () => ({
  transformFromDB: vi.fn((data: any) => ({
    id: data.id,
    userId: data.user_id,
    customerName: data.customer_name,
    customerEmail: data.customer_email,
    customerPhone: data.customer_phone,
    inquiryType: data.inquiry_type,
    notes: data.notes,
    deliveryAddress: data.delivery_address,
    preferredDeliveryDate: data.preferred_delivery_date,
    totalEstimatedAmount: data.total_estimated_amount,
    status: data.status,
    isRead: data.is_read,
    isReplied: data.is_replied,
    items: data.inquiry_items || [],
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  })),
  serializeFarmTourData: vi.fn((data: any) => {
    if (data.inquiry_type !== 'farm_tour') return null
    return JSON.stringify({
      activity_title: data.activity_title,
      visit_date: data.visit_date,
      visitor_count: data.visitor_count,
    })
  }),
}))

// ============================================================================
// Reset Helper
// ============================================================================

/**
 * 重置所有 Mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks()

  // 重置所有 Mocks 為預設實作
  mockFrom.mockReturnValue({
    insert: mockInsert,
    select: mockSelect,
    delete: mockDelete,
  })

  setupMockChains()
}
