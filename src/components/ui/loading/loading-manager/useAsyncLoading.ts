import { useCallback } from 'react'
import { useLoading } from './useLoading'
import type { LoadingProgress } from './types'

/**
 * 自動管理非同步操作載入狀態的 Hook
 *
 * @returns executeWithLoading 函數，自動處理載入狀態
 *
 * @example
 * ```tsx
 * const { executeWithLoading } = useAsyncLoading()
 *
 * const handleSubmit = async () => {
 *   await executeWithLoading(
 *     async (updateProgress) => {
 *       updateProgress({ current: 1, total: 3, message: '驗證中...' })
 *       await validateData()
 *
 *       updateProgress({ current: 2, total: 3, message: '上傳中...' })
 *       await uploadData()
 *
 *       updateProgress({ current: 3, total: 3, message: '完成' })
 *     },
 *     'submit-task',
 *     '處理資料中...'
 *   )
 * }
 * ```
 */
export function useAsyncLoading() {
  const { startLoading, stopLoading, updateProgress } = useLoading()

  const executeWithLoading = useCallback(
    async <T = unknown>(
      asyncFunction: (updateProgress: (progress: Partial<LoadingProgress>) => void) => Promise<T>,
      taskId = `task-${Date.now()}`,
      message = '載入中...',
      options: {
        timeout?: number
        priority?: 'low' | 'normal' | 'high'
        showDelayMs?: number
      } = {}
    ): Promise<T> => {
      try {
        startLoading(taskId, message, options.timeout, options)
        const result = await asyncFunction(progress => updateProgress(taskId, progress))
        return result
      } finally {
        stopLoading(taskId)
      }
    },
    [startLoading, stopLoading, updateProgress]
  )

  return { executeWithLoading }
}
