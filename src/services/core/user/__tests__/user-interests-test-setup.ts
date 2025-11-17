/**
 * UserInterestsService 測試共用設置
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
  const mockInsert = vi.fn()
  const mockDelete = vi.fn()
  const mockUpsert = vi.fn()
  const mockOrder = vi.fn()
  const mockLimit = vi.fn()
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
    mockUpsert,
    mockOrder,
    mockLimit,
    mockFrom,
    mockSupabaseClient,
  }
})

export const {
  mockSingle,
  mockEq,
  mockSelect,
  mockInsert,
  mockDelete,
  mockUpsert,
  mockOrder,
  mockLimit,
  mockFrom,
  mockSupabaseClient,
} = hoistedMocks

/**
 * 設定 Mock 鏈式調用結構
 */
export function setupMockChains() {
  // select() 鏈: select().eq().eq().order()
  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    data: [],
    error: null,
  })

  // insert() 鏈: insert()
  mockInsert.mockReturnValue({
    data: null,
    error: null,
  })

  // delete() 鏈: delete().eq().eq()
  mockDelete.mockReturnValue({
    eq: mockEq,
  })

  // upsert() 鏈: upsert(data, options)
  mockUpsert.mockReturnValue({
    data: null,
    error: null,
  })

  // limit() 鏈: select().limit()
  mockLimit.mockReturnValue({
    data: [],
    error: null,
  })

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    upsert: mockUpsert,
  })
}

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

// Mock supabase-proxies (supabase-auth re-exports from it)
vi.mock('@/lib/database/supabase-proxies', () => ({
  supabaseAdmin: hoistedMocks.mockSupabaseClient,
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

// Mock localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

// Mock window
Object.defineProperty(global, 'window', {
  value: {
    dispatchEvent: vi.fn(),
  },
  writable: true,
})

// ============================================================================
// Reset Helper
// ============================================================================

/**
 * 重置所有 Mocks
 */
export function resetAllMocks() {
  vi.clearAllMocks()

  // 重置 localStorage mock
  mockLocalStorage.clear()

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    upsert: mockUpsert,
  })

  setupMockChains()
}
