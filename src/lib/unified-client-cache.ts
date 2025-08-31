/**
 * 統一客戶端快取系統
 *
 * 合併 api-cache.ts 和 cache-client.ts 的最佳功能
 * 提供統一的 React Hook 介面和快取管理
 */

'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ClientCacheOptions {
  ttl?: number // Time to live in seconds
  staleWhileRevalidate?: number // Stale while revalidate in seconds
  tags?: string[] // Cache tags for invalidation
  enableRefresh?: boolean // Whether to support manual refresh
}

interface CacheEntry<T> {
  data: T
  timestamp: number
  expires: number
  tags: string[]
  staleWhileRevalidate?: number
}

interface CacheMetrics {
  hits: number
  misses: number
  size: number
  hitRate: string
}

/**
 * 統一客戶端快取管理器
 * 合併兩個現有系統的優點
 */
class UnifiedClientCacheManager {
  private static cache = new Map<string, CacheEntry<unknown>>()
  private static metrics = {
    hits: 0,
    misses: 0,
  }

  /**
   * 取得快取資料
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      this.metrics.misses++
      return null
    }

    const now = Date.now()

    // 檢查是否完全過期
    if (now > entry.expires) {
      this.cache.delete(key)
      this.metrics.misses++
      return null
    }

    this.metrics.hits++
    return entry.data
  }

  /**
   * 檢查是否為陳舊資料（但仍在 stale-while-revalidate 期間內）
   */
  static isStale(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const now = Date.now()
    const staleTime = entry.timestamp + (entry.staleWhileRevalidate || 0) * 1000

    return now > staleTime && now <= entry.expires
  }

  /**
   * 設定快取資料
   */
  static set<T>(key: string, data: T, options: ClientCacheOptions = {}): void {
    const {
      ttl = 300, // 預設5分鐘
      staleWhileRevalidate,
      tags = [],
    } = options

    const now = Date.now()
    const expires = now + ttl * 1000

    this.cache.set(key, {
      data,
      timestamp: now,
      expires,
      tags,
      staleWhileRevalidate,
    })
  }

  /**
   * 刪除特定快取
   */
  static delete(key: string): void {
    this.cache.delete(key)
  }

  /**
   * 基於標籤失效快取
   */
  static invalidateByTags(tags: string[]): number {
    let deletedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.some(tag => tags.includes(tag))) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * 模式刪除（支援萬用字元）
   */
  static deletePattern(pattern: string): number {
    let deletedCount = 0
    const searchPattern = pattern.replace('*', '')

    for (const key of this.cache.keys()) {
      if (key.includes(searchPattern)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  /**
   * 清除所有快取
   */
  static clear(): void {
    this.cache.clear()
  }

  /**
   * 清理過期項目
   */
  static cleanup(): number {
    let cleanedCount = 0
    const now = Date.now()

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    return cleanedCount
  }

  /**
   * 取得快取統計
   */
  static getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses
    return {
      ...this.metrics,
      size: this.cache.size,
      hitRate: total > 0 ? ((this.metrics.hits / total) * 100).toFixed(1) + '%' : '0.0%',
    }
  }

  /**
   * 重設統計
   */
  static resetMetrics(): void {
    this.metrics = { hits: 0, misses: 0 }
  }

  /**
   * 取得所有快取鍵（用於除錯）
   */
  static getKeys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 取得快取詳細資訊
   */
  static getInfo() {
    return {
      size: this.cache.size,
      metrics: this.getMetrics(),
      keys: this.getKeys().slice(0, 10), // 只顯示前10個鍵
    }
  }
}

/**
 * 統一的 React Hook - 取代 useCachedApi 和 useCachedData
 *
 * @param key - 快取鍵
 * @param fetcher - 資料載入函數
 * @param options - 快取選項
 */
export function useUnifiedClientCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: ClientCacheOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStale, setIsStale] = useState(false)

