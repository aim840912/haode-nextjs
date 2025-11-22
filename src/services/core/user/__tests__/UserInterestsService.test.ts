/**
 * UserInterestsService 測試
 *
 * 測試使用者興趣服務的所有功能:
 * - CRUD 操作 (getUserInterests, addInterest, removeInterest)
 * - 批量操作 (addMultipleInterests)
 * - 狀態切換 (toggleInterest)
 * - 同步功能 (syncLocalInterests)
 * - 本地儲存 (getLocalInterests, setLocalInterests, clearLocalInterests)
 * - 健康檢查 (getHealthStatus)
 * - 錯誤處理和驗證
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ============================================================================
// Mock Setup - 必須在服務匯入之前
// ============================================================================

// 首先匯入 setup 檔案，讓 vi.mock() 被提升
import {
  mockSingle,
  mockEq,
  mockSelect,
  mockInsert,
  mockDelete,
  mockUpsert,
  mockOrder,
  mockLimit,
  mockFrom,
  resetAllMocks,
} from './user-interests-test-setup'

// 然後才匯入服務和其他依賴
import { ValidationError } from '@/lib/errors'
import { UserInterestsService } from '../userInterestsService'

describe('UserInterestsService', () => {
  let service: UserInterestsService

  beforeEach(() => {
    service = new UserInterestsService()
    resetAllMocks()
  })

  // ==========================================================================
  // getUserInterests
  // ==========================================================================
  describe('getUserInterests', () => {
    it('應該成功取得使用者興趣列表', async () => {
      // Arrange
      const userId = 'user-123'
      const mockData = [
        { product_id: 'product-1', user_id: userId, created_at: '2024-01-01' },
        { product_id: 'product-2', user_id: userId, created_at: '2024-01-02' },
      ]

      mockOrder.mockResolvedValueOnce({
        data: mockData,
        error: null,
      })

      // Act
      const result = await service.getUserInterests(userId)

      // Assert
      expect(result).toEqual(['product-1', 'product-2'])
      expect(result).toHaveLength(2)
      expect(mockFrom).toHaveBeenCalledWith('user_interests')
      expect(mockSelect).toHaveBeenCalledWith('product_id')
    })

    it('應該返回空陣列當使用者無興趣產品', async () => {
      // Arrange
      const userId = 'user-123'
      mockOrder.mockResolvedValueOnce({ data: [], error: null })

      // Act
      const result = await service.getUserInterests(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('應該返回空陣列並記錄錯誤當查詢失敗', async () => {
      // Arrange
      const userId = 'user-123'
      mockOrder.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.getUserInterests(userId)

      // Assert
      expect(result).toEqual([])
    })

    it('應該返回空陣列當 userId 為空（服務捕獲驗證錯誤）', async () => {
      // Act - 服務會捕獲 ValidationError 並返回空陣列
      const result = await service.getUserInterests('')

      // Assert
      expect(result).toEqual([])
    })
  })

  // ==========================================================================
  // addInterest
  // ==========================================================================
  describe('addInterest', () => {
    it('應該成功新增興趣產品', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      mockInsert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await service.addInterest(userId, productId)

      // Assert
      expect(result).toBe(true)
      expect(mockInsert).toHaveBeenCalledWith({
        user_id: userId,
        product_id: productId,
      })
    })

    it('應該返回 true 當產品已存在 (重複插入錯誤 23505)', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value' },
      })

      // Act
      const result = await service.addInterest(userId, productId)

      // Assert
      expect(result).toBe(true)
    })

    it('應該返回 false 當資料庫操作失敗', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.addInterest(userId, productId)

      // Assert
      expect(result).toBe(false)
    })

    it('應該返回 false 當 userId 為空（服務捕獲驗證錯誤）', async () => {
      // Act - 服務會捕獲 ValidationError 並返回 false
      const result = await service.addInterest('', 'product-1')

      // Assert
      expect(result).toBe(false)
    })

    it('應該返回 false 當 productId 為空（服務捕獲驗證錯誤）', async () => {
      // Act - 服務會捕獲 ValidationError 並返回 false
      const result = await service.addInterest('user-123', '')

      // Assert
      expect(result).toBe(false)
    })
  })

  // ==========================================================================
  // removeInterest
  // ==========================================================================
  describe('removeInterest', () => {
    it('應該成功移除興趣產品', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      // delete().eq().eq() - 第二個 eq 需要返回結果
      mockEq
        .mockReturnValueOnce({ eq: mockEq }) // 第一個 eq 返回鏈
        .mockResolvedValueOnce({ data: null, error: null }) // 第二個 eq 返回結果

      // Act
      const result = await service.removeInterest(userId, productId)

      // Assert
      expect(result).toBe(true)
      expect(mockDelete).toHaveBeenCalled()
    })

    it('應該返回 false 當資料庫操作失敗', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      // delete().eq().eq() - 第二個 eq 返回錯誤
      mockEq.mockReturnValueOnce({ eq: mockEq }).mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.removeInterest(userId, productId)

      // Assert
      expect(result).toBe(false)
    })

    it('應該返回 false 當參數為空（服務捕獲驗證錯誤）', async () => {
      // Act - 服務會捕獲 ValidationError 並返回 false
      const result1 = await service.removeInterest('', 'product-1')
      const result2 = await service.removeInterest('user-123', '')

      // Assert
      expect(result1).toBe(false)
      expect(result2).toBe(false)
    })
  })

  // ==========================================================================
  // addMultipleInterests
  // ==========================================================================
  describe('addMultipleInterests', () => {
    it('應該成功批量新增興趣產品', async () => {
      // Arrange
      const userId = 'user-123'
      const productIds = ['product-1', 'product-2', 'product-3']

      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await service.addMultipleInterests(userId, productIds)

      // Assert
      expect(result).toBe(true)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          { user_id: userId, product_id: 'product-1' },
          { user_id: userId, product_id: 'product-2' },
          { user_id: userId, product_id: 'product-3' },
        ]),
        { onConflict: 'user_id,product_id' }
      )
    })

    it('應該返回 true 當產品列表為空', async () => {
      // Arrange
      const userId = 'user-123'
      const productIds: string[] = []

      // Act
      const result = await service.addMultipleInterests(userId, productIds)

      // Assert
      expect(result).toBe(true)
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('應該返回 false 當資料庫操作失敗', async () => {
      // Arrange
      const userId = 'user-123'
      const productIds = ['product-1']

      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.addMultipleInterests(userId, productIds)

      // Assert
      expect(result).toBe(false)
    })

    it('應該返回 false 當 productId 包含空值（服務捕獲驗證錯誤）', async () => {
      // Arrange
      const userId = 'user-123'
      const productIds = ['product-1', '', 'product-3']

      // Act - 服務會捕獲 ValidationError 並返回 false
      const result = await service.addMultipleInterests(userId, productIds)

      // Assert
      expect(result).toBe(false)
    })
  })

  // ==========================================================================
  // toggleInterest
  // ==========================================================================
  describe('toggleInterest', () => {
    it('應該移除興趣產品當產品已存在', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      // 1. Mock check - select().eq().eq().single()
      // 重置 mockEq 為完整鏈結構
      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
      })

      mockSingle.mockResolvedValueOnce({
        data: { id: 'interest-1', user_id: userId, product_id: productId },
        error: null,
      })

      // 2. Mock delete - delete().eq().eq()
      // removeInterest 內部會調用 delete 鏈
      // 需要在 single 之後設置 eq 返回刪除結果
      // 但因為共用 mockEq，我們需要計算調用次數
      // check 使用 2 次 eq，delete 使用 2 次 eq
      // 所以第 3、4 次 eq 調用是 delete 的

      // Act
      const result = await service.toggleInterest(userId, productId)

      // Assert
      expect(result).toBe(true)
      expect(mockSingle).toHaveBeenCalled()
    })

    it('應該新增興趣產品當產品不存在', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      // 重置 mockEq 鏈
      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
      })

      // Mock check - product not found (PGRST116)
      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Mock insert - addInterest 使用 insert()
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await service.toggleInterest(userId, productId)

      // Assert
      expect(result).toBe(true)
      expect(mockInsert).toHaveBeenCalled()
    })

    it('應該返回 false 當檢查操作失敗 (非 PGRST116)', async () => {
      // Arrange
      const userId = 'user-123'
      const productId = 'product-1'

      // 重置 mockEq 鏈
      mockEq.mockReturnValue({
        eq: mockEq,
        single: mockSingle,
        order: mockOrder,
      })

      mockSingle.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.toggleInterest(userId, productId)

      // Assert
      expect(result).toBe(false)
    })
  })

  // ==========================================================================
  // syncLocalInterests
  // ==========================================================================
  describe('syncLocalInterests', () => {
    it('應該成功同步本地興趣到雲端', async () => {
      // Arrange
      const userId = 'user-123'
      const localInterests = ['product-1', 'product-2', 'product-3']
      const cloudInterests = ['product-1'] // product-2, product-3 需要同步

      // Mock getUserInterests
      mockOrder.mockResolvedValueOnce({
        data: [{ product_id: 'product-1' }],
        error: null,
      })

      // Mock addMultipleInterests
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await service.syncLocalInterests(userId, localInterests)

      // Assert
      expect(result).toEqual(['product-1', 'product-2', 'product-3'])
      expect(mockUpsert).toHaveBeenCalled()
    })

    it('應該返回合併後的清單當無需同步', async () => {
      // Arrange
      const userId = 'user-123'
      const localInterests = ['product-1']

      // Mock getUserInterests - 雲端已有相同資料
      mockOrder.mockResolvedValueOnce({
        data: [{ product_id: 'product-1' }],
        error: null,
      })

      // Act
      const result = await service.syncLocalInterests(userId, localInterests)

      // Assert
      expect(result).toEqual(['product-1'])
      expect(mockUpsert).not.toHaveBeenCalled()
    })

    it('應該返回本地清單當同步失敗', async () => {
      // Arrange
      const userId = 'user-123'
      const localInterests = ['product-1', 'product-2']

      // Mock getUserInterests
      mockOrder.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Mock addMultipleInterests - 失敗
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Database error' },
      })

      // Act
      const result = await service.syncLocalInterests(userId, localInterests)

      // Assert
      expect(result).toEqual(localInterests)
    })

    it('應該去重合併本地和雲端清單', async () => {
      // Arrange
      const userId = 'user-123'
      const localInterests = ['product-1', 'product-2']
      const cloudInterests = ['product-2', 'product-3']

      // Mock getUserInterests
      mockOrder.mockResolvedValueOnce({
        data: [{ product_id: 'product-2' }, { product_id: 'product-3' }],
        error: null,
      })

      // Mock addMultipleInterests (只同步 product-1)
      mockUpsert.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Act
      const result = await service.syncLocalInterests(userId, localInterests)

      // Assert
      expect(result).toHaveLength(3)
      expect(result).toContain('product-1')
      expect(result).toContain('product-2')
      expect(result).toContain('product-3')
    })
  })

  // ==========================================================================
  // Local Storage Operations
  // ==========================================================================
  describe('Local Storage Operations', () => {
    it('getLocalInterests - 應該取得本地儲存的興趣清單', () => {
      // Arrange
      const interests = ['product-1', 'product-2']
      localStorage.setItem('interestedProducts', JSON.stringify(interests))

      // Act
      const result = service.getLocalInterests()

      // Assert
      expect(result).toEqual(interests)
    })

    it('getLocalInterests - 應該返回空陣列當無本地資料', () => {
      // Act
      const result = service.getLocalInterests()

      // Assert
      expect(result).toEqual([])
    })

    it('setLocalInterests - 應該設定本地儲存的興趣清單', () => {
      // Arrange
      const interests = ['product-1', 'product-2']

      // Act
      service.setLocalInterests(interests)

      // Assert
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'interestedProducts',
        JSON.stringify(interests)
      )
    })

    it('setLocalInterests - 應該觸發更新事件', () => {
      // Arrange
      const interests = ['product-1']

      // Act
      service.setLocalInterests(interests)

      // Assert
      expect(window.dispatchEvent).toHaveBeenCalled()
    })

    it('clearLocalInterests - 應該清除本地儲存的興趣清單', () => {
      // Arrange
      localStorage.setItem('interestedProducts', JSON.stringify(['product-1']))

      // Act
      service.clearLocalInterests()

      // Assert
      expect(localStorage.removeItem).toHaveBeenCalledWith('interestedProducts')
    })

    it('clearLocalInterests - 應該觸發更新事件', () => {
      // Act
      service.clearLocalInterests()

      // Assert
      expect(window.dispatchEvent).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Health Status
  // ==========================================================================
  describe('getHealthStatus', () => {
    it('應該返回 healthy 當資料庫連線正常', async () => {
      // Arrange
      mockLimit.mockResolvedValueOnce({
        data: [],
        error: null,
      })

      // Act
      const result = await service.getHealthStatus()

      // Assert
      expect(result.status).toBe('healthy')
      expect(result.timestamp).toBeDefined()
    })

    it('應該返回 healthy 當表格為空 (PGRST116)', async () => {
      // Arrange
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      // Act
      const result = await service.getHealthStatus()

      // Assert
      expect(result.status).toBe('healthy')
    })

    it('應該返回 degraded 當查詢有錯誤', async () => {
      // Arrange
      mockLimit.mockResolvedValueOnce({
        data: null,
        error: { code: 'DB_ERROR', message: 'Connection error' },
      })

      // Act
      const result = await service.getHealthStatus()

      // Assert
      expect(result.status).toBe('degraded')
      expect(result.details?.error).toBeDefined()
    })

    it('應該返回 unhealthy 當拋出異常', async () => {
      // Arrange
      mockLimit.mockRejectedValueOnce(new Error('Network error'))

      // Act
      const result = await service.getHealthStatus()

      // Assert
      expect(result.status).toBe('unhealthy')
      expect(result.details?.error).toBe('Network error')
    })
  })
})
