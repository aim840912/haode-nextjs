'use client'

import { logger } from '@/lib/logger'
import { LoadingErrorProps } from './types'
import { getErrorIcon, getErrorTitle, getErrorMessage } from './error-messages'
import { InlineErrorView } from './InlineErrorView'
import { CardErrorView } from './CardErrorView'
import { FullscreenErrorView } from './FullscreenErrorView'

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

  const commonProps = {
    error,
    onRetry: handleRetry,
    canRetry,
    isRetrying,
    className,
    showDetails,
    errorIcon: getErrorIcon(error),
    errorTitle: getErrorTitle(error),
    errorMessage: getErrorMessage(error),
  }

  switch (variant) {
    case 'inline':
      return <InlineErrorView {...commonProps} />
    case 'card':
      return <CardErrorView {...commonProps} />
    case 'fullscreen':
      return <FullscreenErrorView {...commonProps} />
    default:
      return <InlineErrorView {...commonProps} />
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
