'use client'

import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '../LoadingSpinner'
import { ErrorViewProps } from './types'

export function InlineErrorView({
  canRetry,
  isRetrying,
  className,
  errorIcon,
  errorTitle,
  errorMessage,
  onRetry,
}: ErrorViewProps) {
  return (
    <div
      className={cn(
        'flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg',
        className
      )}
    >
      {errorIcon}
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{errorTitle}</p>
        <p className="text-xs text-red-600 mt-1">{errorMessage}</p>
      </div>
      {canRetry && onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <LoadingSpinner size="sm" className="w-3 h-3" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          <span>{isRetrying ? '重試中...' : '重試'}</span>
        </button>
      )}
    </div>
  )
}
