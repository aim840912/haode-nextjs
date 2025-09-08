/**
 * 重試管理 Hook
 * 負責智能重試邏輯、錯誤分類和重試狀態管理
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { logger } from '@/lib/logger'
import {
  calculateRetryDelay,
  formatUserFriendlyError,
  shouldShowErrorToUser,
  INQUIRY_STATS_CONSTANTS,
} from '@/lib/inquiry-stats-utils'
import { isRateLimitError, isNetworkError, getUserFriendlyErrorMessage } from '@/lib/error-utils'

export interface UseRetryManagerOptions {
  /** 最大重試次數 */
  maxRetries?: number
  /** 是否在開發環境 */
  isDevelopment?: boolean
  /** 重試成功回調 */
  onRetrySuccess?: () => void
  /** 重試失敗回調 */
  onRetryFailure?: (error: unknown) => void
  /** 最大重試失敗回調 */
  onMaxRetriesReached?: (error: unknown) => void
}

export interface UseRetryManagerReturn {
  /** 當前重試次數 */
  retryCount: number
  /** 是否正在重試 */
  isRetrying: boolean
  /** 連續錯誤次數 */
  consecutiveErrors: number
  /** 最後錯誤訊息 */
  lastErrorMessage: string | null
  /** 使用者友好的錯誤訊息 */
  userError: string | null
  /** 執行重試 */
  executeWithRetry: <T>(
    operation: (signal?: AbortSignal) => Promise<T>,
    signal?: AbortSignal
  ) => Promise<T>
  /** 手動重試 */
  retry: <T>(operation: (signal?: AbortSignal) => Promise<T>, signal?: AbortSignal) => Promise<T>
  /** 重置重試狀態 */
  reset: () => void
  /** 清除用戶錯誤 */
  clearUserError: () => void
  /** 增加連續錯誤計數 */
  incrementConsecutiveErrors: () => void
  /** 重置連續錯誤計數 */
  resetConsecutiveErrors: () => void
}

/**
 * 重試管理 Hook
 */
