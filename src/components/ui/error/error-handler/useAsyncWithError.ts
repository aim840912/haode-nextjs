import { useCallback } from 'react'
import { AsyncOperation } from '@/types/infrastructure.types'
import { useAsyncLoading } from '../../loading/LoadingManager'
import { classifyError, getErrorMessage, isRetryableError } from './error-utils'
import { useErrorHandler } from './useErrorHandler'

/**
 * 整合載入和錯誤處理的 Hook
 *
 * 自動管理非同步操作的載入狀態和錯誤處理
 *
 * @returns executeWithErrorHandling 函數
 *
 * @example
 * ```tsx
 * const { executeWithErrorHandling } = useAsyncWithError()
 *
 * const handleSubmit = async () => {
 *   await executeWithErrorHandling(
 *     async () => {
 *       await submitData()
 *     },
 *     {
 *       loadingMessage: '提交中...',
 *       errorMessage: '提交失敗',
 *     }
 *   )
 * }
 * ```
 */
export function useAsyncWithError() {
  const { addError } = useErrorHandler()
  const loadingResult = useAsyncLoading()
  const { executeWithLoading } = loadingResult || {
    executeWithLoading: async (fn: () => Promise<unknown>) => fn(),
  }

  const executeWithErrorHandling = useCallback(
    async <T = unknown>(
      asyncFunction: AsyncOperation<T>,
      options: {
        taskId?: string
        loadingMessage?: string
        errorMessage?: string
        context?: Record<string, unknown>
        timeout?: number
      } = {}
    ): Promise<T> => {
      try {
        return (await executeWithLoading(asyncFunction, options.taskId, options.loadingMessage, {
          timeout: options.timeout,
        })) as T
      } catch (error) {
        const errorType = classifyError(error)
        const errorMessage = getErrorMessage(errorType, options.errorMessage)

        addError({
          type: errorType,
          message: errorMessage,
          originalError: error instanceof Error ? error : new Error(String(error)),
          context: options.context,
          retryable: isRetryableError(errorType),
        })

        throw error
      }
    },
    [addError, executeWithLoading]
  )

  return { executeWithErrorHandling }
}
