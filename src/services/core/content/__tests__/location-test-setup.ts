/**
 * LocationServiceSimple 測試共用設置
 *
 * 包含所有測試共用的 Mock 設置、測試資料和工具函數
 */

import { vi } from 'vitest'
import type { Location } from '@/types/location'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

// 使用 vi.hoisted 建立 mocks（必須先儲存到變數再解構導出）
const hoistedMocks = vi.hoisted(() => {
  const mockSingle = vi.fn()
  const mockEq = vi.fn()
  const mockSelect = vi.fn()
  const mockOrder = vi.fn()
  const mockInsert = vi.fn()
  const mockUpdate = vi.fn()
  const mockDelete = vi.fn()
  const mockLimit = vi.fn()
  const mockFrom = vi.fn()

  // Chain methods
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder, limit: mockLimit })
  mockEq.mockReturnValue({ single: mockSingle, select: mockSelect })
  mockOrder.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })

  const mockSupabaseClient = { from: mockFrom }
  const mockSupabaseAdminClient = { from: mockFrom }

  return {
    mockSupabaseClient,
    mockSupabaseAdminClient,
    mockFrom,
    mockSelect,
    mockEq,
    mockSingle,
    mockOrder,
    mockInsert,
    mockUpdate,
    mockDelete,
    mockLimit,
  }
})

// 解構並導出（Vitest 4.0 要求分兩步驟）
export const {
  mockSupabaseClient,
  mockSupabaseAdminClient,
  mockFrom,
  mockSelect,
  mockEq,
  mockSingle,
  mockOrder,
  mockInsert,
  mockUpdate,
  mockDelete,
  mockLimit,
} = hoistedMocks

/**
 * 初始化所有 Mocks
 */
export function initializeLocationMocks() {
  // Mock Supabase clients
  vi.mock('@/lib/database/supabase-server', () => ({
    createServiceSupabaseClient: vi.fn(() => mockSupabaseClient),
  }))

  vi.mock('@/lib/database/supabase-auth', () => ({
    getSupabaseAdmin: vi.fn(() => mockSupabaseAdminClient),
  }))

  // Mock logger
  vi.mock('@/lib/logger', () => ({
    dbLogger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    },
  }))

  // Mock UnifiedImageService
  vi.mock('@/services/infrastructure/unified-image-service', () => ({
    UnifiedImageService: {
      getInstance: vi.fn(() => ({
        validateImageUrl: vi.fn(),
      })),
    },
  }))
}

// ============================================================================
// Test Data
// ============================================================================

export const mockLocationData = {
  id: 'test-location-1',
  name: '測試地點',
  title: '測試標題',
  address: '台北市大安區測試路 123 號',
  landmark: '測試地標',
  phone: '02-1234-5678',
  line_id: '@test',
  hours: '09:00-18:00',
  closed_days: '週日',
  parking: '路邊停車',
  public_transport: '捷運大安站',
  features: ['WiFi', '插座'],
  specialties: ['手工藝品'],
  coordinates: { lat: 25.0, lng: 121.0 },
  image: 'https://example.com/image.jpg',
  is_main: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockLocationResponse: Location = {
  id: 'test-location-1',
  name: '測試地點',
  title: '測試標題',
  address: '台北市大安區測試路 123 號',
  landmark: '測試地標',
  phone: '02-1234-5678',
  lineId: '@test',
  hours: '09:00-18:00',
  closedDays: '週日',
  parking: '路邊停車',
  publicTransport: '捷運大安站',
  features: ['WiFi', '插座'],
  specialties: ['手工藝品'],
  coordinates: { lat: 25.0, lng: 121.0 },
  image: 'https://example.com/image.jpg',
  isMain: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
}

export const createMockLocationData = (overrides = {}) => ({
  ...mockLocationData,
  ...overrides,
})

export const createMockLocationResponse = (overrides = {}): Location => ({
  ...mockLocationResponse,
  ...overrides,
})

// ============================================================================
// Reset Helper
// ============================================================================

export function resetAllLocationMocks() {
  vi.clearAllMocks()

  // Reset chain methods
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  })

  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder, limit: mockLimit })
  mockEq.mockReturnValue({ single: mockSingle, select: mockSelect })
  mockOrder.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({ select: mockSelect })
  mockUpdate.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
}
