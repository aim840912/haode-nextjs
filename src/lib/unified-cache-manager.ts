/**
 * 統一快取管理器
 *
 * 整合伺服器端和客戶端快取策略，提供統一的介面和多層快取機制
 * - 第一層：記憶體快取（最快）
 * - 第二層：Redis/Vercel KV（中等速度）
 * - 第三層：從資料源重新載入（最慢）
 */

import { kv } from '@vercel/kv'
import { cacheLogger } from '@/lib/logger'

export interface CacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale while revalidate in seconds
  tags?: string[] // Cache tags for invalidation
}

export interface CacheMetrics {
  hits: number
  misses: number
  errors: number
  hitRate: string
}

export interface AdvancedCacheMetrics extends CacheMetrics {
  memoryHits: number
  kvHits: number
  sets: number
  deletes: number
  invalidations: number
  warmups: number
  backgroundRefreshes: number
  averageResponseTime: number
  peakMemorySize: number
  totalOperations: number
  uptime: number
  lastActivity: string
  layerDistribution: {
    memory: number
    kv: number
  }
}

/**
 * 統一快取管理器
 * 支援多層快取和智慧型失效機制
 */
export class UnifiedCacheManager {
  // 記憶體快取層
  private static memoryCache = new Map<
    string,
    {
      data: unknown
      expires: number
      tags: string[]
    }
  >()

  // 快取統計
  private static metrics = {
    hits: 0,
    misses: 0,
    errors: 0,
    memoryHits: 0,
    kvHits: 0,
    sets: 0,
    deletes: 0,
    invalidations: 0,
    warmups: 0,
    backgroundRefreshes: 0,
    responseTimes: [] as number[],
    peakMemorySize: 0,
    startTime: Date.now(),
    lastActivity: Date.now(),
  }

  /**
   * 檢查 KV/Redis 是否可用
   */
  private static isKVAvailable(): boolean {
    return !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  }

