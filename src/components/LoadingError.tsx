'use client'

import { AlertTriangle, RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { LoadingError as LoadingErrorType } from '@/hooks/useLoadingState'
import LoadingSpinner from './LoadingSpinner'
import { logger } from '@/lib/logger'

interface LoadingErrorProps {
  error: LoadingErrorType | null
  onRetry?: () => void | Promise<void>
  canRetry?: boolean
  isRetrying?: boolean
  className?: string
  variant?: 'inline' | 'card' | 'fullscreen'
  showDetails?: boolean
}

export function LoadingError({
  error,
  onRetry,
  canRetry = false,
  isRetrying = false,
  className = '',
  variant = 'inline',
  showDetails = false,
}: LoadingErrorProps) {
  if (!error) return null

  const handleRetry = async () => {
    if (onRetry && !isRetrying) {
      try {
        await onRetry()
        logger.info('User initiated retry', {
          module: 'LoadingError',
          metadata: { errorMessage: error.message, timestamp: error.timestamp },
        })
      } catch (retryError) {
        logger.error(
          'Retry failed',
          retryError instanceof Error ? retryError : new Error(String(retryError)),
          {
            module: 'LoadingError',
            metadata: { originalError: error.message },
          }
        )
      }
    }
  }

  const getErrorIcon = () => {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
      return <WifiOff className="w-6 h-6 text-red-500" />
    }
    if (error.code === 'TIMEOUT') {
      return <AlertCircle className="w-6 h-6 text-orange-500" />
    }
    return <AlertTriangle className="w-6 h-6 text-red-500" />
  }

  const getErrorTitle = () => {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
      return '網路連線問題'
    }
    if (error.code === 'TIMEOUT') {
      return '載入逾時'
    }
    if (error.code === 'SERVER_ERROR' || error.code?.toString().startsWith('5')) {
      return '伺服器錯誤'
    }
    if (error.code?.toString().startsWith('4')) {
      return '請求錯誤'
    }
    return '載入失敗'
  }

  const getErrorMessage = () => {
    if (error.code === 'NETWORK_ERROR' || error.message.includes('網路')) {
      return '請檢查您的網路連線，然後重試'
    }
    if (error.code === 'TIMEOUT') {
      return '載入時間過長，請重試或稍後再試'
    }
    if (error.code === 'SERVER_ERROR' || error.code?.toString().startsWith('5')) {
      return '伺服器暫時無法回應，請稍後再試'
    }
    if (error.code?.toString().startsWith('4')) {
      return '請求無效，請重新整理頁面'
    }
    return error.message || '發生未預期的錯誤'
  }

  const renderInlineError = () => (
    <div
      className={`flex items-center space-x-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}
    >
      {getErrorIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium text-red-800">{getErrorTitle()}</p>
        <p className="text-xs text-red-600 mt-1">{getErrorMessage()}</p>
      </div>
      {canRetry && (
        <button
          onClick={handleRetry}
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

  const renderCardError = () => (
    <div className={`bg-white border border-red-200 rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">{getErrorIcon()}</div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">{getErrorTitle()}</h3>
          <p className="text-sm text-gray-600 mb-4">{getErrorMessage()}</p>

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
            {canRetry && (
              <button
                onClick={handleRetry}
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

  const renderFullscreenError = () => (
    <div
      className={`min-h-screen flex items-center justify-center bg-gray-50 px-6 py-8 ${className}`}
    >
      <div className="max-w-md w-full bg-white border border-red-200 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="p-3 bg-red-100 rounded-full">{getErrorIcon()}</div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-4">{getErrorTitle()}</h2>

        <p className="text-gray-600 mb-6">{getErrorMessage()}</p>

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
          {canRetry && (
            <button
              onClick={handleRetry}
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

  switch (variant) {
    case 'inline':
      return renderInlineError()
    case 'card':
      return renderCardError()
    case 'fullscreen':
      return renderFullscreenError()
    default:
      return renderInlineError()
  }
}

// 便利元件：網路錯誤
export function NetworkError({
  onRetry,
  isRetrying = false,
}: {
  onRetry?: () => void
  isRetrying?: boolean
}) {
  return (
    <LoadingError
      error={{
        message: '無法連線到伺服器',
        code: 'NETWORK_ERROR',
        retryable: true,
        timestamp: Date.now(),
      }}
      onRetry={onRetry}
      canRetry={!!onRetry}
      isRetrying={isRetrying}
      variant="card"
    />
  )
}

// 便利元件：逾時錯誤
export function TimeoutError({
  onRetry,
  isRetrying = false,
}: {
  onRetry?: () => void
  isRetrying?: boolean
}) {
  return (
    <LoadingError
      error={{
        message: '載入時間過長',
        code: 'TIMEOUT',
        retryable: true,
        timestamp: Date.now(),
      }}
      onRetry={onRetry}
      canRetry={!!onRetry}
      isRetrying={isRetrying}
      variant="card"
    />
  )
}

// 便利元件：一般錯誤
export function GenericError({
  message = '發生未預期的錯誤',
  onRetry,
  isRetrying = false,
  variant = 'card' as const,
}: {
  message?: string
  onRetry?: () => void
  isRetrying?: boolean
  variant?: 'inline' | 'card' | 'fullscreen'
}) {
  return (
    <LoadingError
      error={{
        message,
        retryable: true,
        timestamp: Date.now(),
      }}
      onRetry={onRetry}
      canRetry={!!onRetry}
      isRetrying={isRetrying}
      variant={variant}
    />
  )
}
