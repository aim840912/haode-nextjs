/**
 * 統一快取管理器
 *
 * 整合伺服器端和客戶端快取策略，提供統一的介面和多層快取機制
 * - 第一層：記憶體快取（最快）
 * - 第二層：Redis/Vercel KV（中等速度）
 * - 第三層：從資料源重新載入（最慢）
 */

import { cacheLogger } from '@/lib/logger'
import { CacheAdvancedManager } from './cache-advanced'
import { CacheInvalidationManager } from './cache-invalidation'
import { CacheMetricsManager } from './cache-metrics'
import { CacheStorageManager } from './cache-storage'
import { createCacheWrapper, setupCacheCleanup } from './cache-utils'

// 重新匯出型別
export type {
  CacheOptions,
  CacheMetrics,
  AdvancedCacheMetrics,
  WarmupTask,
  BackgroundRefreshTask,
} from './cache-types'

/**
 * 統一快取管理器
 * 支援多層快取和智慧型失效機制
 */
export class UnifiedCacheManager {
  private static metricsManager = new CacheMetricsManager()
  private static storageManager = new CacheStorageManager(this.metricsManager)
  private static invalidationManager = new CacheInvalidationManager(
    this.storageManager,
    this.metricsManager
  )
  private static advancedManager = new CacheAdvancedManager(
    this.storageManager,
    this.metricsManager,
    this.set.bind(this),
    this.get.bind(this)
  )

  /**
   * 從多層快取取得資料
   * 1. 記憶體快取 → 2. KV/Redis → 3. null (由呼叫方處理資料載入)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // 第一層：記憶體快取
      const memoryResult = this.storageManager.getFromMemory<T>(key)
      if (memoryResult !== null) {
        return memoryResult
      }

      // 第二層：KV/Redis 快取
      const kvResult = await this.storageManager.getFromKV<T>(key)
      if (kvResult !== null) {
        return kvResult
      }

      // 快取未命中
      this.metricsManager.recordMiss()
      cacheLogger.debug('快取未命中', { metadata: { key } })
      return null
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('快取讀取錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
      return null
    }
  }

  /**
   * 設定快取資料到多層快取（含標籤索引）
   */
  static async set<T>(
    key: string,
    data: T,
    options: { ttl?: number; tags?: string[] } = {}
  ): Promise<void> {
    const { ttl = 300, tags = [] } = options
    const expires = Date.now() + ttl * 1000

    try {
      // 設定記憶體快取
      this.storageManager.setInMemory(key, data, expires, tags)

      // 設定 KV/Redis 快取（含標籤索引）
      await this.storageManager.setInKV(key, data, options)

      this.metricsManager.recordSet()

      const layers = this.storageManager.isKVAvailable() ? ['memory', 'kv'] : ['memory']
      cacheLogger.debug('快取已設定', {
        metadata: {
          key,
          ttl,
          tags: tags.length,
          layers,
          tagIndexed: this.storageManager.isKVAvailable() && tags.length > 0,
        },
      })
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('快取設定錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 刪除特定快取
   */
  static async delete(key: string): Promise<void> {
    try {
      // 刪除記憶體快取
      this.storageManager.deleteFromMemory(key)

      // 刪除 KV 快取
      await this.storageManager.deleteFromKV(key)

      this.metricsManager.recordDelete()

      cacheLogger.debug('快取已刪除', { metadata: { key } })
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('快取刪除錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 基於標籤的快取失效
   * 智慧型失效機制，支援記憶體和 KV 層
   */
  static async invalidate(tags: string[]): Promise<void> {
    return this.invalidationManager.invalidateByTags(tags)
  }

  /**
   * 模式刪除（向後相容）
   */
  static async deletePattern(pattern: string): Promise<void> {
    return this.invalidationManager.deleteByPattern(pattern)
  }

  /**
   * 清理過期的記憶體快取
   */
  static cleanExpired(): void {
    this.storageManager.cleanExpired()
  }

  /**
   * 取得快取統計資訊
   */
  static getMetrics() {
    return this.metricsManager.getMetrics()
  }

  /**
   * 取得進階快取統計資訊
   */
  static getAdvancedStats() {
    return this.metricsManager.getAdvancedStats()
  }

  /**
   * 重設統計資訊
   */
  static resetMetrics(): void {
    this.metricsManager.reset()
  }

  /**
   * 快取預熱功能
   * 預先載入重要資料到快取中
   */
  static async warmUp(
    warmupTasks: Array<{
      key: string
      fetcher: () => Promise<unknown>
      options?: { ttl?: number; tags?: string[] }
    }>
  ): Promise<void> {
    return this.advancedManager.warmUp(warmupTasks)
  }

  /**
   * 背景快取更新
   * 在背景更新即將過期的快取
   */
  static async backgroundRefresh(
    refreshTasks: Array<{
      key: string
      fetcher: () => Promise<unknown>
      options?: { ttl?: number; tags?: string[] }
      threshold?: number
    }>
  ): Promise<void> {
    return this.advancedManager.backgroundRefresh(refreshTasks)
  }

  /**
   * 取得快取資訊（用於除錯）
   */
  static getInfo() {
    return {
      memorySize: this.storageManager.getMemorySize(),
      kvAvailable: this.storageManager.isKVAvailable(),
      metrics: this.getMetrics(),
    }
  }
}

/**
 * 高階函數包裝器，提供快取功能
 * 支援標籤系統和自動失效
 */
export const withUnifiedCache = createCacheWrapper(
  UnifiedCacheManager.get.bind(UnifiedCacheManager),
  UnifiedCacheManager.set.bind(UnifiedCacheManager)
)

// 設定定期清理過期的記憶體快取（只在伺服器環境執行）
setupCacheCleanup(() => UnifiedCacheManager.cleanExpired())
