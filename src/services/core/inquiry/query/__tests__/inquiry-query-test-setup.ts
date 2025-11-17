/**
 * InquiryQueryService 測試共用設置
 *
 * 包含所有測試共用的 Mock 設置和工具函數
 */

import { vi } from 'vitest'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockFrom = vi.fn()

  const mockSupabaseClient = {
    from: mockFrom,
  }

  return {
    mockSingle,
    mockEq,
    mockSelect,
    mockFrom,
    mockSupabaseClient,
  }
})

export const { mockSingle, mockEq, mockSelect, mockFrom, mockSupabaseClient } = hoistedMocks

/**
 * 設定 Mock 鏈式調用結構
 */
export function setupMockChains() {
  // select() 鏈: select().eq().eq().single() 或 select().eq()
  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
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
  applyQueryParams: vi.fn((query: any, _params?: any) => query),
}))

// ============================================================================
// Reset Helper
// ============================================================================

/**
 * 重置所有 Mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks()

  mockFrom.mockReturnValue({
    select: mockSelect,
  })

  setupMockChains()
}
