'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '../LoadingSpinner'
import { ErrorViewProps } from './types'

export function FullscreenErrorView({
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
    <div
      className={cn(
        'min-h-screen flex items-center justify-center bg-gray-50 px-6 py-8',
        className
      )}
    >
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-100 rounded-full">{errorIcon}</div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">{errorTitle}</h2>

        <p className="text-gray-600 mb-6">{errorMessage}</p>

        {showDetails && (
          <details className="mb-6 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors text-center">
              查看錯誤詳情
            </summary>
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-700">
              <div>訊息: {error.message}</div>
              {error.code && <div>代碼: {error.code}</div>}
              <div>時間: {new Date(error.timestamp).toLocaleString()}</div>
            </div>
          </details>
        )}

        <div className="space-y-3">
          {canRetry && onRetry && (
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            className="w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>重新整理頁面</span>
          </button>

          <button
            onClick={() => window.history.back()}
            className="w-full px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            返回上一頁
          </button>
        </div>
      </div>
    </div>
  )
}