  const { ttl = 300, staleWhileRevalidate, tags = [], enableRefresh = true } = options

  // 載入資料的內部函數
  const loadData = useCallback(
    async (forceRefresh = false) => {
      try {
        setError(null)

        // 如果不是強制重新整理，先檢查快取
        if (!forceRefresh) {
          const cached = UnifiedClientCacheManager.get<T>(key)
          if (cached) {
            setData(cached)
            setLoading(false)
            setIsStale(UnifiedClientCacheManager.isStale(key))
            return cached
          }
        }

        // 如果是陳舊資料，在背景重新驗證時先顯示舊資料
        if (staleWhileRevalidate && !forceRefresh) {
          const staleData = UnifiedClientCacheManager.get<T>(key)
          if (staleData && UnifiedClientCacheManager.isStale(key)) {
            setData(staleData)
            setIsStale(true)
            // 繼續在背景載入新資料，但不顯示 loading
          } else {
            setLoading(true)
          }
        } else {
          setLoading(true)
        }

        // 載入新資料
        const result = await fetcher()

        // 設定快取
        UnifiedClientCacheManager.set(key, result, {
          ttl,
          staleWhileRevalidate,
          tags,
        })

        setData(result)
        setIsStale(false)

        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
        throw err
      } finally {
        setLoading(false)
      }
    },
    [key, fetcher, ttl, staleWhileRevalidate, tags]
  )

  // 手動重新整理
  const refresh = useCallback(async () => {
    return loadData(true)
  }, [loadData])

  // 初始載入
  useEffect(() => {
    let mounted = true

    loadData().catch(() => {
      // 錯誤已在 loadData 中處理
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
    }
  }, [loadData])

  return {
    data,
    loading,
    error,
    isStale,
    refresh: enableRefresh ? refresh : undefined,
  }
}

/**
 * 快取管理 Hook - 取代 useCache
 */
export function useClientCacheManager() {
  const invalidate = useCallback((key: string) => {
    UnifiedClientCacheManager.delete(key)
  }, [])

  const invalidateByTags = useCallback((tags: string[]) => {
    return UnifiedClientCacheManager.invalidateByTags(tags)
  }, [])

  const invalidatePattern = useCallback((pattern: string) => {
    return UnifiedClientCacheManager.deletePattern(pattern)
  }, [])

  const clear = useCallback(() => {
    UnifiedClientCacheManager.clear()
  }, [])

  const cleanup = useCallback(() => {
    return UnifiedClientCacheManager.cleanup()
  }, [])

  const getMetrics = useCallback(() => {
    return UnifiedClientCacheManager.getMetrics()
  }, [])

  const getInfo = useCallback(() => {
    return UnifiedClientCacheManager.getInfo()
  }, [])

  return {
    invalidate,
    invalidateByTags,
    invalidatePattern,
    clear,
    cleanup,
    getMetrics,
    getInfo,
  }
}

/**
 * 裝飾器函數 - 為函數加入快取功能（取代 withCache）
 */
export function withClientCache<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: ClientCacheOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const key = keyGenerator(...args)

    // 嘗試從快取取得
    const cached = UnifiedClientCacheManager.get(key)
    if (cached !== null) {
      return cached
    }

    // 執行原函數
    const result = await fn(...args)

    // 設定快取
    UnifiedClientCacheManager.set(key, result, options)

    return result
  }) as T
}

// 自動清理過期快取（每5分鐘）
declare global {
  var clientCacheCleanupStarted: boolean | undefined
}

if (typeof window !== 'undefined' && !globalThis.clientCacheCleanupStarted) {
  globalThis.clientCacheCleanupStarted = true
  setInterval(
    () => {
      UnifiedClientCacheManager.cleanup()
    },
    5 * 60 * 1000
  )
}

// 匯出管理器以供高級用途
export { UnifiedClientCacheManager }

// 向後相容的預設匯出
export const clientCache = UnifiedClientCacheManager
