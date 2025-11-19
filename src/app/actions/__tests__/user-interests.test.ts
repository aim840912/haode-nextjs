/**
 * User Interests Server Actions 測試
 *
 * 測試用戶興趣相關 Server Actions:
 * - toggleInterestAction - 切換產品興趣狀態
 * - syncInterestsAction - 同步本地興趣清單到雲端
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { toggleInterestAction, syncInterestsAction } from '../user-interests'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  const mockRequireAuth = vi.fn()
  const mockSuccess = vi.fn()
  const mockError = vi.fn()
  const mockValidationError = vi.fn()
  const mockRevalidatePath = vi.fn()

  const mockUserInterestsService = {
    getUserInterests: vi.fn(),
    toggleInterest: vi.fn(),
    syncLocalInterests: vi.fn(),
  }

  return {
    mockRequireAuth,
    mockSuccess,
    mockError,
    mockValidationError,
    mockRevalidatePath,
    mockUserInterestsService,
  }
})

export const {
  mockRequireAuth,
  mockSuccess,
  mockError,
  mockValidationError,
  mockRevalidatePath,
  mockUserInterestsService,
} = hoistedMocks

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('@/lib/server', () => ({
  requireAuth: hoistedMocks.mockRequireAuth,
  success: hoistedMocks.mockSuccess,
  error: hoistedMocks.mockError,
  validationError: hoistedMocks.mockValidationError,
}))

vi.mock('@/services/core/user/userInterestsService', () => ({
  userInterestsService: hoistedMocks.mockUserInterestsService,
}))

vi.mock('next/cache', () => ({
  revalidatePath: hoistedMocks.mockRevalidatePath,
}))

// ============================================================================
// Test Data
// ============================================================================

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
}

// ============================================================================
// Test Suites
// ============================================================================

describe('User Interests Server Actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue(mockUser)
  })

  // ==========================================================================
  // toggleInterestAction Tests
  // ==========================================================================

  describe('toggleInterestAction', () => {
    const validData = { productId: 'product-123' }

    it('應該成功添加產品到興趣清單（原本不在清單中）', async () => {
      // Arrange
      mockUserInterestsService.getUserInterests.mockResolvedValue([])
      mockUserInterestsService.toggleInterest.mockResolvedValue(true)
      mockSuccess.mockReturnValue({
        success: true,
        data: {
          userId: mockUser.id,
          productId: validData.productId,
          action: 'added',
          wasInterested: false,
          nowInterested: true,
        },
        message: '已加入興趣清單',
      })

      // Act
      await toggleInterestAction(validData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockUserInterestsService.getUserInterests).toHaveBeenCalledWith(mockUser.id)
      expect(mockUserInterestsService.toggleInterest).toHaveBeenCalledWith(
        mockUser.id,
        validData.productId
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/products')
      expect(mockRevalidatePath).toHaveBeenCalledWith(`/products/${validData.productId}`)
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/interests')
      expect(mockSuccess).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          productId: validData.productId,
          action: 'added',
          wasInterested: false,
          nowInterested: true,
        },
        '已加入興趣清單'
      )
    })

    it('應該成功從興趣清單移除產品（原本在清單中）', async () => {
      // Arrange
      mockUserInterestsService.getUserInterests.mockResolvedValue(['product-123'])
      mockUserInterestsService.toggleInterest.mockResolvedValue(true)
      mockSuccess.mockReturnValue({
        success: true,
        data: {
          userId: mockUser.id,
          productId: validData.productId,
          action: 'removed',
          wasInterested: true,
          nowInterested: false,
        },
        message: '已從興趣清單移除',
      })

      // Act
      await toggleInterestAction(validData)

      // Assert
      expect(mockUserInterestsService.getUserInterests).toHaveBeenCalledWith(mockUser.id)
      expect(mockUserInterestsService.toggleInterest).toHaveBeenCalledWith(
        mockUser.id,
        validData.productId
      )
      expect(mockSuccess).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          productId: validData.productId,
          action: 'removed',
          wasInterested: true,
          nowInterested: false,
        },
        '已從興趣清單移除'
      )
    })

    it('應該拒絕缺少 productId 的請求', async () => {
      // Arrange
      const invalidData = {}
      mockValidationError.mockReturnValue({
        success: false,
        error: { message: '產品ID不能為空' },
      })

      // Act
      await toggleInterestAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalled()
      expect(mockUserInterestsService.toggleInterest).not.toHaveBeenCalled()
    })

    it('應該拒絕空字串 productId', async () => {
      // Arrange
      const invalidData = { productId: '' }
      mockValidationError.mockReturnValue({
        success: false,
        error: { message: '產品ID不能為空' },
      })

      // Act
      await toggleInterestAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalled()
      expect(mockUserInterestsService.toggleInterest).not.toHaveBeenCalled()
    })

    it('應該要求用戶登入', async () => {
      // Arrange
      mockRequireAuth.mockRejectedValue(new Error('未登入'))
      mockError.mockReturnValue({
        success: false,
        error: { message: '未登入' },
      })

      // Act
      await toggleInterestAction(validData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockError).toHaveBeenCalled()
      expect(mockUserInterestsService.toggleInterest).not.toHaveBeenCalled()
    })

    it('應該處理服務層錯誤', async () => {
      // Arrange
      mockUserInterestsService.getUserInterests.mockResolvedValue([])
      mockUserInterestsService.toggleInterest.mockResolvedValue(false)
      mockError.mockReturnValue({
        success: false,
        error: { message: '切換興趣狀態失敗' },
      })

      // Act
      await toggleInterestAction(validData)

      // Assert
      expect(mockError).toHaveBeenCalled()
    })

    it('應該處理服務層拋出的異常', async () => {
      // Arrange
      mockUserInterestsService.getUserInterests.mockResolvedValue([])
      mockUserInterestsService.toggleInterest.mockRejectedValue(new Error('資料庫連線失敗'))
      mockError.mockReturnValue({
        success: false,
        error: { message: '資料庫連線失敗' },
      })

      // Act
      await toggleInterestAction(validData)

      // Assert
      expect(mockError).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // syncInterestsAction Tests
  // ==========================================================================

  describe('syncInterestsAction', () => {
    it('應該成功同步本地興趣清單到雲端', async () => {
      // Arrange
      const validData = {
        localInterests: ['product-1', 'product-2', 'product-3'],
      }
      const mergedInterests = ['product-1', 'product-2', 'product-3', 'product-4']
      mockUserInterestsService.syncLocalInterests.mockResolvedValue(mergedInterests)
      mockSuccess.mockReturnValue({
        success: true,
        data: {
          userId: mockUser.id,
          interests: mergedInterests,
          syncedCount: 3,
          totalCount: 4,
        },
        message: '興趣清單同步成功',
      })

      // Act
      await syncInterestsAction(validData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockUserInterestsService.syncLocalInterests).toHaveBeenCalledWith(
        mockUser.id,
        validData.localInterests
      )
      expect(mockRevalidatePath).toHaveBeenCalledWith('/products')
      expect(mockRevalidatePath).toHaveBeenCalledWith('/user/interests')
      expect(mockSuccess).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          interests: mergedInterests,
          syncedCount: 3,
          totalCount: 4,
        },
        '興趣清單同步成功'
      )
    })

    it('應該處理空的本地興趣清單', async () => {
      // Arrange
      const validData = { localInterests: [] }
      const mergedInterests = ['product-4'] // 雲端已有的興趣
      mockUserInterestsService.syncLocalInterests.mockResolvedValue(mergedInterests)
      mockSuccess.mockReturnValue({
        success: true,
        data: {
          userId: mockUser.id,
          interests: mergedInterests,
          syncedCount: 0,
          totalCount: 1,
        },
        message: '興趣清單同步成功',
      })

      // Act
      await syncInterestsAction(validData)

      // Assert
      expect(mockUserInterestsService.syncLocalInterests).toHaveBeenCalledWith(mockUser.id, [])
      expect(mockSuccess).toHaveBeenCalled()
    })

    it('應該使用預設空陣列當 localInterests 未提供', async () => {
      // Arrange
      const validData = {} // 沒有 localInterests
      const mergedInterests = ['product-4']
      mockUserInterestsService.syncLocalInterests.mockResolvedValue(mergedInterests)
      mockSuccess.mockReturnValue({
        success: true,
        data: {
          userId: mockUser.id,
          interests: mergedInterests,
          syncedCount: 0,
          totalCount: 1,
        },
        message: '興趣清單同步成功',
      })

      // Act
      await syncInterestsAction(validData)

      // Assert
      expect(mockUserInterestsService.syncLocalInterests).toHaveBeenCalledWith(mockUser.id, [])
      expect(mockSuccess).toHaveBeenCalled()
    })

    it('應該拒絕非陣列的 localInterests', async () => {
      // Arrange
      const invalidData = { localInterests: 'not-an-array' }
      mockValidationError.mockReturnValue({
        success: false,
        error: { message: 'localInterests 必須是陣列' },
      })

      // Act
      await syncInterestsAction(invalidData)

      // Assert
      expect(mockValidationError).toHaveBeenCalled()
      expect(mockUserInterestsService.syncLocalInterests).not.toHaveBeenCalled()
    })

    it('應該要求用戶登入', async () => {
      // Arrange
      const validData = { localInterests: ['product-1'] }
      mockRequireAuth.mockRejectedValue(new Error('未登入'))
      mockError.mockReturnValue({
        success: false,
        error: { message: '未登入' },
      })

      // Act
      await syncInterestsAction(validData)

      // Assert
      expect(mockRequireAuth).toHaveBeenCalledTimes(1)
      expect(mockError).toHaveBeenCalled()
      expect(mockUserInterestsService.syncLocalInterests).not.toHaveBeenCalled()
    })

    it('應該處理服務層錯誤', async () => {
      // Arrange
      const validData = { localInterests: ['product-1'] }
      mockUserInterestsService.syncLocalInterests.mockRejectedValue(new Error('同步失敗'))
      mockError.mockReturnValue({
        success: false,
        error: { message: '同步失敗' },
      })

      // Act
      await syncInterestsAction(validData)

      // Assert
      expect(mockError).toHaveBeenCalled()
    })
  })
})
