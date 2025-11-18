'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '../LoadingSpinner'
import { ErrorViewProps } from './types'

export function CardErrorView({
  error,
  canRetry,
  isRetrying,
  className,
  showDetails,
  errorIcon,
  errorTitle,
  errorMessage,
  onRetry,
}: ErrorViewProps) {
  return (
    <div className={cn('bg-white border border-red-200 rounded-lg shadow-sm p-6', className)}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{errorIcon}</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{errorTitle}</h3>
          <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>

          {showDetails && (
            <details className="mb-4">
              <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700 transition-colors">
                錯誤詳情
              </summary>
              <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-700">
                <div>訊息: {error.message}</div>
                {error.code && <div>代碼: {error.code}</div>}
                <div>時間: {new Date(error.timestamp).toLocaleString()}</div>
              </div>
            </details>
          )}

          <div className="flex items-center space-x-3">
            {canRetry && onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <LoadingSpinner size="sm" color="white" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>{isRetrying ? '重試中...' : '重試'}</span>
              </button>
            )}

            <button
              onClick={() => window.location.reload()}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>重新整理頁面</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
