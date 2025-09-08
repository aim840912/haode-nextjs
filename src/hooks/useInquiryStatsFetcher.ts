/**
 * 詢價統計資料獲取 Hook
 * 負責 API 通訊、請求去重和認證管理
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase-auth'
import { logger } from '@/lib/logger'
import {
  InquiryStatsData,
  createCacheKey,
  formatUserFriendlyError,
  shouldShowErrorToUser,
  INQUIRY_STATS_CONSTANTS,
} from '@/lib/inquiry-stats-utils'
import { isRateLimitError, isNetworkError } from '@/lib/error-utils'

// 全域請求去重機制
interface PendingRequest {
  promise: Promise<InquiryStatsData>
  timestamp: number
}

const globalRequestCache = new Map<string, PendingRequest>()

export interface UseInquiryStatsFetcherOptions {
  /** API 端點 */
  endpoint?: string
  /** 請求參數 */
  params?: Record<string, string>
  /** 是否在開發環境 */
  isDevelopment?: boolean
}

export interface UseInquiryStatsFetcherReturn {
  /** 發起 API 請求 */
  fetchStats: (signal?: AbortSignal) => Promise<InquiryStatsData>
  /** 是否正在載入 */
  loading: boolean
  /** 錯誤訊息 */
  error: string | null
  /** 最後更新時間 */
  lastUpdated: Date | null
  /** 清除錯誤狀態 */
  clearError: () => void
  /** 設定載入狀態 */
  setLoading: (loading: boolean) => void
}

/**
 * 詢價統計資料獲取 Hook
 */
