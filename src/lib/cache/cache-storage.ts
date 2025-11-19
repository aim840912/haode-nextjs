/**
 * 快取儲存層管理
 * 負責記憶體快取和 KV 存儲的操作
 */

import { kv } from '@vercel/kv'
import { cacheLogger } from '@/lib/logger'
import type { CacheMetricsManager } from './cache-metrics'
import type { CacheEntry, CacheOptions } from './cache-types'

export class CacheStorageManager {
  private memoryCache = new Map<string, CacheEntry>()

  constructor(private metricsManager: CacheMetricsManager) {}

  /**
   * 檢查 KV/Redis 是否可用
   */
  isKVAvailable(): boolean {
    return !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL)
  }

  /**
   * 從記憶體快取取得資料
   */
  getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (cached && cached.expires > Date.now()) {
      this.metricsManager.recordHit('memory')
      cacheLogger.debug('記憶體快取命中', { metadata: { key, layer: 'memory' } })
      return cached.data as T
    }
    return null
  }

  /**
   * 從 KV 快取取得資料
   */
  async getFromKV<T>(key: string): Promise<T | null> {
    if (!this.isKVAvailable()) {
      return null
    }

    try {
      const kvCached = await kv.get<{ data: T; tags: string[] }>(key)
      if (kvCached !== null) {
        this.metricsManager.recordHit('kv')
        cacheLogger.debug('KV快取命中', { metadata: { key, layer: 'kv' } })

        // 同時更新記憶體快取
        this.memoryCache.set(key, {
          data: kvCached.data,
          expires: Date.now() + 300 * 1000, // 預設5分鐘記憶體快取
          tags: kvCached.tags || [],
        })

        return kvCached.data
      }
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('KV快取讀取錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
    }

    return null
  }

  /**
   * 設定記憶體快取
   */
  setInMemory(key: string, data: unknown, expires: number, tags: string[]): void {
    this.memoryCache.set(key, {
      data,
      expires,
      tags,
    })

    // 更新記憶體峰值
    this.metricsManager.updatePeakMemorySize(this.memoryCache.size)
  }

  /**
   * 設定 KV 快取（含標籤索引）
   */
  async setInKV(key: string, data: unknown, options: CacheOptions): Promise<void> {
    if (!this.isKVAvailable()) {
      return
    }

    const { ttl = 300, tags = [] } = options

    try {
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

      cacheLogger.debug('KV快取已設定', {
        metadata: {
          key,
          ttl,
          tags: tags.length,
          tagIndexed: tags.length > 0,
        },
      })
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('KV快取設定錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 刪除記憶體快取
   */
  deleteFromMemory(key: string): void {
    this.memoryCache.delete(key)
  }

  /**
   * 刪除 KV 快取
   */
  async deleteFromKV(key: string): Promise<void> {
    if (!this.isKVAvailable()) {
      return
    }

    try {
      await kv.del(key)
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('KV快取刪除錯誤', {
        metadata: {
          key,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 取得記憶體快取的所有項目（用於失效和清理）
   */
  getAllMemoryEntries(): IterableIterator<[string, CacheEntry]> {
    return this.memoryCache.entries()
  }

  /**
   * 取得記憶體快取大小
   */
  getMemorySize(): number {
    return this.memoryCache.size
  }

  /**
   * 清理過期的記憶體快取
   */
  cleanExpired(): number {
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

    return cleanedCount
  }

  /**
   * 從 KV 取得標籤索引的所有鍵
   */
  async getTaggedKeys(tag: string): Promise<string[]> {
    if (!this.isKVAvailable()) {
      return []
    }

    try {
      const tagIndexKey = `tag_index:${tag}`
      const taggedKeys = (await kv.smembers(tagIndexKey)) as string[]
      return taggedKeys || []
    } catch (error) {
      cacheLogger.warn('取得標籤索引失敗', {
        metadata: {
          tag,
          error: (error as Error).message,
        },
      })
      return []
    }
  }

  /**
   * 從 KV 刪除標籤索引
   */
  async deleteTagIndex(tag: string): Promise<void> {
    if (!this.isKVAvailable()) {
      return
    }

    try {
      const tagIndexKey = `tag_index:${tag}`
      await kv.del(tagIndexKey)
    } catch (error) {
      cacheLogger.warn('刪除標籤索引失敗', {
        metadata: {
          tag,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 從 KV 批量刪除鍵
   */
  async deleteBatchFromKV(keys: string[]): Promise<void> {
    if (!this.isKVAvailable() || keys.length === 0) {
      return
    }

    try {
      await kv.del(...keys)
    } catch (error) {
      cacheLogger.warn('KV批量刪除失敗', {
        metadata: {
          count: keys.length,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 從 KV 取得符合模式的鍵
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    if (!this.isKVAvailable()) {
      return []
    }

    try {
      return await kv.keys(pattern)
    } catch (error) {
      cacheLogger.warn('KV模式查詢失敗', {
        metadata: {
          pattern,
          error: (error as Error).message,
        },
      })
      return []
    }
  }
}
