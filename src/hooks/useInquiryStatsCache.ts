/**
 * 詢價統計快取管理 Hook
 * 負責 localStorage 的讀寫操作和快取有效性管理
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  InquiryStatsData,
  isCacheValid,
  createCacheKey,
  INQUIRY_STATS_CONSTANTS,
} from '@/lib/inquiry-stats-utils'

export interface UseInquiryStatsCacheOptions {
  cacheKey?: string
  maxAge?: number
  userToken?: string
}

export interface UseInquiryStatsCacheReturn {
  /** 載入快取資料 */
  loadCache: () => InquiryStatsData | null
  /** 儲存資料到快取 */
  saveCache: (data: InquiryStatsData) => void
  /** 清除快取 */
  clearCache: () => void
  /** 檢查快取是否存在且有效 */
  hasCacheValid: () => boolean
  /** 快取鍵值 */
  cacheKey: string
  /** 最後載入的快取時間 */
  lastCacheLoad: Date | null
}

/**
 * 詢價統計快取管理 Hook
 */
export function useInquiryStatsCache(
  options: UseInquiryStatsCacheOptions = {}
): UseInquiryStatsCacheReturn {
  const {
    cacheKey: providedCacheKey,
    maxAge = INQUIRY_STATS_CONSTANTS.CACHE_DURATION,
    userToken,
  } = options

  const [lastCacheLoad, setLastCacheLoad] = useState<Date | null>(null)

  // 建立快取鍵值
  const cacheKey =
    providedCacheKey || createCacheKey(INQUIRY_STATS_CONSTANTS.CACHE_KEY_PREFIX, userToken)

  const cacheKeyRef = useRef(cacheKey)

  // 更新快取鍵值 ref
  useEffect(() => {
    cacheKeyRef.current = cacheKey
  }, [cacheKey])

  /**
   * 載入快取資料
   */
  const loadCache = useCallback((): InquiryStatsData | null => {
    // SSR 環境檢查
    if (typeof window === 'undefined') return null

    try {
      const cached = localStorage.getItem(cacheKeyRef.current)
      if (!cached) return null

      const cacheData = JSON.parse(cached)

      // 驗證快取有效性
      if (!isCacheValid(cacheData, maxAge)) {
        // 快取過期，清除
        localStorage.removeItem(cacheKeyRef.current)
        return null
      }

      setLastCacheLoad(new Date())

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[useInquiryStatsCache] Cache loaded successfully', {
          module: 'useInquiryStatsCache',
          metadata: {
            cacheKey: cacheKeyRef.current,
            timestamp: cacheData.timestamp,
            dataKeys: Object.keys(cacheData.data || {}),
          },
        })
      }

      return cacheData.data
    } catch (err) {
      logger.warn('Failed to load cached stats', {
        module: 'useInquiryStatsCache',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
          cacheKey: cacheKeyRef.current,
        },
      })

      // 清除損壞的快取
      try {
        localStorage.removeItem(cacheKeyRef.current)
      } catch (clearErr) {
        // 靜默處理清除錯誤
      }

      return null
    }
  }, [maxAge])

  /**
   * 儲存資料到快取
   */
  const saveCache = useCallback((data: InquiryStatsData) => {
    // SSR 環境檢查
    if (typeof window === 'undefined') return

    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
      }

      localStorage.setItem(cacheKeyRef.current, JSON.stringify(cacheData))

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[useInquiryStatsCache] Cache saved successfully', {
          module: 'useInquiryStatsCache',
          metadata: {
            cacheKey: cacheKeyRef.current,
            dataKeys: Object.keys(data),
            timestamp: cacheData.timestamp,
          },
        })
      }
    } catch (err) {
      logger.warn('Failed to save stats cache', {
        module: 'useInquiryStatsCache',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
          cacheKey: cacheKeyRef.current,
          dataSize: JSON.stringify(data).length,
        },
      })

      // 如果是空間不足錯誤，嘗試清除其他快取
      if (err instanceof Error && err.message.includes('QuotaExceededError')) {
        try {
          // 清除所有相關快取鍵值
          const keysToRemove: string[] = []
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key && key.startsWith(INQUIRY_STATS_CONSTANTS.CACHE_KEY_PREFIX)) {
              keysToRemove.push(key)
            }
          }

          keysToRemove.forEach(key => localStorage.removeItem(key))

          // 重試儲存
          localStorage.setItem(cacheKeyRef.current, JSON.stringify({ data, timestamp: Date.now() }))
        } catch (retryErr) {
          logger.error(
            'Failed to recover from quota exceeded error',
            retryErr instanceof Error ? retryErr : undefined,
            {
              module: 'useInquiryStatsCache',
            }
          )
        }
      }
    }
  }, [])

  /**
   * 清除快取
   */
  const clearCache = useCallback(() => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(cacheKeyRef.current)
      setLastCacheLoad(null)

      if (process.env.NODE_ENV === 'development') {
        logger.debug('[useInquiryStatsCache] Cache cleared', {
          module: 'useInquiryStatsCache',
          metadata: { cacheKey: cacheKeyRef.current },
        })
      }
    } catch (err) {
      logger.warn('Failed to clear cache', {
        module: 'useInquiryStatsCache',
        metadata: {
          error: err instanceof Error ? err.message : String(err),
          cacheKey: cacheKeyRef.current,
        },
      })
    }
  }, [])

  /**
   * 檢查快取是否存在且有效
   */
  const hasCacheValid = useCallback((): boolean => {
    if (typeof window === 'undefined') return false

    try {
      const cached = localStorage.getItem(cacheKeyRef.current)
      if (!cached) return false

      const cacheData = JSON.parse(cached)
      return isCacheValid(cacheData, maxAge)
    } catch (err) {
      return false
    }
  }, [maxAge])

  return {
    loadCache,
    saveCache,
    clearCache,
    hasCacheValid,
    cacheKey: cacheKeyRef.current,
    lastCacheLoad,
  }
}
