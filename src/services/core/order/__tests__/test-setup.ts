/**
 * OrderService 測試共用設置
 *
 * 包含所有測試共用的 Mock 設置和工具函數
 */

import { vi } from 'vitest'

// Mock Supabase admin client - 整合 Query 和 Command 所需的所有 Mock
export const mockSingle = vi.fn()
export const mockIn = vi.fn()
export const mockRange = vi.fn()
export const mockOrder = vi.fn()
export const mockEq = vi.fn()
export const mockSelect = vi.fn()
export const mockRpc = vi.fn()
export const mockUpdate = vi.fn()
export const mockInsert = vi.fn()
export const mockDelete = vi.fn()
export const mockFrom = vi.fn()

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

/**
 * 建立 Mock Supabase Client
 */
export const mockSupabaseClient = {
  from: mockFrom,
  rpc: mockRpc,
}

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

/**
 * Mock Supabase Auth 模組
 */
export function mockSupabaseAuth() {
  vi.mock('@/lib/database/supabase-auth', () => ({
    getSupabaseAdmin: vi.fn(() => mockSupabaseClient),
  }))
}

/**
 * Mock Logger 模組
 */
export function mockLogger() {
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
}

/**
 * 初始化所有測試 Mocks
 */
export function initializeTestMocks() {
  setupMockChains()
  mockSupabaseAuth()
  mockLogger()
}
