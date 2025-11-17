/**
 * OrderService 測試共用設置
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

// 解構並導出（Vitest 4.0 要求分兩步驟）
export const {
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
} = hoistedMocks

/**
 * 設定 Mock 鏈式調用結構
 */
export function setupMockChains() {
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
}

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

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
// Reset Helper
// ============================================================================

/**
 * 重置所有 Mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks()

  // 重置所有 Mocks 為預設實作
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  setupMockChains()
}
