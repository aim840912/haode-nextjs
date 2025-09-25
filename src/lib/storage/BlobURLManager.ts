/**
 * Blob URL 管理系統
 *
 * 功能特色：
 * - 自動記憶體洩漏防護
 * - 生命週期追蹤和自動清理
 * - 引用計數機制
 * - 效能監控和統計
 * - 群組化管理
 * - 自動垃圾收集
 */

import { logger } from '@/lib/logger'

export interface BlobURLInfo {
  url: string
  blob: Blob
  createdAt: number
  lastAccessedAt: number
  refCount: number
  group?: string
  metadata?: {
    fileName?: string
    fileSize: number
    mimeType: string
    purpose?: 'preview' | 'thumbnail' | 'upload' | 'temp'
  }
}

export interface BlobURLStats {
  totalUrls: number
  totalMemoryUsage: number
  groupStats: Record<
    string,
    {
      count: number
      memoryUsage: number
      avgAge: number
    }
  >
  oldestUrl: {
    url: string
    age: number
  } | null
  largestBlob: {
    url: string
    size: number
  } | null
}

export interface BlobURLCleanupOptions {
  maxAge?: number // 最大存活時間（毫秒）
  maxMemoryUsage?: number // 最大記憶體使用量（位元組）
  maxUnusedAge?: number // 未使用 URL 的最大存活時間
  preserveGroups?: string[] // 保護的群組
  dryRun?: boolean // 只返回會被清理的項目，不實際清理
}

export interface BlobURLCleanupResult {
  cleanedUrls: number
  reclaimedMemory: number
  errors: string[]
  preservedUrls: number
  strategy: 'age_based' | 'memory_pressure' | 'reference_based' | 'comprehensive'
}

export class BlobURLManager {
  private static instance: BlobURLManager
  private urlMap = new Map<string, BlobURLInfo>()
  private groupMap = new Map<string, Set<string>>()
  private cleanupTimer: NodeJS.Timeout | null = null

  // 配置常數
  private readonly DEFAULT_MAX_AGE = 30 * 60 * 1000 // 30分鐘
  private readonly DEFAULT_MAX_MEMORY = 100 * 1024 * 1024 // 100MB
  private readonly DEFAULT_UNUSED_AGE = 5 * 60 * 1000 // 5分鐘
  private readonly CLEANUP_INTERVAL = 2 * 60 * 1000 // 2分鐘檢查一次
  private readonly MEMORY_PRESSURE_THRESHOLD = 0.8 // 80% 記憶體使用率觸發積極清理

  /**
   * 單例模式
   */
  static getInstance(): BlobURLManager {
    if (!BlobURLManager.instance) {
      BlobURLManager.instance = new BlobURLManager()
    }
    return BlobURLManager.instance
  }

