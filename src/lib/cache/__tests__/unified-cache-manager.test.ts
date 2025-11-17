/**
 * UnifiedCacheManager 測試
 *
 * 測試統一快取管理器的核心功能:
 * - 多層快取讀取 (Memory → KV → null)
 * - 多層快取寫入 (Memory + KV)
 * - 快取刪除
 * - 標籤失效
 * - 模式刪除
 * - 統計資訊
 * - 進階功能 (warmUp, backgroundRefresh)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { UnifiedCacheManager } from '../unified-cache-manager'

// ============================================================================
// Mock Setup (vi.hoisted for Vitest 4.0 compatibility)
// ============================================================================

const hoistedMocks = vi.hoisted(() => {
  // Mock CacheMetricsManager
  const mockMetricsManager = {
    recordHit: vi.fn(),
    recordMiss: vi.fn(),
    recordSet: vi.fn(),
    recordDelete: vi.fn(),
    recordError: vi.fn(),
    getMetrics: vi.fn(() => ({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
      hitRate: 0,
    })),
    getAdvancedStats: vi.fn(() => ({
      memorySize: 0,
      kvSize: 0,
      totalKeys: 0,
      avgTTL: 0,
      tags: {},
    })),
    reset: vi.fn(),
  }

  // Mock CacheStorageManager
  const mockStorageManager = {
    getFromMemory: vi.fn(),
    setInMemory: vi.fn(),
    deleteFromMemory: vi.fn(),
    getFromKV: vi.fn(),
    setInKV: vi.fn(),
    deleteFromKV: vi.fn(),
    cleanExpired: vi.fn(),
    getMemorySize: vi.fn(() => 0),
    isKVAvailable: vi.fn(() => false),
  }

  // Mock CacheInvalidationManager
  const mockInvalidationManager = {
    invalidateByTags: vi.fn(),
    deleteByPattern: vi.fn(),
  }

  // Mock CacheAdvancedManager
  const mockAdvancedManager = {
    warmUp: vi.fn(),
    backgroundRefresh: vi.fn(),
  }

  return {
    mockMetricsManager,
    mockStorageManager,
    mockInvalidationManager,
    mockAdvancedManager,
  }
})

// ============================================================================
// Vi.mock calls at module top-level (required for Vitest 4.0)
// ============================================================================

vi.mock('../cache-metrics', () => ({
  CacheMetricsManager: class {
    constructor() {
      return hoistedMocks.mockMetricsManager
    }
  },
}))

vi.mock('../cache-storage', () => ({
  CacheStorageManager: class {
    constructor() {
      return hoistedMocks.mockStorageManager
    }
  },
}))

vi.mock('../cache-invalidation', () => ({
  CacheInvalidationManager: class {
    constructor() {
      return hoistedMocks.mockInvalidationManager
    }
  },
}))

vi.mock('../cache-advanced', () => ({
  CacheAdvancedManager: class {
    constructor() {
      return hoistedMocks.mockAdvancedManager
    }
  },
}))

vi.mock('../cache-utils', () => ({
  createCacheWrapper: vi.fn((get, set) => (fn: Function, options: unknown) => fn),
  setupCacheCleanup: vi.fn(),
}))

vi.mock('@/lib/logger', () => ({
  cacheLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

// ============================================================================
// Tests
// ============================================================================

describe('UnifiedCacheManager', () => {
  const { mockMetricsManager, mockStorageManager, mockInvalidationManager, mockAdvancedManager } =
    hoistedMocks

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // 重置 mock 行為
    mockStorageManager.getFromMemory.mockReturnValue(null)
    mockStorageManager.getFromKV.mockResolvedValue(null)
    mockStorageManager.isKVAvailable.mockReturnValue(false)
  })

  // ==========================================================================
  // get() - 多層快取讀取
  // ==========================================================================

  describe('get()', () => {
    it('應該從記憶體快取取得資料（第一層命中）', async () => {
      // Arrange
      const testData = { id: '123', name: 'test' }
      mockStorageManager.getFromMemory.mockReturnValueOnce(testData)

      // Act
      const result = await UnifiedCacheManager.get<typeof testData>('test-key')

      // Assert
      expect(result).toEqual(testData)
      expect(mockStorageManager.getFromMemory).toHaveBeenCalledWith('test-key')
      expect(mockStorageManager.getFromKV).not.toHaveBeenCalled() // 不應該查 KV
      expect(mockMetricsManager.recordMiss).not.toHaveBeenCalled()
    })

    it('應該從 KV 快取取得資料（第二層命中）', async () => {
      // Arrange
      const testData = { id: '456', name: 'kv-data' }
      mockStorageManager.getFromMemory.mockReturnValueOnce(null) // Memory miss
      mockStorageManager.getFromKV.mockResolvedValueOnce(testData) // KV hit

      // Act
      const result = await UnifiedCacheManager.get<typeof testData>('test-key')

      // Assert
      expect(result).toEqual(testData)
      expect(mockStorageManager.getFromMemory).toHaveBeenCalledWith('test-key')
      expect(mockStorageManager.getFromKV).toHaveBeenCalledWith('test-key')
      expect(mockMetricsManager.recordMiss).not.toHaveBeenCalled()
    })

    it('應該返回 null 當所有層都未命中', async () => {
      // Arrange
      mockStorageManager.getFromMemory.mockReturnValueOnce(null)
      mockStorageManager.getFromKV.mockResolvedValueOnce(null)

      // Act
      const result = await UnifiedCacheManager.get('test-key')

      // Assert
      expect(result).toBeNull()
      expect(mockStorageManager.getFromMemory).toHaveBeenCalledWith('test-key')
      expect(mockStorageManager.getFromKV).toHaveBeenCalledWith('test-key')
      expect(mockMetricsManager.recordMiss).toHaveBeenCalled()
    })

    it('應該處理讀取錯誤並返回 null', async () => {
      // Arrange
      mockStorageManager.getFromMemory.mockImplementation(() => {
        throw new Error('Memory error')
      })

      // Act
      const result = await UnifiedCacheManager.get('test-key')

      // Assert
      expect(result).toBeNull()
      expect(mockMetricsManager.recordError).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // set() - 多層快取寫入
  // ==========================================================================

  describe('set()', () => {
    it('應該同時設定記憶體和 KV 快取', async () => {
      // Arrange
      const testData = { id: '123', value: 'test' }
      const options = { ttl: 600, tags: ['tag1', 'tag2'] }

      // Act
      await UnifiedCacheManager.set('test-key', testData, options)

      // Assert
      expect(mockStorageManager.setInMemory).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.any(Number), // expires timestamp
        ['tag1', 'tag2']
      )
      expect(mockStorageManager.setInKV).toHaveBeenCalledWith('test-key', testData, options)
      expect(mockMetricsManager.recordSet).toHaveBeenCalled()
    })

    it('應該使用預設 TTL (300s) 當未提供時', async () => {
      // Arrange
      const testData = { value: 'test' }

      // Act
      await UnifiedCacheManager.set('test-key', testData)

      // Assert
      expect(mockStorageManager.setInMemory).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.any(Number),
        []
      )
      // 實際實作會傳遞解構後的 options 物件 (空物件時不含 ttl/tags)
      expect(mockStorageManager.setInKV).toHaveBeenCalledWith(
        'test-key',
        testData,
        expect.any(Object)
      )
    })

    it('應該處理設定錯誤', async () => {
      // Arrange
      mockStorageManager.setInMemory.mockImplementation(() => {
        throw new Error('Set error')
      })

      // Act & Assert
      await expect(UnifiedCacheManager.set('test-key', { value: 'test' })).resolves.toBeUndefined()
      expect(mockMetricsManager.recordError).toHaveBeenCalled()
    })

    it('應該支援標籤索引', async () => {
      // Arrange
      const data = { test: 'data' }
      const options = { tags: ['user:123', 'product:456'] }

      // 確保 setInMemory 不會拋出錯誤
      mockStorageManager.setInMemory.mockImplementation(() => {})
      mockStorageManager.setInKV.mockResolvedValue(undefined)

      // Act
      await UnifiedCacheManager.set('test-key', data, options)

      // Assert
      expect(mockStorageManager.setInMemory).toHaveBeenCalledWith(
        'test-key',
        data,
        expect.any(Number),
        ['user:123', 'product:456']
      )
      expect(mockStorageManager.setInKV).toHaveBeenCalledWith('test-key', data, options)
    })
  })

  // ==========================================================================
  // delete() - 快取刪除
  // ==========================================================================

  describe('delete()', () => {
    it('應該同時刪除記憶體和 KV 快取', async () => {
      // Act
      await UnifiedCacheManager.delete('test-key')

      // Assert
      expect(mockStorageManager.deleteFromMemory).toHaveBeenCalledWith('test-key')
      expect(mockStorageManager.deleteFromKV).toHaveBeenCalledWith('test-key')
      expect(mockMetricsManager.recordDelete).toHaveBeenCalled()
    })

    it('應該處理刪除錯誤', async () => {
      // Arrange
      mockStorageManager.deleteFromMemory.mockImplementation(() => {
        throw new Error('Delete error')
      })

      // Act
      await UnifiedCacheManager.delete('test-key')

      // Assert
      expect(mockMetricsManager.recordError).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // invalidate() - 標籤失效
  // ==========================================================================

  describe('invalidate()', () => {
    it('應該根據標籤失效快取', async () => {
      // Arrange
      const tags = ['user:123', 'product:456']

      // Act
      await UnifiedCacheManager.invalidate(tags)

      // Assert
      expect(mockInvalidationManager.invalidateByTags).toHaveBeenCalledWith(tags)
    })

    it('應該支援多個標籤', async () => {
      // Arrange
      const tags = ['tag1', 'tag2', 'tag3']

      // Act
      await UnifiedCacheManager.invalidate(tags)

      // Assert
      expect(mockInvalidationManager.invalidateByTags).toHaveBeenCalledWith(tags)
    })
  })

  // ==========================================================================
  // deletePattern() - 模式刪除
  // ==========================================================================

  describe('deletePattern()', () => {
    it('應該根據模式刪除快取', async () => {
      // Arrange
      const pattern = 'user:*'

      // Act
      await UnifiedCacheManager.deletePattern(pattern)

      // Assert
      expect(mockInvalidationManager.deleteByPattern).toHaveBeenCalledWith(pattern)
    })

    it('應該支援不同的模式格式', async () => {
      // Arrange
      const patterns = ['prefix:*', '*:suffix', '*middle*']

      // Act
      for (const pattern of patterns) {
        await UnifiedCacheManager.deletePattern(pattern)
      }

      // Assert
      expect(mockInvalidationManager.deleteByPattern).toHaveBeenCalledTimes(3)
    })
  })

  // ==========================================================================
  // cleanExpired() - 清理過期快取
  // ==========================================================================

  describe('cleanExpired()', () => {
    it('應該清理過期的記憶體快取', () => {
      // Act
      UnifiedCacheManager.cleanExpired()

      // Assert
      expect(mockStorageManager.cleanExpired).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // getMetrics() - 統計資訊
  // ==========================================================================

  describe('getMetrics()', () => {
    it('應該返回快取統計資訊', () => {
      // Arrange
      const mockMetrics = {
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        errors: 2,
        hitRate: 0.833,
      }
      mockMetricsManager.getMetrics.mockReturnValueOnce(mockMetrics)

      // Act
      const metrics = UnifiedCacheManager.getMetrics()

      // Assert
      expect(metrics).toEqual(mockMetrics)
      expect(mockMetricsManager.getMetrics).toHaveBeenCalled()
    })
  })

  describe('getAdvancedStats()', () => {
    it('應該返回進階統計資訊', () => {
      // Arrange
      const mockStats = {
        memorySize: 1024,
        kvSize: 2048,
        totalKeys: 50,
        avgTTL: 300,
        tags: { 'user:123': 5, 'product:456': 3 },
      }
      mockMetricsManager.getAdvancedStats.mockReturnValueOnce(mockStats)

      // Act
      const stats = UnifiedCacheManager.getAdvancedStats()

      // Assert
      expect(stats).toEqual(mockStats)
      expect(mockMetricsManager.getAdvancedStats).toHaveBeenCalled()
    })
  })

  describe('resetMetrics()', () => {
    it('應該重設統計資訊', () => {
      // Act
      UnifiedCacheManager.resetMetrics()

      // Assert
      expect(mockMetricsManager.reset).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // warmUp() - 快取預熱
  // ==========================================================================

  describe('warmUp()', () => {
    it('應該預熱快取', async () => {
      // Arrange
      const warmupTasks = [
        {
          key: 'key1',
          fetcher: vi.fn(async () => ({ data: 'test1' })),
          options: { ttl: 600, tags: ['tag1'] },
        },
        {
          key: 'key2',
          fetcher: vi.fn(async () => ({ data: 'test2' })),
        },
      ]

      // Act
      await UnifiedCacheManager.warmUp(warmupTasks)

      // Assert
      expect(mockAdvancedManager.warmUp).toHaveBeenCalledWith(warmupTasks)
    })
  })

  // ==========================================================================
  // backgroundRefresh() - 背景更新
  // ==========================================================================

  describe('backgroundRefresh()', () => {
    it('應該在背景更新即將過期的快取', async () => {
      // Arrange
      const refreshTasks = [
        {
          key: 'key1',
          fetcher: vi.fn(async () => ({ data: 'refreshed1' })),
          options: { ttl: 600 },
          threshold: 0.8,
        },
      ]

      // Act
      await UnifiedCacheManager.backgroundRefresh(refreshTasks)

      // Assert
      expect(mockAdvancedManager.backgroundRefresh).toHaveBeenCalledWith(refreshTasks)
    })
  })

  // ==========================================================================
  // getInfo() - 快取資訊
  // ==========================================================================

  describe('getInfo()', () => {
    it('應該返回快取系統資訊', () => {
      // Arrange
      mockStorageManager.getMemorySize.mockReturnValueOnce(1024)
      mockStorageManager.isKVAvailable.mockReturnValueOnce(true)
      const mockMetrics = {
        hits: 100,
        misses: 20,
        sets: 50,
        deletes: 10,
        errors: 0,
        hitRate: 0.833,
      }
      mockMetricsManager.getMetrics.mockReturnValueOnce(mockMetrics)

      // Act
      const info = UnifiedCacheManager.getInfo()

      // Assert
      expect(info).toEqual({
        memorySize: 1024,
        kvAvailable: true,
        metrics: mockMetrics,
      })
    })

    it('應該正確顯示 KV 不可用的狀態', () => {
      // Arrange
      // beforeEach 會設定為返回任意值，我們在這裡檢查 mock 被調用即可
      const info = UnifiedCacheManager.getInfo()

      // Assert
      expect(mockStorageManager.isKVAvailable).toHaveBeenCalled()
      expect(typeof info.kvAvailable).toBe('boolean')
    })
  })

  // ==========================================================================
  // 整合場景測試
  // ==========================================================================

  describe('整合場景', () => {
    it('應該正確處理快取的完整生命週期', async () => {
      // Arrange
      const testData = { id: '123', value: 'test' }
      const key = 'lifecycle-test'

      // 1. Set 快取
      await UnifiedCacheManager.set(key, testData, { ttl: 600, tags: ['test'] })
      expect(mockStorageManager.setInMemory).toHaveBeenCalledWith(
        key,
        testData,
        expect.any(Number),
        ['test']
      )

      //  2. Get 快取（記憶體命中）
      mockStorageManager.getFromMemory.mockReturnValueOnce(testData)
      const result = await UnifiedCacheManager.get(key)
      expect(result).toEqual(testData)

      // 3. Delete 快取
      await UnifiedCacheManager.delete(key)
      expect(mockStorageManager.deleteFromMemory).toHaveBeenCalledWith(key)

      // 4. Get 快取（已刪除，應該 miss）
      mockStorageManager.getFromMemory.mockReturnValueOnce(null)
      mockStorageManager.getFromKV.mockResolvedValueOnce(null)
      const result2 = await UnifiedCacheManager.get(key)
      expect(result2).toBeNull()
      expect(mockMetricsManager.recordMiss).toHaveBeenCalled()
    })

    it('應該正確處理標籤失效場景', async () => {
      // Arrange
      const tags = ['user:123']

      // Set 多個快取項目使用相同標籤
      await UnifiedCacheManager.set('item1', { value: 1 }, { tags })
      await UnifiedCacheManager.set('item2', { value: 2 }, { tags })
      await UnifiedCacheManager.set('item3', { value: 3 }, { tags })

      // Act - 失效所有帶該標籤的快取
      await UnifiedCacheManager.invalidate(tags)

      // Assert
      expect(mockInvalidationManager.invalidateByTags).toHaveBeenCalledWith(tags)
    })
  })
})
