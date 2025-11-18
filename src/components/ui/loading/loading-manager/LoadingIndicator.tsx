import React from 'react'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '../LoadingSpinner'
import { useLoading } from './useLoading'
import type { LoadingIndicatorProps } from './types'

/**
 * 載入狀態指示器元件
 *
 * 顯示當前載入狀態，包含：
 * - 旋轉的載入動畫
 * - 載入訊息
 * - 進度條（可選）
 *
 * @example
 * ```tsx
 * <LoadingIndicator
 *   size="lg"
 *   showMessage={true}
 *   showProgress={true}
 * />
 * ```
 */
export const LoadingIndicator = React.memo<LoadingIndicatorProps>(
  ({
    className = '',
    size = 'md',
    showMessage = true,
    message = '載入中...',
    showProgress = false,
  }) => {
    const { shouldShowLoading, currentTasks } = useLoading()

    if (!shouldShowLoading) return null

    const currentTask = currentTasks[0]
    const displayMessage = currentTask?.message || message
    const progress = currentTask?.progress

    return (
      <div className={cn('flex items-center justify-center space-x-3', className)}>
        <LoadingSpinner size={size} />
        {showMessage && (
          <div className="text-center">
            <span className="text-gray-600 font-medium block">{displayMessage}</span>
            {showProgress && progress && (
              <div className="mt-2 w-48 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, (progress.current / progress.total) * 100)}%` }}
                />
                {progress.message && (
                  <p className="text-xs text-gray-500 mt-1">{progress.message}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
)

LoadingIndicator.displayName = 'LoadingIndicator'
