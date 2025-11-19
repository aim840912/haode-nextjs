/**
 * 快取失效管理
 * 負責標籤失效和模式刪除
 */

import { cacheLogger } from '@/lib/logger'
import type { CacheMetricsManager } from './cache-metrics'
import type { CacheStorageManager } from './cache-storage'

export class CacheInvalidationManager {
  constructor(
    private storageManager: CacheStorageManager,
    private metricsManager: CacheMetricsManager
  ) {}

  /**
   * 基於標籤的快取失效
   * 智慧型失效機制，支援記憶體和 KV 層
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    if (tags.length === 0) return

    try {
      let deletedCount = 0

      // 失效記憶體快取
      for (const [key, cached] of this.storageManager.getAllMemoryEntries()) {
        if (cached.tags.some(tag => tags.includes(tag))) {
          this.storageManager.deleteFromMemory(key)
          deletedCount++
        }
      }

      // 失效 KV 快取 - 使用標籤索引
      if (this.storageManager.isKVAvailable()) {
        try {
          for (const tag of tags) {
            const taggedKeys = await this.storageManager.getTaggedKeys(tag)
            if (taggedKeys.length > 0) {
              // 刪除標籤對應的快取項目
              await this.storageManager.deleteBatchFromKV(taggedKeys)
              // 清理標籤索引
              await this.storageManager.deleteTagIndex(tag)
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
            await this.deleteByPattern(pattern)
          }
        }
      }

      this.metricsManager.recordInvalidation()

      cacheLogger.info('快取標籤失效完成', {
        metadata: {
          tags,
          memoryDeletedCount: deletedCount,
        },
      })
    } catch (error) {
      this.metricsManager.recordError()
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
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      let deletedCount = 0

      // 記憶體快取模式刪除
      const searchPattern = pattern.replace('*', '')
      for (const [key] of this.storageManager.getAllMemoryEntries()) {
        if (key.includes(searchPattern)) {
          this.storageManager.deleteFromMemory(key)
          deletedCount++
        }
      }

      // KV 快取模式刪除
      if (this.storageManager.isKVAvailable()) {
        const keys = await this.storageManager.getKeysByPattern(pattern)
        if (keys.length > 0) {
          await this.storageManager.deleteBatchFromKV(keys)
          deletedCount += keys.length
        }
      }

      this.metricsManager.recordDelete()

      cacheLogger.info('快取模式刪除完成', {
        metadata: {
          pattern,
          deletedCount,
        },
      })
    } catch (error) {
      this.metricsManager.recordError()
      cacheLogger.warn('快取模式刪除錯誤', {
        metadata: {
          pattern,
          error: (error as Error).message,
        },
      })
    }
  }

  /**
   * 從標籤生成快取鍵模式（備用失效方案）
   */
  private generatePatternsFromTags(tags: string[]): string[] {
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
        case 'moments':
          patterns.push('moments:*')
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
}