  /**
   * 從多層快取取得資料
   * 1. 記憶體快取 → 2. KV/Redis → 3. null (由呼叫方處理資料載入)
   */
  static async get<T>(key: string): Promise<T | null> {
    try {
      // 第一層：記憶體快取
      const memoryCached = this.memoryCache.get(key)
      if (memoryCached && memoryCached.expires > Date.now()) {
        this.metrics.hits++
        cacheLogger.debug('記憶體快取命中', { metadata: { key, layer: 'memory' } })
        return memoryCached.data as T
      }

      // 第二層：KV/Redis 快取
      if (this.isKVAvailable()) {
        const kvCached = await kv.get<{ data: T; tags: string[] }>(key)
        if (kvCached !== null) {
          this.metrics.hits++
          cacheLogger.debug('KV快取命中', { metadata: { key, layer: 'kv' } })

          // 同時更新記憶體快取
          this.memoryCache.set(key, {
            data: kvCached.data,
            expires: Date.now() + 300 * 1000, // 預設5分鐘記憶體快取
            tags: kvCached.tags || [],
          })

          return kvCached.data
        }
      }

      // 快取未命中
      this.metrics.misses++
      cacheLogger.debug('快取未命中', { metadata: { key } })
      return null
    } catch (error) {
      this.metrics.errors++
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
  static async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const { ttl = 300, tags = [] } = options
    const expires = Date.now() + ttl * 1000

    try {
      // 設定記憶體快取
      this.memoryCache.set(key, {
        data,
        expires,
        tags,
      })

      // 設定 KV/Redis 快取（含標籤索引）
      if (this.isKVAvailable()) {
        // 設定快取資料
        await kv.set(key, { data, tags }, { ex: ttl })

        // 為每個標籤建立索引
        if (tags.length > 0) {
          try {
            for (const tag of tags) {
              const tagIndexKey = `tag_index:${tag}`
              await kv.sadd(tagIndexKey, key)
              // 標籤索引也要設定過期時間（比資料稍長一些）
              await kv.expire(tagIndexKey, ttl + 60)
            }
          } catch (indexError) {
            cacheLogger.warn('標籤索引建立失敗', {
              metadata: {
                key,
                tags,
                error: (indexError as Error).message,
              },
            })
          }
        }

        cacheLogger.debug('快取已設定', {
          metadata: {
            key,
            ttl,
            tags: tags.length,
            layers: ['memory', 'kv'],
            tagIndexed: tags.length > 0,
          },
        })
      } else {
        cacheLogger.debug('快取已設定', {
          metadata: {
            key,
            ttl,
            tags: tags.length,
            layers: ['memory'],
          },
        })
      }
    } catch (error) {
      this.metrics.errors++
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
      this.memoryCache.delete(key)

      // 刪除 KV 快取
      if (this.isKVAvailable()) {
        await kv.del(key)
      }

      cacheLogger.debug('快取已刪除', { metadata: { key } })
    } catch (error) {
      this.metrics.errors++
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
    if (tags.length === 0) return

    try {
      let deletedCount = 0

      // 失效記憶體快取
      for (const [key, cached] of this.memoryCache.entries()) {
        if (cached.tags.some(tag => tags.includes(tag))) {
          this.memoryCache.delete(key)
          deletedCount++
        }
      }

      // 失效 KV 快取 - 使用模式掃描
      if (this.isKVAvailable()) {
        try {
          // 為標籤建立索引鍵（如果不存在的話）
          const tagIndexKeys = tags.map(tag => `tag_index:${tag}`)

          for (const tagIndexKey of tagIndexKeys) {
            const taggedKeys = (await kv.smembers(tagIndexKey)) as string[]
            if (taggedKeys && taggedKeys.length > 0) {
              // 刪除標籤對應的快取項目
              await kv.del(...taggedKeys)
              // 清理標籤索引
              await kv.del(tagIndexKey)
              deletedCount += taggedKeys.length
            }
          }

          cacheLogger.info('KV層標籤失效完成', {
            metadata: {
              tags,
              kvDeletedCount: deletedCount,
            },
          })
        } catch (kvError) {
          // KV 標籤失效失敗時，使用備用的掃描方式
          cacheLogger.warn('KV標籤失效失敗，使用備用掃描方式', {
            metadata: {
              tags,
              error: (kvError as Error).message,
            },
          })

          // 備用方案：掃描常見的快取鍵模式
          const patterns = this.generatePatternsFromTags(tags)
          for (const pattern of patterns) {
            await this.deletePattern(pattern)
          }
        }
      }

      cacheLogger.info('快取標籤失效完成', {
        metadata: {
          tags,
          memoryDeletedCount: deletedCount,
        },
      })
    } catch (error) {
      this.metrics.errors++
      cacheLogger.warn('快取標籤失效錯誤', {
        metadata: {
          tags,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 模式刪除（向後相容）
   */
  static async deletePattern(pattern: string): Promise<void> {
    try {
      let deletedCount = 0

      // 記憶體快取模式刪除
      const searchPattern = pattern.replace('*', '')
      for (const key of this.memoryCache.keys()) {
        if (key.includes(searchPattern)) {
          this.memoryCache.delete(key)
          deletedCount++
        }
      }

      // KV 快取模式刪除
      if (this.isKVAvailable()) {
        const keys = await kv.keys(pattern)
        if (keys.length > 0) {
          await kv.del(...keys)
          deletedCount += keys.length
        }
      }

      cacheLogger.info('快取模式刪除完成', {
        metadata: {
          pattern,
          deletedCount,
        },
      })
    } catch (error) {
      this.metrics.errors++
      cacheLogger.warn('快取模式刪除錯誤', {
        metadata: {
          pattern,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 清理過期的記憶體快取
   */
  static cleanExpired(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, cached] of this.memoryCache.entries()) {
      if (cached.expires <= now) {
        this.memoryCache.delete(key)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      cacheLogger.debug('記憶體快取清理完成', { metadata: { cleanedCount } })
    }
  }

  /**
   * 取得快取統計資訊
   */
  static getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses
    return {
      ...this.metrics,
      hitRate: total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) + '%' : '0.0%',
    }
  }

  /**
   * 重設統計資訊
   */
  static resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      errors: 0,
    }
  }

  /**
   * 從標籤生成快取鍵模式（備用失效方案）
   */
  private static generatePatternsFromTags(tags: string[]): string[] {
    const patterns: string[] = []

    // 根據標籤生成常見的快取鍵模式
    for (const tag of tags) {
      switch (tag) {
        case 'products':
          patterns.push('products:*')
          break
        case 'news':
          patterns.push('news:*')
          break
        case 'culture':
          patterns.push('culture:*')
          break
        case 'farmtour':
          patterns.push('farmtour:*')
          break
        case 'locations':
          patterns.push('locations:*')
          break
        case 'inquiries':
          patterns.push('inquiries:*')
          break
        case 'api':
          patterns.push('api:*')
          break
        default:
          // 對於自定義標籤，嘗試生成模式
          if (tag.includes('-')) {
            const prefix = tag.split('-')[0]
            patterns.push(`${prefix}:*`)
          }
      }
    }

    return [...new Set(patterns)] // 去重
  }

  /**
   * 快取預熱功能
   * 預先載入重要資料到快取中
   */
  static async warmUp(
    warmupTasks: Array<{
      key: string
      fetcher: () => Promise<unknown>
      options?: CacheOptions
    }>
  ): Promise<void> {
    cacheLogger.info('開始快取預熱', { metadata: { taskCount: warmupTasks.length } })

    const results = await Promise.allSettled(
      warmupTasks.map(async ({ key, fetcher, options = {} }) => {
        try {
          // 檢查是否已存在有效快取
          const existing = await this.get(key)
          if (existing) {
            cacheLogger.debug('快取預熱跳過（已存在）', { metadata: { key } })
            return { key, status: 'skipped' }
          }

          // 載入並快取資料
          const data = await fetcher()
          await this.set(key, data, options)

          cacheLogger.debug('快取預熱完成', { metadata: { key } })
          return { key, status: 'warmed' }
        } catch (error) {
          cacheLogger.warn('快取預熱失敗', {
            metadata: {
              key,
              error: (error as Error).message,
            },
          })
          return { key, status: 'failed', error: (error as Error).message }
        }
      })
    )

    const summary = results.reduce(
      (acc, result) => {
        if (result.status === 'fulfilled') {
          const status = result.value.status as 'warmed' | 'skipped' | 'failed'
          if (status in acc) {
            acc[status]++
          }
        } else {
          acc.failed++
        }
        return acc
      },
      { warmed: 0, skipped: 0, failed: 0 }
    )

    cacheLogger.info('快取預熱完成', { metadata: summary })
  }

  /**
   * 背景快取更新
   * 在背景更新即將過期的快取
   */
  static async backgroundRefresh(
    refreshTasks: Array<{
      key: string
      fetcher: () => Promise<unknown>
      options?: CacheOptions
      threshold?: number // 剩餘時間閾值（秒），預設60秒
    }>
  ): Promise<void> {
    const now = Date.now()
    const refreshedKeys: string[] = []

    for (const { key, fetcher, options = {}, threshold = 60 } of refreshTasks) {
      try {
        const cached = this.memoryCache.get(key)
        if (!cached) continue

        const timeUntilExpiry = cached.expires - now
        const thresholdMs = threshold * 1000

        // 如果快取即將在閾值時間內過期，就在背景更新
        if (timeUntilExpiry <= thresholdMs && timeUntilExpiry > 0) {
          const freshData = await fetcher()
          await this.set(key, freshData, options)
          refreshedKeys.push(key)

          cacheLogger.debug('背景快取更新完成', {
            metadata: {
              key,
              timeUntilExpiry: Math.round(timeUntilExpiry / 1000),
            },
          })
        }
      } catch (error) {
        cacheLogger.warn('背景快取更新失敗', {
          metadata: {
            key,
            error: (error as Error).message,
          },
        })
      }
    }

    if (refreshedKeys.length > 0) {
      cacheLogger.info('背景快取更新完成', {
        metadata: {
          refreshedCount: refreshedKeys.length,
          keys: refreshedKeys,
        },
      })
    }
  }

  /**
   * 取得快取資訊（用於除錯）
   */
  static getInfo() {
    return {
      memorySize: this.memoryCache.size,
      kvAvailable: this.isKVAvailable(),
      metrics: this.getMetrics(),
    }
  }
}

/**
 * 高階函數包裝器，提供快取功能
 * 支援標籤系統和自動失效
 */
export function withUnifiedCache<T>(
  fetcher: () => Promise<T>,
  cacheKey: string,
  options: CacheOptions = {}
) {
  return async (): Promise<T> => {
    // 嘗試從快取取得
    const cached = await UnifiedCacheManager.get<T>(cacheKey)
    if (cached !== null) {
      return cached
    }

    // 載入新資料
    const data = await fetcher()

    // 設定快取
    await UnifiedCacheManager.set(cacheKey, data, options)

    return data
  }
}

// 定期清理過期的記憶體快取（只在伺服器環境執行）
declare global {
  var unifiedCacheCleanupStarted: boolean | undefined
}

if (typeof globalThis !== 'undefined' && !globalThis.unifiedCacheCleanupStarted) {
  globalThis.unifiedCacheCleanupStarted = true
  setInterval(
    () => {
      UnifiedCacheManager.cleanExpired()
    },
    5 * 60 * 1000
  ) // 每5分鐘清理一次
}