  constructor() {
    this.startAutoCleanup()

    // 監聽頁面卸載事件，確保清理所有 URL
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup({ dryRun: false })
      })
    }
  }

  /**
   * 建立 Blob URL 並自動管理
   */
  createURL(
    blob: Blob,
    options?: {
      group?: string
      metadata?: BlobURLInfo['metadata']
      ttl?: number // time to live in ms
    }
  ): string {
    try {
      const url = URL.createObjectURL(blob)
      const now = Date.now()

      const info: BlobURLInfo = {
        url,
        blob,
        createdAt: now,
        lastAccessedAt: now,
        refCount: 1,
        group: options?.group,
        metadata: {
          fileSize: blob.size,
          mimeType: blob.type,
          ...options?.metadata,
        },
      }

      this.urlMap.set(url, info)

      // 群組管理
      if (options?.group) {
        if (!this.groupMap.has(options.group)) {
          this.groupMap.set(options.group, new Set())
        }
        this.groupMap.get(options.group)!.add(url)
      }

      // 自動 TTL 清理
      if (options?.ttl) {
        setTimeout(() => {
          this.revokeURL(url)
        }, options.ttl)
      }

      logger.info('Blob URL 已建立', {
        metadata: {
          url: url.substring(0, 50) + '...',
          size: blob.size,
          group: options?.group,
          type: blob.type,
        },
      })

      return url
    } catch (error) {
      logger.error('Blob URL 建立失敗', error as Error, {
        metadata: {
          blobSize: blob.size,
          blobType: blob.type,
          group: options?.group,
        },
      })
      throw error
    }
  }

  /**
   * 增加引用計數
   */
  addReference(url: string): boolean {
    const info = this.urlMap.get(url)
    if (info) {
      info.refCount++
      info.lastAccessedAt = Date.now()
      return true
    }
    return false
  }

  /**
   * 減少引用計數
   */
  removeReference(url: string): boolean {
    const info = this.urlMap.get(url)
    if (info) {
      info.refCount = Math.max(0, info.refCount - 1)
      if (info.refCount === 0) {
        // 延遲清理，給一個緩衝時間
        setTimeout(() => {
          const currentInfo = this.urlMap.get(url)
          if (currentInfo && currentInfo.refCount === 0) {
            this.revokeURL(url)
          }
        }, 1000) // 1秒緩衝
      }
      return true
    }
    return false
  }

  /**
   * 撤銷特定 URL
   */
  revokeURL(url: string): boolean {
    try {
      const info = this.urlMap.get(url)
      if (!info) {
        return false
      }

      // 從瀏覽器中撤銷
      URL.revokeObjectURL(url)

      // 從群組中移除
      if (info.group && this.groupMap.has(info.group)) {
        this.groupMap.get(info.group)!.delete(url)

        // 清理空群組
        if (this.groupMap.get(info.group)!.size === 0) {
          this.groupMap.delete(info.group)
        }
      }

      // 從主映射中移除
      this.urlMap.delete(url)

      logger.debug('Blob URL 已撤銷', {
        metadata: {
          url: url.substring(0, 50) + '...',
          size: info.metadata?.fileSize || 0,
          group: info.group,
          age: Date.now() - info.createdAt,
        },
      })

      return true
    } catch (error) {
      logger.error('Blob URL 撤銷失敗', error as Error, {
        metadata: { url: url.substring(0, 50) + '...' },
      })
      return false
    }
  }

  /**
   * 撤銷整個群組的 URL
   */
  revokeGroup(group: string): number {
    const urls = this.groupMap.get(group)
    if (!urls) {
      return 0
    }

    let revokedCount = 0
    for (const url of Array.from(urls)) {
      if (this.revokeURL(url)) {
        revokedCount++
      }
    }

    logger.info('群組 Blob URL 已批次撤銷', {
      metadata: { group, revokedCount },
    })

    return revokedCount
  }

  /**
   * 檢查 URL 是否存在並更新存取時間
   */
  hasURL(url: string, updateAccess = true): boolean {
    const info = this.urlMap.get(url)
    if (info && updateAccess) {
      info.lastAccessedAt = Date.now()
    }
    return !!info
  }

  /**
   * 取得 URL 資訊
   */
  getURLInfo(url: string): BlobURLInfo | null {
    const info = this.urlMap.get(url)
    if (info) {
      info.lastAccessedAt = Date.now()
    }
    return info || null
  }

  /**
   * 取得群組內的所有 URL
   */
  getGroupURLs(group: string): string[] {
    const urls = this.groupMap.get(group)
    return urls ? Array.from(urls) : []
  }

  /**
   * 智慧清理
   */
  async cleanup(options?: BlobURLCleanupOptions): Promise<BlobURLCleanupResult> {
    const timer = logger.timer('Blob URL 清理')
    const config = {
      maxAge: options?.maxAge || this.DEFAULT_MAX_AGE,
      maxMemoryUsage: options?.maxMemoryUsage || this.DEFAULT_MAX_MEMORY,
      maxUnusedAge: options?.maxUnusedAge || this.DEFAULT_UNUSED_AGE,
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
    const currentMemoryUsage = this.getTotalMemoryUsage()
    const urlsToClean: string[] = []

    try {
      // 1. 年齡基礎清理
      for (const [url, info] of this.urlMap) {
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
      if (currentMemoryUsage > config.maxMemoryUsage * this.MEMORY_PRESSURE_THRESHOLD) {
        result.strategy = 'memory_pressure'

        // 按最後存取時間排序，優先清理最久未使用的
        const sortedUrls = Array.from(this.urlMap.entries())
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
          const info = this.urlMap.get(url)
          if (info) {
            result.reclaimedMemory += info.metadata?.fileSize || 0

            if (this.revokeURL(url)) {
              result.cleanedUrls++
            } else {
              result.errors.push(`撤銷失敗: ${url.substring(0, 30)}...`)
            }
          }
        }
      } else {
        // 乾跑模式：只統計
        for (const url of urlsToClean) {
          const info = this.urlMap.get(url)
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
   * 取得統計資訊
   */
  getStats(): BlobURLStats {
    const stats: BlobURLStats = {
      totalUrls: this.urlMap.size,
      totalMemoryUsage: 0,
      groupStats: {},
      oldestUrl: null,
      largestBlob: null,
    }

    const now = Date.now()
    let oldestAge = 0
    let largestSize = 0

    // 計算統計資料
    for (const [url, info] of this.urlMap) {
      const size = info.metadata?.fileSize || 0
      const age = now - info.createdAt

      stats.totalMemoryUsage += size

      // 群組統計
      const group = info.group || 'ungrouped'
      if (!stats.groupStats[group]) {
        stats.groupStats[group] = {
          count: 0,
          memoryUsage: 0,
          avgAge: 0,
        }
      }

      stats.groupStats[group].count++
      stats.groupStats[group].memoryUsage += size
      stats.groupStats[group].avgAge += age

      // 最舊 URL
      if (age > oldestAge) {
        oldestAge = age
        stats.oldestUrl = { url: url.substring(0, 50) + '...', age }
      }

      // 最大 Blob
      if (size > largestSize) {
        largestSize = size
        stats.largestBlob = { url: url.substring(0, 50) + '...', size }
      }
    }

    // 計算平均年齡
    for (const group of Object.keys(stats.groupStats)) {
      const groupStat = stats.groupStats[group]
      if (groupStat.count > 0) {
        groupStat.avgAge = Math.floor(groupStat.avgAge / groupStat.count)
      }
    }

    return stats
  }

  /**
   * 取得總記憶體使用量
   */
  private getTotalMemoryUsage(): number {
    let total = 0
    for (const info of this.urlMap.values()) {
      total += info.metadata?.fileSize || 0
    }
    return total
  }

  /**
   * 啟動自動清理
   */
  private startAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanup()
      } catch (error) {
        logger.error('自動清理失敗', error as Error)
      }
    }, this.CLEANUP_INTERVAL)

    logger.info('Blob URL 自動清理已啟動', {
      metadata: { interval: this.CLEANUP_INTERVAL },
    })
  }

  /**
   * 停止自動清理
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
      logger.info('Blob URL 自動清理已停止')
    }
  }

  /**
   * 清理所有 URL（通常在應用關閉時調用）
   */
  dispose(): void {
    this.stopAutoCleanup()

    const totalUrls = this.urlMap.size

    for (const url of this.urlMap.keys()) {
      try {
        URL.revokeObjectURL(url)
      } catch (error) {
        logger.warn('URL 撤銷時發生錯誤', {
          metadata: { url: url.substring(0, 30), error: String(error) },
        })
      }
    }

    this.urlMap.clear()
    this.groupMap.clear()

    logger.info('Blob URL Manager 已清理', {
      metadata: { totalUrls },
    })
  }
}

/**
 * 導出單例實例
 */
export const blobURLManager = BlobURLManager.getInstance()

/**
 * 便捷函數：建立受管理的 Blob URL
 */
export function createManagedBlobURL(
  blob: Blob,
  options?: Parameters<BlobURLManager['createURL']>[1]
): string {
  return blobURLManager.createURL(blob, options)
}

/**
 * 便捷函數：撤銷受管理的 Blob URL
 */
export function revokeManagedBlobURL(url: string): boolean {
  return blobURLManager.revokeURL(url)
}

/**
 * 便捷函數：群組化 Blob URL 管理
 */
export class BlobURLGroup {
  constructor(private groupName: string) {}

  create(blob: Blob, metadata?: BlobURLInfo['metadata']): string {
    return blobURLManager.createURL(blob, {
      group: this.groupName,
      metadata,
    })
  }

  revokeAll(): number {
    return blobURLManager.revokeGroup(this.groupName)
  }

  getAll(): string[] {
    return blobURLManager.getGroupURLs(this.groupName)
  }

  getCount(): number {
    return this.getAll().length
  }
}
