/**
 * 快取進階功能
 * 包含預熱和背景更新功能
 */

import { cacheLogger } from '@/lib/logger'
import type { WarmupTask, BackgroundRefreshTask, CacheOptions } from './cache-types'
import type { CacheStorageManager } from './cache-storage'
import type { CacheMetricsManager } from './cache-metrics'

export class CacheAdvancedManager {
  constructor(
    private storageManager: CacheStorageManager,
    private metricsManager: CacheMetricsManager,
    private setCache: (key: string, data: unknown, options: CacheOptions) => Promise<void>,
    private getCache: <T>(key: string) => Promise<T | null>
  ) {}

  /**
   * 快取預熱功能
   * 預先載入重要資料到快取中
   */
  async warmUp(warmupTasks: WarmupTask[]): Promise<void> {
    cacheLogger.info('開始快取預熱', { metadata: { taskCount: warmupTasks.length } })

    const results = await Promise.allSettled(
      warmupTasks.map(async ({ key, fetcher, options = {} }) => {
        try {
          // 檢查是否已存在有效快取
          const existing = await this.getCache(key)
          if (existing) {
            cacheLogger.debug('快取預熱跳過（已存在）', { metadata: { key } })
            return { key, status: 'skipped' }
          }

          // 載入並快取資料
          const data = await fetcher()
          await this.setCache(key, data, options)

          this.metricsManager.recordWarmup()

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
  async backgroundRefresh(refreshTasks: BackgroundRefreshTask[]): Promise<void> {
    const now = Date.now()
    const refreshedKeys: string[] = []

    for (const { key, fetcher, options = {}, threshold = 60 } of refreshTasks) {
      try {
        // 從記憶體快取檢查過期時間
        const cached = [...this.storageManager.getAllMemoryEntries()].find(([k]) => k === key)?.[1]

        if (!cached) continue

        const timeUntilExpiry = cached.expires - now
        const thresholdMs = threshold * 1000

        // 如果快取即將在閾值時間內過期，就在背景更新
        if (timeUntilExpiry <= thresholdMs && timeUntilExpiry > 0) {
          const freshData = await fetcher()
          await this.setCache(key, freshData, options)
          refreshedKeys.push(key)

          this.metricsManager.recordBackgroundRefresh()

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
}
