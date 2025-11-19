/**
 * 快取工具函數
 * 包含包裝器函數和自動清理機制
 */

import type { CacheOptions } from './cache-types'

// 全域型別宣告
declare global {
  var unifiedCacheCleanupStarted: boolean | undefined
}

/**
 * 高階函數包裝器，提供快取功能
 * 支援標籤系統和自動失效
 */
export function createCacheWrapper<T>(
  getCache: (key: string) => Promise<T | null>,
  setCache: (key: string, data: T, options: CacheOptions) => Promise<void>
) {
  return function withCache(
    fetcher: () => Promise<T>,
    cacheKey: string,
    options: CacheOptions = {}
  ) {
    return async (): Promise<T> => {
      // 嘗試從快取取得
      const cached = await getCache(cacheKey)
      if (cached !== null) {
        return cached
      }

      // 載入新資料
      const data = await fetcher()

      // 設定快取
      await setCache(cacheKey, data, options)

      return data
    }
  }
}

/**
 * 設定快取自動清理機制
 * 定期清理過期的記憶體快取
 */
export function setupCacheCleanup(cleanExpired: () => void, intervalMs: number = 5 * 60 * 1000) {
  if (typeof globalThis !== 'undefined' && !globalThis.unifiedCacheCleanupStarted) {
    globalThis.unifiedCacheCleanupStarted = true
    setInterval(() => {
      cleanExpired()
    }, intervalMs)
  }
}
