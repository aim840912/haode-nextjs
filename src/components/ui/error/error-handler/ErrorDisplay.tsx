import React from 'react'
import { ErrorToast } from './ErrorToast'
import { useErrorHandler } from './useErrorHandler'

/**
 * 錯誤顯示容器元件
 *
 * 顯示錯誤 Toast 列表（最多 3 個）
 */
export const ErrorDisplay = React.memo(() => {
  const { errors, removeError, retryOperation } = useErrorHandler()

  if (errors.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {errors.slice(0, 3).map(error => (
        <ErrorToast
          key={error.id}
          error={error}
          onDismiss={() => removeError(error.id)}
          onRetry={error.retryable ? operation => retryOperation(error.id, operation) : undefined}
        />
      ))}
    </div>
  )
})

ErrorDisplay.displayName = 'ErrorDisplay'