export function useInquiryStatsFetcher(
  options: UseInquiryStatsFetcherOptions = {}
): UseInquiryStatsFetcherReturn {
  const {
    endpoint = '/api/inquiries/stats',
    params = { timeframe: '30' },
    isDevelopment = process.env.NODE_ENV === 'development',
  } = options

  // 狀態管理
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Ref 用於防止狀態更新在組件卸載後執行
  const mountedRef = useRef(true)

  /**
   * 清除錯誤狀態
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 建立請求 URL
   */
  const buildRequestUrl = useCallback(() => {
    const url = new URL(endpoint, window.location.origin)
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
    return url.toString()
  }, [endpoint, params])

  /**
   * 執行 API 請求
   */
  const executeRequest = useCallback(
    async (url: string, token: string, signal?: AbortSignal): Promise<InquiryStatsData> => {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`

        // 記錄詳細錯誤資訊
        if (isDevelopment) {
          logger.error('[useInquiryStatsFetcher] API Error', undefined, {
            module: 'useInquiryStatsFetcher',
            metadata: {
              status: response.status,
              statusText: response.statusText,
              errorData,
              url: response.url,
            },
          })
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()

      if (result.success && result.data?.summary) {
        return result.data.summary
      } else {
        throw new Error('統計資料格式錯誤')
      }
    },
    [isDevelopment]
  )

  /**
   * 清理過期的請求快取
   */
  const cleanupExpiredRequests = useCallback(() => {
    const now = Date.now()
    const expiredKeys: string[] = []

    for (const [key, request] of globalRequestCache.entries()) {
      if (now - request.timestamp > INQUIRY_STATS_CONSTANTS.REQUEST_DEDUP_DURATION) {
        expiredKeys.push(key)
      }
    }

    expiredKeys.forEach(key => globalRequestCache.delete(key))

    if (isDevelopment && expiredKeys.length > 0) {
      logger.debug(`[useInquiryStatsFetcher] Cleaned up ${expiredKeys.length} expired requests`, {
        module: 'useInquiryStatsFetcher',
      })
    }
  }, [isDevelopment])

  /**
   * 主要的統計資料獲取函數
   */
  const fetchStats = useCallback(
    async (signal?: AbortSignal): Promise<InquiryStatsData> => {
      if (!mountedRef.current) {
        throw new Error('Component unmounted')
      }

      setLoading(true)
      setError(null)

      let dedupCacheKey = ''

      try {
        // 取得認證 session
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          throw new Error('認證失敗')
        }

        // 建立請求去重鍵值
        dedupCacheKey = createCacheKey('inquiry-stats-request', session.access_token)

        // 清理過期請求
        cleanupExpiredRequests()

        // 檢查是否有正在進行的相同請求
        const existingRequest = globalRequestCache.get(dedupCacheKey)
        if (existingRequest) {
          if (isDevelopment) {
            logger.debug('[useInquiryStatsFetcher] Using deduplicated request result', {
              module: 'useInquiryStatsFetcher',
              metadata: { cacheKey: dedupCacheKey },
            })
          }

          const result = await existingRequest.promise

          if (mountedRef.current) {
            setLastUpdated(new Date())
            setLoading(false)
          }

          return result
        }

        // 建立新的請求 Promise
        const url = buildRequestUrl()
        const requestPromise = executeRequest(url, session.access_token, signal)

        // 將請求加入去重快取
        globalRequestCache.set(dedupCacheKey, {
          promise: requestPromise,
          timestamp: Date.now(),
        })

        // 等待請求完成
        const result = await requestPromise

        // 請求成功後清理快取
        globalRequestCache.delete(dedupCacheKey)

        if (mountedRef.current) {
          setLastUpdated(new Date())
          setLoading(false)
        }

        if (isDevelopment) {
          logger.debug('[useInquiryStatsFetcher] Successfully fetched stats', {
            module: 'useInquiryStatsFetcher',
            metadata: {
              stats: result,
              url,
              responseTime: Date.now() - (globalRequestCache.get(dedupCacheKey)?.timestamp || 0),
            },
          })
        }

        return result
      } catch (err) {
        // 請求失敗時清理快取
        if (dedupCacheKey) {
          globalRequestCache.delete(dedupCacheKey)
        }

        // 如果是 AbortError，不處理
        if (err instanceof Error && err.name === 'AbortError') {
          if (mountedRef.current) {
            setLoading(false)
          }
          throw err
        }

        const errorMessage = err instanceof Error ? err.message : '未知錯誤'
        const isRateLimit = isRateLimitError(errorMessage)
        const isNetwork = isNetworkError(errorMessage)
        const userFriendlyError = formatUserFriendlyError(err)

        logger.error(
          '[useInquiryStatsFetcher] Error fetching inquiry stats',
          err instanceof Error ? err : undefined,
          {
            module: 'useInquiryStatsFetcher',
            metadata: {
              isRateLimitError: isRateLimit,
              isNetworkError: isNetwork,
              originalError: errorMessage,
              userFriendlyError,
            },
          }
        )

        if (mountedRef.current) {
          setLoading(false)

          // 只有應該顯示給使用者的錯誤才設定錯誤狀態
          if (shouldShowErrorToUser(err)) {
            setError(userFriendlyError)
          } else {
            // 靜默處理的錯誤（如速率限制、一般網路錯誤）
            if (isDevelopment) {
              logger.debug('[useInquiryStatsFetcher] Error silently handled', {
                module: 'useInquiryStatsFetcher',
                metadata: { errorType: isRateLimit ? 'rate-limit' : 'network', errorMessage },
              })
            }
          }
        }

        throw err
      }
    },
    [buildRequestUrl, executeRequest, cleanupExpiredRequests, isDevelopment]
  )

  /**
   * 元件卸載時清理
   */
  const cleanup = useCallback(() => {
    mountedRef.current = false
  }, [])

  // 在 hook 返回中暴露 cleanup 函數供外部使用
  return {
    fetchStats,
    loading,
    error,
    lastUpdated,
    clearError,
    setLoading,
    // 隱藏的 cleanup 函數，供內部使用
    _cleanup: cleanup,
  } as UseInquiryStatsFetcherReturn & { _cleanup: () => void }
}
