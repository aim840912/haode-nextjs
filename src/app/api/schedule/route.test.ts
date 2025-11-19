/**
 * GET /api/schedule 測試
 *
 * 測試擺攤行程 API:
 * - 取得行程列表（公開 API）
 * - 查詢參數篩選（status, date）
 * - 驗證查詢參數
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from './route'
import { NextRequest } from 'next/server'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockGetSchedule = vi.fn()

  return {
    mockGetSchedule,
  }
})

export const { mockGetSchedule } = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/services/core/content/scheduleServiceSimple', () => ({
  scheduleServiceSimple: {
    getSchedule: hoistedMocks.mockGetSchedule,
  },
}))

// ============================================================================
// Test Data
// ============================================================================

const createMockScheduleItem = (overrides?: any) => ({
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: '板橋農夫市集',
  location: '新北市板橋區',
  date: '2025-01-15',
  time: '09:00-12:00',
  products: ['草莓', '芭樂'],
  status: 'upcoming',
  specialOffer: '草莓特價一斤250元',
  weatherNote: '雨天照常',
  contact: '0912345678',
  description: '週末農夫市集',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
})

// ============================================================================
// Test Suites
// ============================================================================

describe('GET /api/schedule', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // 成功案例
  // ==========================================================================

  it('應該返回行程列表', async () => {
    // Arrange
    const mockSchedules = [
      createMockScheduleItem(),
      createMockScheduleItem({
        id: '550e8400-e29b-41d4-a716-446655440001',
        title: '中壢假日市集',
        location: '桃園市中壢區',
        date: '2025-01-20',
      }),
    ]
    mockGetSchedule.mockResolvedValueOnce(mockSchedules)

    const request = new NextRequest('http://localhost:3000/api/schedule')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toHaveLength(2)
    expect(data.data[0].title).toBe('板橋農夫市集')
    expect(data.data[1].title).toBe('中壢假日市集')
    expect(data.message).toBe('查詢成功')
  })

  it('應該返回空陣列當沒有行程', async () => {
    // Arrange
    mockGetSchedule.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/schedule')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data).toEqual([])
    expect(data.message).toBe('查詢成功')
  })

  it('應該支援 status 查詢參數', async () => {
    // Arrange
    const mockSchedules = [createMockScheduleItem({ status: 'upcoming' })]
    mockGetSchedule.mockResolvedValueOnce(mockSchedules)

    const request = new NextRequest('http://localhost:3000/api/schedule?status=upcoming')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data[0].status).toBe('upcoming')
  })

  it('應該支援 date 查詢參數', async () => {
    // Arrange
    const mockSchedules = [createMockScheduleItem({ date: '2025-01-15' })]
    mockGetSchedule.mockResolvedValueOnce(mockSchedules)

    const request = new NextRequest('http://localhost:3000/api/schedule?date=2025-01-15')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data[0].date).toBe('2025-01-15')
  })

  it('應該支援分頁參數', async () => {
    // Arrange
    mockGetSchedule.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/schedule?limit=10&offset=20')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
  })

  it('應該使用預設分頁值', async () => {
    // Arrange
    mockGetSchedule.mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/schedule')

    // Act
    const response = await GET(request)

    // Assert
    expect(response.status).toBe(200)
    // 預設 limit=20, offset=0 (在 schema 中定義)
  })

  // ==========================================================================
  // 驗證錯誤
  // ==========================================================================

  it('應該返回 400 當 status 值無效', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/schedule?status=invalid')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert - withErrorHandler 返回錯誤 Response 而非拋出錯誤
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
  })

  it('應該返回 400 當 date 格式無效', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/schedule?date=invalid-date')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
  })

  it('應該返回 400 當 limit 超過最大值', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/schedule?limit=101')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
  })

  it('應該返回 400 當 limit 為負數', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/schedule?limit=-1')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
  })

  it('應該返回 400 當 offset 為負數', async () => {
    // Arrange
    const request = new NextRequest('http://localhost:3000/api/schedule?offset=-1')

    // Act
    const response = await GET(request)
    const data = await response.json()

    // Assert
    expect(response.status).toBe(400)
    expect(data.success).toBe(false)
    expect(data.error.message).toContain('查詢參數驗證失敗')
  })
})
