/**
 * InquiryStatsService 測試
 *
 * 測試詢問單統計服務:
 * - 統計資料查詢
 * - 佔位實作行為（返回空陣列）
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { InquiryStatsService } from '../InquiryStatsService'

// ============================================================================
// Mock Setup
// ============================================================================

// 不需要從 inquiry-query-test-setup 匯入，因為這個服務不需要資料庫操作
// 直接 mock logger

vi.mock('@/lib/logger', () => ({
  dbLogger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// Tests
// ============================================================================

describe('InquiryStatsService', () => {
  let service: InquiryStatsService

  beforeEach(() => {
    service = new InquiryStatsService()
    vi.clearAllMocks()
  })

  describe('getInquiryStats', () => {
    it('應該返回空陣列（佔位實作）', async () => {
      // Act
      const result = await service.getInquiryStats()

      // Assert
      expect(result).toEqual([])
      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(0)
    })

    it('應該記錄警告訊息說明佔位實作', async () => {
      // Arrange
      const { dbLogger } = await import('@/lib/logger')

      // Act
      await service.getInquiryStats()

      // Assert
      expect(dbLogger.warn).toHaveBeenCalledTimes(1)
      expect(dbLogger.warn).toHaveBeenCalledWith(
        'getInquiryStats - 佔位實作：inquiry_stats 表不存在',
        expect.objectContaining({
          module: 'InquiryService',
          action: 'getInquiryStats',
        })
      )
    })

    it('應該在每次調用時返回新的空陣列實例', async () => {
      // Act
      const result1 = await service.getInquiryStats()
      const result2 = await service.getInquiryStats()

      // Assert
      expect(result1).toEqual([])
      expect(result2).toEqual([])
      // 驗證是不同的陣列實例（避免共用狀態問題）
      expect(result1).not.toBe(result2)
    })

    it('應該在多次調用時保持一致行為', async () => {
      // Act - 調用多次
      const results = await Promise.all([
        service.getInquiryStats(),
        service.getInquiryStats(),
        service.getInquiryStats(),
      ])

      // Assert
      results.forEach(result => {
        expect(result).toEqual([])
        expect(result).toHaveLength(0)
      })
    })
  })

  describe('服務實例化', () => {
    it('應該成功建立服務實例', () => {
      // Act
      const newService = new InquiryStatsService()

      // Assert
      expect(newService).toBeInstanceOf(InquiryStatsService)
      expect(newService.getInquiryStats).toBeDefined()
      expect(typeof newService.getInquiryStats).toBe('function')
    })

    it('應該有正確的模組名稱', () => {
      // Assert - 繼承自 InquiryServiceBase (使用基礎類別的 moduleName)
      expect((service as any).moduleName).toBe('InquiryService')
    })
  })
})
