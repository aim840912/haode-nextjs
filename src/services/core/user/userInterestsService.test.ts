/**
 * UserInterestsService 測試套件
 *
 * 測試用戶興趣管理服務的所有核心功能:
 * - 查詢: getUserInterests
 * - 單一操作: addInterest, removeInterest, toggleInterest
 * - 批量操作: addMultipleInterests
 * - 同步: syncLocalInterests
 * - 本地儲存: getLocalInterests, setLocalInterests, clearLocalInterests
 * - 健康檢查: getHealthStatus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { UserInterestsService } from './userInterestsService'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockSelect = vi.fn()
  const mockEq = vi.fn()
  const mockInsert = vi.fn()
  const mockDelete = vi.fn()
  const mockUpsert = vi.fn()
  const mockSingle = vi.fn()
  const mockOrder = vi.fn()
  const mockLimit = vi.fn()
  const mockFrom = vi.fn()

  // Chain methods
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, limit: mockLimit, single: mockSingle })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockOrder.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })

  const mockSupabaseAdmin = { from: mockFrom }

  const mockDbLogger = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  }

  return {
    mockSupabaseAdmin,
    mockFrom,
    mockSelect,
    mockEq,
    mockInsert,
    mockDelete,
    mockUpsert,
    mockSingle,
    mockOrder,
    mockLimit,
    mockDbLogger,
  }
})

export const {
  mockSupabaseAdmin,
  mockFrom,
  mockSelect,
  mockEq,
  mockInsert,
  mockDelete,
  mockUpsert,
  mockSingle,
  mockOrder,
  mockLimit,
  mockDbLogger,
} = hoistedMocks

// Vi.mock calls at module top-level
vi.mock('@/lib/database/supabase-auth', () => ({
  supabaseAdmin: hoistedMocks.mockSupabaseAdmin,
}))

vi.mock('@/lib/logger', () => ({
  dbLogger: hoistedMocks.mockDbLogger,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUserId = 'user-123'
const mockProductId = 'product-456'
const mockProductIds = ['product-1', 'product-2', 'product-3']

const mockUserInterestRecord = {
  id: 'interest-1',
  user_id: mockUserId,
  product_id: mockProductId,
  created_at: '2025-01-01T00:00:00Z',
}

// ============================================================================
// Helper Functions
// ============================================================================

function resetAllMocks() {
  vi.clearAllMocks()

  // Reset chain methods
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, limit: mockLimit, single: mockSingle })
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle })
  mockOrder.mockReturnValue({ eq: mockEq })
  mockDelete.mockReturnValue({ eq: mockEq })
  mockInsert.mockReturnValue({})
  mockUpsert.mockReturnValue({})
}

// ============================================================================
// Test Suites
// ============================================================================

describe('UserInterestsService', () => {
  let service: UserInterestsService

  beforeEach(() => {
    service = new UserInterestsService()
    resetAllMocks()
  })

  // ==========================================================================
  // Query Tests
  // ==========================================================================

  describe('getUserInterests', () => {
    it('應該成功取得用戶興趣產品ID列表', async () => {
      const mockData = [
        { product_id: 'product-1' },
        { product_id: 'product-2' },
        { product_id: 'product-3' },
      ]

      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: mockData, error: null }),
          }),
        }),
      })

      const result = await service.getUserInterests(mockUserId)

      expect(result).toEqual(['product-1', 'product-2', 'product-3'])
      expect(mockFrom).toHaveBeenCalledWith('user_interests')
      expect(mockDbLogger.info).toHaveBeenCalledWith(
        '取得使用者興趣列表成功',
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: mockUserId, count: 3 }),
        })
      )
    })

    it('應該返回空陣列當用戶沒有興趣產品', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      })

      const result = await service.getUserInterests(mockUserId)

      expect(result).toEqual([])
    })

    it('應該返回空陣列當發生錯誤', async () => {
      mockFrom.mockReturnValue({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: null, error: { message: '資料庫連線失敗' } }),
          }),
        }),
      })

      const result = await service.getUserInterests(mockUserId)

      expect(result).toEqual([])
      expect(mockDbLogger.error).toHaveBeenCalled()
    })

    it('應該拒絕空的用戶ID', async () => {
      const result = await service.getUserInterests('')

      expect(result).toEqual([])
      expect(mockDbLogger.error).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Command Tests - Add
  // ==========================================================================

  describe('addInterest', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        insert: mockInsert,
      })
    })

    it('應該成功新增興趣產品', async () => {
      mockInsert.mockResolvedValue({ error: null })

      const result = await service.addInterest(mockUserId, mockProductId)

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('user_interests')
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: mockUserId,
        product_id: mockProductId,
      })
      expect(mockDbLogger.info).toHaveBeenCalledWith(
        '新增興趣產品成功',
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: mockUserId, productId: mockProductId }),
        })
      )
    })

    it('應該處理重複插入（唯一性約束錯誤）', async () => {
      mockInsert.mockResolvedValue({
        error: { code: '23505', message: 'duplicate key value' },
      })

      const result = await service.addInterest(mockUserId, mockProductId)

      expect(result).toBe(true)
      expect(mockDbLogger.info).toHaveBeenCalledWith(
        '興趣產品已存在，跳過插入',
        expect.objectContaining({
          metadata: expect.objectContaining({ reason: 'duplicate' }),
        })
      )
    })

    it('應該返回 false 當發生資料庫錯誤', async () => {
      mockInsert.mockResolvedValue({
        error: { code: '42501', message: '權限不足' },
      })

      const result = await service.addInterest(mockUserId, mockProductId)

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
    })

    it('應該拒絕空的用戶ID', async () => {
      const result = await service.addInterest('', mockProductId)

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
    })

    it('應該拒絕空的產品ID', async () => {
      const result = await service.addInterest(mockUserId, '')

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
      expect(mockInsert).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Command Tests - Remove
  // ==========================================================================

  describe('removeInterest', () => {
    it('應該成功移除興趣產品', async () => {
      mockFrom.mockReturnValue({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      })

      const result = await service.removeInterest(mockUserId, mockProductId)

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('user_interests')
      expect(mockDbLogger.info).toHaveBeenCalledWith(
        '移除興趣產品成功',
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: mockUserId, productId: mockProductId }),
        })
      )
    })

    it('應該返回 false 當發生錯誤', async () => {
      mockFrom.mockReturnValue({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: { message: '資料庫錯誤' } }),
          }),
        }),
      })

      const result = await service.removeInterest(mockUserId, mockProductId)

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
    })

    it('應該拒絕空的用戶ID', async () => {
      const result = await service.removeInterest('', mockProductId)

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('應該拒絕空的產品ID', async () => {
      const result = await service.removeInterest(mockUserId, '')

      expect(result).toBe(false)
      expect(mockDelete).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Command Tests - Toggle
  // ==========================================================================

  describe('toggleInterest', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        select: mockSelect,
        insert: mockInsert,
        delete: mockDelete,
      })
    })

    it('應該新增興趣當產品不在清單中', async () => {
      // Mock check: not exists (PGRST116 = not found)
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock insert success
      mockInsert.mockResolvedValue({ error: null })

      const result = await service.toggleInterest(mockUserId, mockProductId)

      expect(result).toBe(true)
      expect(mockInsert).toHaveBeenCalled()
      expect(mockDelete).not.toHaveBeenCalled()
    })

    it('應該移除興趣當產品已在清單中', async () => {
      // First call: check if exists
      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            eq: () => ({
              single: () =>
                Promise.resolve({
                  data: mockUserInterestRecord,
                  error: null,
                }),
            }),
          }),
        }),
      })

      // Second call: delete
      mockFrom.mockReturnValueOnce({
        delete: () => ({
          eq: () => ({
            eq: () => Promise.resolve({ error: null }),
          }),
        }),
      })

      const result = await service.toggleInterest(mockUserId, mockProductId)

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalled()
    })

    it('應該返回 false 當檢查狀態失敗', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: '資料庫錯誤' },
      })

      const result = await service.toggleInterest(mockUserId, mockProductId)

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Command Tests - Batch
  // ==========================================================================

  describe('addMultipleInterests', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        upsert: mockUpsert,
      })
    })

    it('應該成功批量新增興趣產品', async () => {
      mockUpsert.mockResolvedValue({ error: null })

      const result = await service.addMultipleInterests(mockUserId, mockProductIds)

      expect(result).toBe(true)
      expect(mockFrom).toHaveBeenCalledWith('user_interests')
      expect(mockUpsert).toHaveBeenCalledWith(
        mockProductIds.map(productId => ({
          user_id: mockUserId,
          product_id: productId,
        })),
        { onConflict: 'user_id,product_id' }
      )
      expect(mockDbLogger.info).toHaveBeenCalledWith(
        '批量新增興趣產品成功',
        expect.objectContaining({
          metadata: expect.objectContaining({ userId: mockUserId, count: 3 }),
        })
      )
    })

    it('應該處理空的產品ID列表', async () => {
      const result = await service.addMultipleInterests(mockUserId, [])

      expect(result).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
      expect(mockDbLogger.debug).toHaveBeenCalledWith(
        '無需新增興趣產品，列表為空',
        expect.any(Object)
      )
    })

    it('應該返回 false 當發生錯誤', async () => {
      mockUpsert.mockResolvedValue({
        error: { message: 'upsert 失敗' },
      })

      const result = await service.addMultipleInterests(mockUserId, mockProductIds)

      expect(result).toBe(false)
      expect(mockDbLogger.error).toHaveBeenCalled()
    })

    it('應該拒絕包含空字串的產品ID列表', async () => {
      const invalidIds = ['product-1', '', 'product-3']

      const result = await service.addMultipleInterests(mockUserId, invalidIds)

      expect(result).toBe(false)
      expect(mockUpsert).not.toHaveBeenCalled()
      expect(mockDbLogger.error).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Sync Tests
  // ==========================================================================

  describe('syncLocalInterests', () => {
    it('應該成功合併本地和雲端興趣清單', async () => {
      const localInterests = ['product-1', 'product-2']

      // Mock getUserInterests (first call)
      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: [{ product_id: 'product-2' }, { product_id: 'product-3' }],
                error: null,
              }),
          }),
        }),
      })

      // Mock addMultipleInterests (second call)
      mockFrom.mockReturnValueOnce({
        upsert: () => Promise.resolve({ error: null }),
      })

      const result = await service.syncLocalInterests(mockUserId, localInterests)

      expect(result).toContain('product-1')
      expect(result).toContain('product-2')
      expect(result).toContain('product-3')
      expect(result).toHaveLength(3)
    })

    it('應該返回合併清單當沒有新興趣需要同步', async () => {
      const localInterests = ['product-1', 'product-2']

      // Mock getUserInterests - 雲端已有所有本地興趣
      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () =>
              Promise.resolve({
                data: [{ product_id: 'product-1' }, { product_id: 'product-2' }],
                error: null,
              }),
          }),
        }),
      })

      const result = await service.syncLocalInterests(mockUserId, localInterests)

      expect(result).toEqual(['product-1', 'product-2'])
    })

    it('應該返回本地清單當同步失敗', async () => {
      const localInterests = ['product-1']

      // Mock getUserInterests success
      mockFrom.mockReturnValueOnce({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
          }),
        }),
      })

      // Mock addMultipleInterests failure
      mockFrom.mockReturnValueOnce({
        upsert: () => Promise.resolve({ error: { message: '同步失敗' } }),
      })

      const result = await service.syncLocalInterests(mockUserId, localInterests)

      expect(result).toEqual(localInterests)
      expect(mockDbLogger.warn).toHaveBeenCalledWith(
        '部分本地興趣同步失敗，返回本地清單',
        expect.any(Object)
      )
    })

    it('應該返回本地清單當驗證失敗', async () => {
      const invalidLocalInterests = ['product-1', ''] // 包含空字串

      const result = await service.syncLocalInterests(mockUserId, invalidLocalInterests)

      expect(result).toEqual(invalidLocalInterests)
      expect(mockDbLogger.error).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Local Storage Tests
  // ==========================================================================

  describe('Local Storage Methods', () => {
    beforeEach(() => {
      // Mock localStorage
      global.localStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      }

      // Mock window
      global.window = {
        dispatchEvent: vi.fn(),
      } as any
    })

    describe('getLocalInterests', () => {
      it('應該成功取得本地興趣清單', () => {
        const mockInterests = ['product-1', 'product-2']
        ;(global.localStorage.getItem as any).mockReturnValue(JSON.stringify(mockInterests))

        const result = service.getLocalInterests()

        expect(result).toEqual(mockInterests)
        expect(global.localStorage.getItem).toHaveBeenCalledWith('interestedProducts')
      })

      it('應該返回空陣列當 localStorage 為空', () => {
        ;(global.localStorage.getItem as any).mockReturnValue(null)

        const result = service.getLocalInterests()

        expect(result).toEqual([])
      })

      it('應該返回空陣列當發生解析錯誤', () => {
        ;(global.localStorage.getItem as any).mockReturnValue('invalid json')

        const result = service.getLocalInterests()

        expect(result).toEqual([])
        expect(mockDbLogger.error).toHaveBeenCalled()
      })
    })

    describe('setLocalInterests', () => {
      it('應該成功設定本地興趣清單', () => {
        const interests = ['product-1', 'product-2']

        service.setLocalInterests(interests)

        expect(global.localStorage.setItem).toHaveBeenCalledWith(
          'interestedProducts',
          JSON.stringify(interests)
        )
        expect(global.window.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'interestedProductsUpdated' })
        )
      })
    })

    describe('clearLocalInterests', () => {
      it('應該成功清除本地興趣清單', () => {
        service.clearLocalInterests()

        expect(global.localStorage.removeItem).toHaveBeenCalledWith('interestedProducts')
        expect(global.window.dispatchEvent).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'interestedProductsUpdated' })
        )
      })
    })
  })

  // ==========================================================================
  // Health Check Tests
  // ==========================================================================

  describe('getHealthStatus', () => {
    beforeEach(() => {
      mockFrom.mockReturnValue({
        select: mockSelect,
      })
    })

    it('應該返回 healthy 狀態當資料庫連線正常', async () => {
      mockLimit.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
      expect(result.details?.moduleName).toBe('UserInterestsService')
    })

    it('應該返回 healthy 狀態當表格為空（PGRST116）', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('healthy')
    })

    it('應該返回 degraded 狀態當發生其他錯誤', async () => {
      mockLimit.mockResolvedValue({
        data: null,
        error: { code: 'ERROR', message: '連線逾時' },
      })

      const result = await service.getHealthStatus()

      expect(result.status).toBe('degraded')
      expect(result.details?.error).toBeDefined()
    })

    it('應該返回 unhealthy 狀態當發生例外', async () => {
      mockLimit.mockRejectedValue(new Error('網路錯誤'))

      const result = await service.getHealthStatus()

      expect(result.status).toBe('unhealthy')
      expect(result.details?.error).toBe('網路錯誤')
    })
  })
})
