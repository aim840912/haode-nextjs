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
import { cleanup, startAutoCleanup, stopAutoCleanup } from './blob/blob-cleanup'
import {
  createURL as createBlobURL,
  revokeURL as revokeBlobURL,
  addReference,
  removeReference,
  revokeGroup as revokeGroupURLs,
} from './blob/blob-lifecycle'
import { getStats } from './blob/blob-stats'

// ============================================================
// Types & Interfaces (Re-export)
// ============================================================

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

// ============================================================
// BlobURLManager Implementation
// ============================================================

export class BlobURLManager {
  private static instance: BlobURLManager
  private urlMap = new Map<string, BlobURLInfo>()
  private groupMap = new Map<string, Set<string>>()
  private cleanupTimer: NodeJS.Timeout | null = null

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
    this.cleanupTimer = startAutoCleanup(this.urlMap, this.groupMap)

    // 監聽頁面卸載事件，確保清理所有 URL
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup({ dryRun: false })
      })
    }
  }

  // ============================================================
  // Lifecycle Methods (delegate to blob-lifecycle.ts)
  // ============================================================

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
    return createBlobURL(blob, this.urlMap, this.groupMap, options)
  }

  /**
   * 增加引用計數
   */
  addReference(url: string): boolean {
    return addReference(url, this.urlMap)
  }

  /**
   * 減少引用計數
   */
  removeReference(url: string): boolean {
    return removeReference(url, this.urlMap, this.groupMap)
  }

  /**
   * 撤銷特定 URL
   */
  revokeURL(url: string): boolean {
    return revokeBlobURL(url, this.urlMap, this.groupMap)
  }

  /**
   * 撤銷整個群組的 URL
   */
  revokeGroup(group: string): number {
    return revokeGroupURLs(group, this.urlMap, this.groupMap)
  }

  // ============================================================
  // Query Methods
  // ============================================================

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
   * 取得統計資訊 (delegate to blob-stats.ts)
   */
  getStats(): BlobURLStats {
    return getStats(this.urlMap)
  }

  // ============================================================
  // Cleanup Methods (delegate to blob-cleanup.ts)
  // ============================================================

  /**
   * 智慧清理 (delegate to blob-cleanup.ts)
   */
  async cleanup(options?: BlobURLCleanupOptions): Promise<BlobURLCleanupResult> {
    return cleanup(this.urlMap, this.groupMap, options)
  }

  /**
   * 停止自動清理 (delegate to blob-cleanup.ts)
   */
  stopAutoCleanup(): void {
    stopAutoCleanup(this.cleanupTimer)
    this.cleanupTimer = null
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

// ============================================================
// Convenience Exports (backward compatible)
// ============================================================

export { BlobURLGroup } from './blob/blob-group'
