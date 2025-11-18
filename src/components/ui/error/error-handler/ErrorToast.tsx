import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ErrorType, type ErrorToastProps } from './types'

/**
 * 錯誤 Toast 元件
 *
 * 顯示單一錯誤訊息，包含：
 * - 錯誤圖示（根據類型）
 * - 錯誤訊息
 * - 重試按鈕（可選）
 * - 關閉按鈕
 */
export const ErrorToast = React.memo<ErrorToastProps>(({ error, onDismiss, onRetry }) => {
  const getErrorIcon = (type: ErrorType): string => {
    const icons: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: '🌐',
      [ErrorType.VALIDATION]: '⚠️',
      [ErrorType.AUTHENTICATION]: '🔒',
      [ErrorType.AUTHORIZATION]: '🚫',
      [ErrorType.SERVER]: '🔧',
      [ErrorType.CLIENT]: '❌',
      [ErrorType.UNKNOWN]: '❌',
    }
    return icons[type] || '❌'
  }

  const getErrorColor = (type: ErrorType): string => {
    const colors: Record<ErrorType, string> = {
      [ErrorType.NETWORK]: 'border-blue-200 bg-blue-50 text-blue-800',
      [ErrorType.VALIDATION]: 'border-yellow-200 bg-yellow-50 text-yellow-800',
      [ErrorType.AUTHENTICATION]: 'border-orange-200 bg-orange-50 text-orange-800',
      [ErrorType.AUTHORIZATION]: 'border-orange-200 bg-orange-50 text-orange-800',
      [ErrorType.SERVER]: 'border-red-200 bg-red-50 text-red-800',
      [ErrorType.CLIENT]: 'border-gray-200 bg-gray-50 text-gray-800',
      [ErrorType.UNKNOWN]: 'border-gray-200 bg-gray-50 text-gray-800',
    }
    return colors[type] || 'border-gray-200 bg-gray-50 text-gray-800'
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4 shadow-lg transition-all duration-300',
        getErrorColor(error.type)
      )}
    >
      <div className="flex items-start space-x-3">
        <span className="text-xl">{getErrorIcon(error.type)}</span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{error.message}</p>

          {error.retryCount && error.retryCount > 0 && (
            <p className="text-xs opacity-75 mt-1">重試次數: {error.retryCount}</p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {onRetry && (
            <button
              onClick={() => onRetry(() => Promise.resolve())}
              className="text-xs px-2 py-1 rounded hover:opacity-75 transition-opacity"
            >
              重試
            </button>
          )}

          <button
            onClick={onDismiss}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
})

ErrorToast.displayName = 'ErrorToast'
