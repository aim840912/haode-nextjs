/**
 * useLoadingManager - 統一的 loading 狀態管理 hook
 * 提供標準化的 loading、error 狀態管理和重試機制
 */

import { useState, useCallback } from 'react'
import { logger } from '@/lib/logger'

export interface UseLoadingManagerOptions {
  /**
   * 模組名稱，用於日誌記錄
   */
  module?: string

  /**
   * 初始 loading 狀態
   * @default false
   */
  initialLoading?: boolean

  /**
   * 錯誤回調函數
   */
  onError?: (error: Error) => void

  /**
   * 成功回調函數
   */
  onSuccess?: () => void
}

export interface UseLoadingManagerReturn<T> {
  /**
   * 當前 loading 狀態
   */
  isLoading: boolean

  /**
   * 當前錯誤訊息
   */
  error: string | null

  /**
   * 資料
   */
  data: T | null

  /**
   * 設定資料
   */
  setData: (data: T | null) => void

  /**
   * 執行非同步操作
   */
  execute: <R = T>(
    asyncFn: () => Promise<R>,
    options?: {
      onSuccess?: (data: R) => void
      onError?: (error: Error) => void
      logAction?: string
    }
  ) => Promise<R | undefined>

  /**
   * 重設狀態
   */
  reset: () => void

  /**
   * 設定錯誤
   */
  setError: (error: string | null) => void

  /**
   * 清除錯誤
   */
  clearError: () => void
}

/**
 * useLoadingManager - 統一的 loading 狀態管理
 *
 * @example
 * ```tsx
 * const { isLoading, error, data, execute } = useLoadingManager<Product[]>({
 *   module: 'ProductsPage'
 * })
 *
 * const loadProducts = async () => {
 *   await execute(
 *     () => fetchProducts(),
 *     { logAction: 'loadProducts' }
 *   )
 * }
 * ```
 */
export function useLoadingManager<T = unknown>(
  options: UseLoadingManagerOptions = {}
): UseLoadingManagerReturn<T> {
  const {
    module = 'Unknown',
    initialLoading = false,
    onError: globalOnError,
    onSuccess: globalOnSuccess,
  } = options

  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setErrorState] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const setError = useCallback((err: string | null) => {
    setErrorState(err)
  }, [])

  const clearError = useCallback(() => {
    setErrorState(null)
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setErrorState(null)
    setData(null)
  }, [])

  const execute = useCallback(
    async <R = T>(
      asyncFn: () => Promise<R>,
      executeOptions?: {
        onSuccess?: (data: R) => void
        onError?: (error: Error) => void
        logAction?: string
      }
    ): Promise<R | undefined> => {
      const { onSuccess, onError, logAction = 'execute' } = executeOptions || {}

      setIsLoading(true)
      setErrorState(null)

      try {
        const result = await asyncFn()

        // 如果 result 的類型與 T 相容，設定 data
        setData(result as unknown as T)

        onSuccess?.(result)
        globalOnSuccess?.()

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error')
        const errorMessage = error.message

        logger.error(`${module}: ${logAction} failed`, error, {
          module,
          action: logAction,
        })

        setErrorState(errorMessage)
        onError?.(error)
        globalOnError?.(error)

        return undefined
      } finally {
        setIsLoading(false)
      }
    },
    [module, globalOnError, globalOnSuccess]
  )

  return {
    isLoading,
    error,
    data,
    setData,
    execute,
    reset,
    setError,
    clearError,
  }
}
