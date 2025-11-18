import React from 'react'
import { LoadingError as LoadingErrorType } from '@/hooks/useLoadingState'

export interface LoadingErrorProps {
  error: LoadingErrorType | null
  onRetry?: () => void | Promise<void>
  canRetry?: boolean
  isRetrying?: boolean
  className?: string
  variant?: 'inline' | 'card' | 'fullscreen'
  showDetails?: boolean
}

export interface ErrorViewProps {
  error: LoadingErrorType
  onRetry?: () => Promise<void>
  canRetry: boolean
  isRetrying: boolean
  className?: string
  showDetails?: boolean
  errorIcon: React.ReactElement
  errorTitle: string
  errorMessage: string
}
