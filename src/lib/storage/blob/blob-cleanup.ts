/**
 * Blob URL 智慧清理策略
 *
 * 負責自動清理和記憶體管理:
 * - cleanup: 多策略智慧清理
 * - startAutoCleanup: 啟動定時清理
 * - stopAutoCleanup: 停止定時清理
 */

import { logger } from '@/lib/logger'
import { revokeURL } from './blob-lifecycle'
import { getTotalMemoryUsage } from './blob-stats'
import type { BlobURLInfo, BlobURLCleanupOptions, BlobURLCleanupResult } from '../BlobURLManager'

// 配置常數
const DEFAULT_MAX_AGE = 30 * 60 * 1000 // 30分鐘
const DEFAULT_MAX_MEMORY = 100 * 1024 * 1024 // 100MB
const DEFAULT_UNUSED_AGE = 5 * 60 * 1000 // 5分鐘
const CLEANUP_INTERVAL = 2 * 60 * 1000 // 2分鐘檢查一次
const MEMORY_PRESSURE_THRESHOLD = 0.8 // 80% 記憶體使用率觸發積極清理

/**
 * 智慧清理
 */
export async function cleanup(
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>,
  options?: BlobURLCleanupOptions
): Promise<BlobURLCleanupResult> {
  const timer = logger.timer('Blob URL 清理')
  const config = {
    maxAge: options?.maxAge || DEFAULT_MAX_AGE,
    maxMemoryUsage: options?.maxMemoryUsage || DEFAULT_MAX_MEMORY,
    maxUnusedAge: options?.maxUnusedAge || DEFAULT_UNUSED_AGE,
    preserveGroups: options?.preserveGroups || [],
    dryRun: options?.dryRun || false,
  }

  const result: BlobURLCleanupResult = {
    cleanedUrls: 0,
    reclaimedMemory: 0,
    errors: [],
    preservedUrls: 0,
    strategy: 'comprehensive',
  }

  const now = Date.now()
  const currentMemoryUsage = getTotalMemoryUsage(urlMap)
  const urlsToClean: string[] = []

  try {
    // 1. 年齡基礎清理
    for (const [url, info] of urlMap) {
      const age = now - info.createdAt
      const unusedAge = now - info.lastAccessedAt
      const isProtected = config.preserveGroups.includes(info.group || '')

      // 保護特定群組
      if (isProtected) {
        result.preservedUrls++
        continue
      }

      // 清理條件
      const shouldClean =
        age > config.maxAge || // 超過最大年齡
        (info.refCount === 0 && unusedAge > config.maxUnusedAge) || // 未使用且過期
        (currentMemoryUsage > config.maxMemoryUsage && info.refCount === 0) // 記憶體壓力下的未引用項目

      if (shouldClean) {
        urlsToClean.push(url)
      }
    }

    // 2. 記憶體壓力下的積極清理
    if (currentMemoryUsage > config.maxMemoryUsage * MEMORY_PRESSURE_THRESHOLD) {
      result.strategy = 'memory_pressure'

      // 按最後存取時間排序，優先清理最久未使用的
      const sortedUrls = Array.from(urlMap.entries())
        .filter(([url]) => !urlsToClean.includes(url))
        .filter(([, info]) => info.refCount === 0)
        .sort(([, a], [, b]) => a.lastAccessedAt - b.lastAccessedAt)

      for (const [url] of sortedUrls) {
        if (currentMemoryUsage - result.reclaimedMemory <= config.maxMemoryUsage) {
          break
        }
        urlsToClean.push(url)
      }
    }

    // 3. 執行清理
    if (!config.dryRun) {
      for (const url of urlsToClean) {
        const info = urlMap.get(url)
        if (info) {
          result.reclaimedMemory += info.metadata?.fileSize || 0

          if (revokeURL(url, urlMap, groupMap)) {
            result.cleanedUrls++
          } else {
            result.errors.push(`撤銷失敗: ${url.substring(0, 30)}...`)
          }
        }
      }
    } else {
      // 乾跑模式：只統計
      for (const url of urlsToClean) {
        const info = urlMap.get(url)
        if (info) {
          result.cleanedUrls++
          result.reclaimedMemory += info.metadata?.fileSize || 0
        }
      }
    }

    const duration = timer.end({
      metadata: {
        strategy: result.strategy,
        cleanedUrls: result.cleanedUrls,
        reclaimedMemory: result.reclaimedMemory,
        preservedUrls: result.preservedUrls,
        dryRun: config.dryRun,
      },
    })

    logger.info('Blob URL 清理完成', {
      metadata: {
        ...result,
        duration,
        memoryBefore: currentMemoryUsage,
        memoryAfter: currentMemoryUsage - result.reclaimedMemory,
      },
    })

    return result
  } catch (error) {
    timer.end()
    logger.error('Blob URL 清理失敗', error as Error)
    result.errors.push(`清理過程發生錯誤: ${String(error)}`)
    return result
  }
}

/**
 * 啟動自動清理
 */
export function startAutoCleanup(
  urlMap: Map<string, BlobURLInfo>,
  groupMap: Map<string, Set<string>>
): NodeJS.Timeout {
  const timer = setInterval(async () => {
    try {
      await cleanup(urlMap, groupMap)
    } catch (error) {
      logger.error('自動清理失敗', error as Error)
    }
  }, CLEANUP_INTERVAL)

  logger.info('Blob URL 自動清理已啟動', {
    metadata: { interval: CLEANUP_INTERVAL },
  })

  return timer
}

/**
 * 停止自動清理
 */
export function stopAutoCleanup(cleanupTimer: NodeJS.Timeout | null): void {
  if (cleanupTimer) {
    clearInterval(cleanupTimer)
    logger.info('Blob URL 自動清理已停止')
  }
}
