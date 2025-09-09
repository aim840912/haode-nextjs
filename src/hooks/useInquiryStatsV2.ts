/**
 * 詢價統計資料 Hook V2
 * 重構版本：組合多個專注的子 hooks，保持向後相容性
 *
 * 架構改進：
 * - useInquiryStatsCache: 快取管理
 * - useInquiryStatsFetcher: API 通訊和請求去重
 * - usePollingManager: 智能輪詢
 * - useRetryManager: 重試和錯誤處理
 *
 * 優化功能：
 * 1. 頁面可見性檢測 - 隱藏時停止輪詢
 * 2. 動態輪詢間隔 - 根據使用者活動和未讀狀態調整
 * 3. localStorage 快取 - 減少初始載入 API 呼叫
 * 4. 使用者活動追蹤 - 智能調整輪詢頻率
 * 5. 全域請求去重 - 防止多個實例同時請求
 *
 * 輪詢策略（已優化以節省 Vercel 流量）：
 * - 有未讀詢價：2 分鐘
 * - 無未讀，活躍 < 5 分鐘：2 分鐘
 * - 無未讀，活躍 5-10 分鐘：5 分鐘
 * - 無未讀，閒置 > 10 分鐘：10 分鐘
 * - 頁面隱藏：停止輪詢
 * - 開發環境：更長間隔或禁用
 *
 * 預期資源節省：90%+
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { logger } from '@/lib/logger'

// 導入子 hooks
import { useInquiryStatsCache } from './useInquiryStatsCache'
import { useInquiryStatsFetcher } from './useInquiryStatsFetcher'
import { usePollingManager } from './usePollingManager'
import { useRetryManager } from './useRetryManager'

// 導入類型和工具
import { InquiryStatsData, INQUIRY_STATS_CONSTANTS } from '@/lib/inquiry-stats-utils'

/**
 * Hook 返回類型（保持向後相容）
 */
export interface UseInquiryStatsReturn {
  stats: InquiryStatsData | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  lastUpdated: Date | null
  retryCount: number
  isRetrying: boolean
}

/**
 * 詢價統計資料 Hook V2
 */
export function useInquiryStats(
  baseRefreshInterval = process.env.NODE_ENV === 'production' ? 120000 : 300000
): UseInquiryStatsReturn {
  const { user } = useAuth()
  const [stats, setStats] = useState<InquiryStatsData | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // 檢查是否為管理員
  const isAdmin = user?.role === 'admin'
  const isDevelopment = process.env.NODE_ENV === 'development'

  // 使用子 hooks
  const cache = useInquiryStatsCache({
    userToken: user?.id,
  })

  const fetcher = useInquiryStatsFetcher({
    isDevelopment,
  })

  const retryManager = useRetryManager({
    isDevelopment,
    onRetrySuccess: () => {
      if (isDevelopment) {
        logger.debug('[useInquiryStats] Retry succeeded', {
          module: 'useInquiryStats',
          metadata: { retryCount: retryManager.retryCount },
        })
      }
    },
    onMaxRetriesReached: error => {
      logger.warn('[useInquiryStats] Max retries reached, giving up', {
        module: 'useInquiryStats',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          consecutiveErrors: retryManager.consecutiveErrors,
        },
      })
    },
  })

  // 輪詢操作函數
  const pollingOperation = useCallback(
    async (signal?: AbortSignal) => {
      if (!isAdmin) return

      try {
        const result = await retryManager.executeWithRetry(
          retrySignal => fetcher.fetchStats(retrySignal || signal),
          signal
        )

        // 更新狀態
        setStats(result)
        setLastUpdated(new Date())

        // 儲存到快取
        cache.saveCache(result)

        // 重置連續錯誤計數
        retryManager.resetConsecutiveErrors()

        if (isDevelopment) {
          logger.debug('[useInquiryStats] Successfully fetched and cached stats', {
            module: 'useInquiryStats',
            metadata: { stats: result },
          })
        }
      } catch (error) {
        // 錯誤已經由 retryManager 處理
        if (error instanceof Error && error.name === 'AbortError') {
          return // 忽略取消錯誤
        }

        // 其他錯誤記錄但不影響輪詢
        if (isDevelopment) {
          logger.debug('[useInquiryStats] Polling operation failed', {
            module: 'useInquiryStats',
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              retryCount: retryManager.retryCount,
              consecutiveErrors: retryManager.consecutiveErrors,
            },
          })
        }
      }
    },
    [isAdmin, retryManager, fetcher, cache, isDevelopment]
  )

  const pollingManager = usePollingManager({
    baseInterval: baseRefreshInterval,
    enabled: isAdmin,
    isDevelopment,
    onPoll: pollingOperation,
    onVisibilityChange: visible => {
      if (visible && isAdmin) {
        // 頁面變為可見時立即重新整理
        pollingOperation()
      }
    },
  })

  /**
   * 手動重新整理函數
   */
  const refresh = useCallback(async (): Promise<void> => {
    if (!isAdmin) return

    // 重置重試狀態
    retryManager.reset()

    // 重新開始輪詢（使用當前狀態而不是依賴）
    pollingManager.resetPolling(stats, retryManager.consecutiveErrors)

    // 立即執行一次
    try {
      await pollingOperation()
    } catch (error) {
      // 錯誤已經由 pollingOperation 處理
      if (isDevelopment) {
        logger.debug('[useInquiryStats] Manual refresh failed', {
          module: 'useInquiryStats',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        })
      }
    }
  }, [isAdmin, isDevelopment]) // 只保留穩定的依賴

  /**
   * 初始化效果：載入快取資料和開始輪詢
   */
  useEffect(() => {
    if (!isAdmin) {
      // 非管理員清空狀態
      setStats(null)
      setLastUpdated(null)
      retryManager.reset()
      pollingManager.stopPolling()
      return
    }

    // 嘗試載入快取資料
    const cachedStats = cache.loadCache()
    if (cachedStats) {
      setStats(cachedStats)
      setLastUpdated(new Date())

      if (isDevelopment) {
        logger.debug('[useInquiryStats] Loaded from cache', {
          module: 'useInquiryStats',
          metadata: { cachedStats },
        })
      }
    }

    // 開始輪詢（startPolling 會自動執行第一次請求）
    pollingManager.startPolling(cachedStats, retryManager.consecutiveErrors)
  }, [isAdmin, user?.id]) // 只在 isAdmin 和 user.id 變化時重新執行

  /**
   * 輪詢間隔變化效果 - 只在關鍵狀態變化時重新計算
   */
  useEffect(() => {
    if (isAdmin && pollingManager.isPolling) {
      // 重新計算並應用輪詢間隔
      pollingManager.resetPolling(stats, retryManager.consecutiveErrors)
    }
  }, [
    isAdmin,
    stats?.unread_count,
    retryManager.consecutiveErrors,
    // 移除 pollingManager.isVisible 和 pollingManager.lastActivity
    // 這些頻繁變化的值會造成不必要的重設
  ])

  /**
   * 清理效果
   */
  useEffect(() => {
    return () => {
      pollingManager.stopPolling()
      retryManager.reset()
    }
  }, [])

  return {
    stats,
    loading: fetcher.loading || retryManager.isRetrying,
    error: retryManager.userError || fetcher.error,
    refresh,
    lastUpdated,
    retryCount: retryManager.retryCount,
    isRetrying: retryManager.isRetrying,
  }
}