export function useRetryManager(options: UseRetryManagerOptions = {}): UseRetryManagerReturn {
  const {
    maxRetries = INQUIRY_STATS_CONSTANTS.MAX_RETRY_ATTEMPTS,
    isDevelopment = process.env.NODE_ENV === 'development',
    onRetrySuccess,
    onRetryFailure,
    onMaxRetriesReached,
  } = options

  // 狀態管理
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)
  const [consecutiveErrors, setConsecutiveErrors] = useState(0)
  const [lastErrorMessage, setLastErrorMessage] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  // Refs
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  /**
   * 清除重試定時器
   */
  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
      retryTimeoutRef.current = null
    }
  }, [])

  /**
   * 重置重試狀態
   */
  const reset = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
    setLastErrorMessage(null)
    setUserError(null)
    clearRetryTimeout()
  }, [clearRetryTimeout])

  /**
   * 重置成功狀態（保留連續錯誤計數）
   */
  const resetSuccessState = useCallback(() => {
    setRetryCount(0)
    setIsRetrying(false)
    setLastErrorMessage(null)
    setUserError(null)
    clearRetryTimeout()
  }, [clearRetryTimeout])

  /**
   * 清除用戶錯誤
   */
  const clearUserError = useCallback(() => {
    setUserError(null)
  }, [])

  /**
   * 增加連續錯誤計數
   */
  const incrementConsecutiveErrors = useCallback(() => {
    setConsecutiveErrors(prev => prev + 1)
  }, [])

  /**
   * 重置連續錯誤計數
   */
  const resetConsecutiveErrors = useCallback(() => {
    setConsecutiveErrors(0)
  }, [])

  /**
   * 處理錯誤並決定是否重試
   */
  const handleError = useCallback(
    async <T>(
      error: unknown,
      operation: (signal?: AbortSignal) => Promise<T>,
      signal?: AbortSignal,
      currentRetryCount: number = retryCount
    ): Promise<T> => {
      if (!mountedRef.current) {
        throw error
      }

      // 如果是取消錯誤，直接拋出
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      const errorMessage = error instanceof Error ? error.message : '未知錯誤'
      const isRateLimit = isRateLimitError(errorMessage)
      const isNetwork = isNetworkError(errorMessage)

      // 更新錯誤狀態
      setLastErrorMessage(errorMessage)
      incrementConsecutiveErrors()

      // 記錄錯誤
      logger.error(
        '[useRetryManager] Operation failed',
        error instanceof Error ? error : undefined,
        {
          module: 'useRetryManager',
          metadata: {
            retryCount: currentRetryCount,
            consecutiveErrors: consecutiveErrors + 1,
            isRateLimitError: isRateLimit,
            isNetworkError: isNetwork,
          },
        }
      )

      // 處理特殊錯誤類型（速率限制和網路錯誤）
      if (isRateLimit || isNetwork) {
        // 對於速率限制和網路錯誤，完全靜默處理
        if (userError && shouldShowErrorToUser(error)) {
          setUserError(null) // 清除之前的錯誤
        }

        // 實作自動重試邏輯
        if (currentRetryCount < maxRetries) {
          const delay = calculateRetryDelay({
            retryAttempt: currentRetryCount,
            isRateLimited: isRateLimit,
          })

          setRetryCount(currentRetryCount + 1)
          setIsRetrying(true)

          if (isDevelopment) {
            logger.debug(
              `[useRetryManager] Retrying in ${delay}ms (attempt ${currentRetryCount + 1}/${maxRetries})`,
              {
                module: 'useRetryManager',
                metadata: {
                  delay,
                  retryAttempt: currentRetryCount + 1,
                  errorType: isRateLimit ? 'rate-limit' : 'network',
                },
              }
            )
          }

          return new Promise<T>((resolve, reject) => {
            retryTimeoutRef.current = setTimeout(async () => {
              if (signal?.aborted || !mountedRef.current) {
                reject(new Error('AbortError'))
                return
              }

              try {
                const result = await operation(signal)

                if (mountedRef.current) {
                  resetSuccessState()
                  resetConsecutiveErrors()
                  onRetrySuccess?.()
                }

                resolve(result)
              } catch (retryError) {
                if (mountedRef.current) {
                  onRetryFailure?.(retryError)
                  // 遞迴處理重試錯誤
                  try {
                    const result = await handleError(
                      retryError,
                      operation,
                      signal,
                      currentRetryCount + 1
                    )
                    resolve(result)
                  } catch (finalError) {
                    reject(finalError)
                  }
                } else {
                  reject(retryError)
                }
              }
            }, delay)
          })
        } else {
          // 超過重試次數，靜默處理不顯示錯誤
          logger.warn('[useRetryManager] Max retry attempts reached', {
            module: 'useRetryManager',
            metadata: {
              retryCount: currentRetryCount,
              errorMessage,
              errorType: isRateLimit ? 'rate-limit' : 'network',
            },
          })

          setIsRetrying(false)
          onMaxRetriesReached?.(error)
          throw error
        }
      } else {
        // 其他錯誤：使用用戶友好的錯誤訊息並實施去重機制
        const friendlyMessage =
          getUserFriendlyErrorMessage(errorMessage) || formatUserFriendlyError(error)

        if (
          shouldShowErrorToUser(error) &&
          friendlyMessage &&
          lastErrorMessage !== friendlyMessage
        ) {
          setUserError(friendlyMessage)
          setLastErrorMessage(friendlyMessage)
        }

        setIsRetrying(false)
        throw error
      }
    },
    [
      retryCount,
      consecutiveErrors,
      userError,
      lastErrorMessage,
      maxRetries,
      isDevelopment,
      incrementConsecutiveErrors,
      resetSuccessState,
      resetConsecutiveErrors,
      onRetrySuccess,
      onRetryFailure,
      onMaxRetriesReached,
    ]
  )

  /**
   * 執行帶重試的操作
   */
  const executeWithRetry = useCallback(
    async <T>(
      operation: (signal?: AbortSignal) => Promise<T>,
      signal?: AbortSignal
    ): Promise<T> => {
      try {
        const result = await operation(signal)

        // 操作成功，重置狀態
        if (mountedRef.current) {
          resetSuccessState()
          resetConsecutiveErrors()
        }

        return result
      } catch (error) {
        return handleError(error, operation, signal, 0)
      }
    },
    [handleError, resetSuccessState, resetConsecutiveErrors]
  )

  /**
   * 手動重試
   */
  const retry = useCallback(
    async <T>(
      operation: (signal?: AbortSignal) => Promise<T>,
      signal?: AbortSignal
    ): Promise<T> => {
      // 重置重試相關狀態但保留連續錯誤計數
      setRetryCount(0)
      setIsRetrying(false)
      setLastErrorMessage(null)
      setUserError(null)
      clearRetryTimeout()

      return executeWithRetry(operation, signal)
    },
    [executeWithRetry, clearRetryTimeout]
  )

  /**
   * 組件卸載時清理
   */
  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      clearRetryTimeout()
    }
  }, [clearRetryTimeout])

  return {
    retryCount,
    isRetrying,
    consecutiveErrors,
    lastErrorMessage,
    userError,
    executeWithRetry,
    retry,
    reset,
    clearUserError,
    incrementConsecutiveErrors,
    resetConsecutiveErrors,
  }
}
