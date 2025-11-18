import React, { useEffect, useState } from 'react'
import { LoadingSpinner } from '../LoadingSpinner'
import { useLoading } from './useLoading'
import type { PageLoadingProps } from './types'

/**
 * 頁面級載入狀態元件
 *
 * 全螢幕載入畫面，適用於：
 * - 頁面初始載入
 * - 路由切換
 * - 重大資料載入
 *
 * @example
 * ```tsx
 * <PageLoading
 *   message="頁面載入中..."
 *   showProgress={true}
 * />
 * ```
 */
export const PageLoading = React.memo<PageLoadingProps>(
  ({ message = '頁面載入中...', showProgress = false }) => {
    const { currentTasks } = useLoading()
    const [progress, setProgress] = useState(0)

    useEffect(() => {
      if (!showProgress || currentTasks.length === 0) return

      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 15
          return newProgress > 90 ? 90 : newProgress
        })
      }, 200)

      return () => clearInterval(interval)
    }, [showProgress, currentTasks.length])

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-6">
            <LoadingSpinner size="xl" />
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">{message}</h2>

          {showProgress && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className="bg-amber-600 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {currentTasks.length > 0 && (
            <p className="text-sm text-gray-600">{currentTasks[0].message}</p>
          )}
        </div>
      </div>
    )
  }
)

PageLoading.displayName = 'PageLoading'
