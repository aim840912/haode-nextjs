/**
 * 輪詢管理 Hook
 * 負責智能輪詢、頁面可見性檢測和使用者活動追蹤
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '@/lib/logger'
import {
  InquiryStatsData,
  calculateDynamicPollingInterval,
  PollingConfig,
  INQUIRY_STATS_CONSTANTS,
} from '@/lib/inquiry-stats-utils'

export interface UsePollingManagerOptions {
  /** 基礎輪詢間隔（毫秒） */
  baseInterval: number
  /** 是否啟用輪詢 */
  enabled: boolean
  /** 是否在開發環境 */
  isDevelopment?: boolean
  /** 輪詢回調函數 */
  onPoll: (signal: AbortSignal) => Promise<void> | void
  /** 頁面變為可見時的回調 */
  onVisibilityChange?: (visible: boolean) => void
}

export interface UsePollingManagerReturn {
  /** 頁面是否可見 */
  isVisible: boolean
  /** 最後活動時間 */
  lastActivity: number
  /** 開始輪詢 */
  startPolling: (stats?: InquiryStatsData | null, consecutiveErrors?: number) => void
  /** 停止輪詢 */
  stopPolling: () => void
  /** 重置輪詢（清除當前定時器並重新開始） */
  resetPolling: (stats?: InquiryStatsData | null, consecutiveErrors?: number) => void
  /** 更新活動時間 */
  updateActivity: () => void
  /** 當前輪詢間隔 */
  currentInterval: number | null
  /** 輪詢是否活躍 */
  isPolling: boolean
}

/**
 * 輪詢管理 Hook
 */
export function usePollingManager(options: UsePollingManagerOptions): UsePollingManagerReturn {
  const {
    baseInterval,
    enabled,
    isDevelopment = process.env.NODE_ENV === 'development',
    onPoll,
    onVisibilityChange,
  } = options

  // 狀態管理
  const [isVisible, setIsVisible] = useState(() =>
    typeof window !== 'undefined' ? !document.hidden : true
  )
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [currentInterval, setCurrentInterval] = useState<number | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  // Refs
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * 更新使用者活動時間
   */
  const updateActivity = useCallback(() => {
    setLastActivity(Date.now())
  }, [])

  /**
   * 計算目前應該使用的輪詢間隔
   */
  const getPollingInterval = useCallback(
    (stats?: InquiryStatsData | null, consecutiveErrors = 0) => {
      const config: PollingConfig = {
        baseRefreshInterval: baseInterval,
        isVisible,
        lastActivity,
        stats: stats || null,
        consecutiveErrors,
        isDevelopment,
      }

      return calculateDynamicPollingInterval(config)
    },
    [baseInterval, isVisible, lastActivity, isDevelopment]
  )

  /**
   * 停止輪詢
   */
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      setIsPolling(false)
      setCurrentInterval(null)

      if (isDevelopment) {
        logger.debug('[usePollingManager] Polling stopped')
      }
    }

    // 取消正在進行的請求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [isDevelopment])

  /**
   * 開始輪詢
   */
  const startPolling = useCallback(
    (stats?: InquiryStatsData | null, consecutiveErrors = 0) => {
      if (!enabled) return

      // 清除舊的定時器
      stopPolling()

      // 計算輪詢間隔
      const interval = getPollingInterval(stats, consecutiveErrors)

      if (!interval) {
        // 不需要輪詢（頁面隱藏或錯誤太多）
        setCurrentInterval(null)
        return
      }

      setCurrentInterval(interval)
      setIsPolling(true)

      // 建立新的定時器
      intervalRef.current = setInterval(() => {
        if (!isVisible) return

        // 建立新的 AbortController
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        abortControllerRef.current = new AbortController()

        // 執行輪詢回調
        try {
          const result = onPoll(abortControllerRef.current.signal)

          // 如果返回 Promise，等待完成
          if (result && typeof result.then === 'function') {
            result.catch(err => {
              if (err.name !== 'AbortError') {
                logger.warn('[usePollingManager] Polling callback error', {
                  module: 'usePollingManager',
                  metadata: { error: err instanceof Error ? err.message : String(err) },
                })
              }
            })
          }
        } catch (err) {
          logger.warn('[usePollingManager] Polling callback error', {
            module: 'usePollingManager',
            metadata: { error: err instanceof Error ? err.message : String(err) },
          })
        }

        if (isDevelopment) {
          logger.debug(`[usePollingManager] Polling executed with interval: ${interval}ms`, {
            module: 'usePollingManager',
            metadata: {
              interval,
              isVisible,
              timeSinceLastActivity: Date.now() - lastActivity,
            },
          })
        }
      }, interval)

      if (isDevelopment) {
        logger.debug(`[usePollingManager] Polling started with interval: ${interval}ms`, {
          module: 'usePollingManager',
          metadata: { interval, enabled, isVisible },
        })
      }
    },
    [enabled, getPollingInterval, stopPolling, isVisible, onPoll, isDevelopment]
  )

  /**
   * 重置輪詢
   */
  const resetPolling = useCallback(
    (stats?: InquiryStatsData | null, consecutiveErrors = 0) => {
      stopPolling()
      if (enabled) {
        // 使用 setTimeout 確保狀態更新後再開始
        setTimeout(() => startPolling(stats, consecutiveErrors), 0)
      }
    },
    [stopPolling, startPolling, enabled]
  )

  /**
   * 頁面可見性變化處理
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleVisibilityChange = () => {
      const visible = !document.hidden
      setIsVisible(visible)

      if (isDevelopment) {
        logger.debug(`[usePollingManager] Visibility changed: ${visible}`, {
          module: 'usePollingManager',
        })
      }

      // 頁面變為可見時更新活動時間
      if (visible) {
        updateActivity()
      }

      // 執行外部回調
      onVisibilityChange?.(visible)
    }

    // 註冊事件監聽
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // 移除 onVisibilityChange 依賴，避免無限循環
  }, [updateActivity, isDevelopment])

  /**
   * 使用者活動檢測
   */
  useEffect(() => {
    if (typeof window === 'undefined') return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    const handleUserActivity = () => {
      updateActivity()
    }

    // 註冊所有活動事件
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [updateActivity])

  /**
   * 可見性變化時重新計算輪詢
   */
  useEffect(() => {
    if (enabled && isPolling) {
      // 如果頁面隱藏，停止輪詢
      if (!isVisible) {
        stopPolling()
      } else {
        // 頁面變為可見時重新開始輪詢
        // 直接內聯邏輯避免 resetPolling 的函數依賴
        stopPolling()
        if (enabled) {
          setTimeout(() => startPolling(), 0)
        }
      }
    }
  }, [isVisible, enabled, isPolling, stopPolling, startPolling])

  /**
   * 清理資源
   */
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [stopPolling])

  return {
    isVisible,
    lastActivity,
    startPolling,
    stopPolling,
    resetPolling,
    updateActivity,
    currentInterval,
    isPolling,
  }
}
