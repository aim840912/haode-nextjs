'use client'

import { useState, useEffect, ReactNode, Suspense } from 'react'
import { ComponentErrorBoundary } from '../../error/ErrorBoundary'
import { LoadingSkeleton } from '../LoadingSkeleton'
import { LoadingSpinner } from '../LoadingSpinner'

/**
 * 漸進式載入容器元件
 *
 * 提供階段式載入策略：
 * - initial (0-200ms): 不顯示任何載入狀態
 * - spinner (200-1000ms): 顯示 Spinner
 * - skeleton (1000ms+): 顯示 Skeleton
 *
 * @example
 * ```tsx
 * <ProgressiveLoading skeleton={<CustomSkeleton />}>
 *   <AsyncComponent />
 * </ProgressiveLoading>
 * ```
 */

export interface ProgressiveLoadingProps {
  children: ReactNode
  fallback?: ReactNode
  skeleton?: ReactNode
  showSpinnerAfterMs?: number
  showSkeletonAfterMs?: number
  errorBoundary?: boolean
  className?: string
}

export function ProgressiveLoading({
  children,
  fallback,
  skeleton,
  showSpinnerAfterMs = 200,
  showSkeletonAfterMs = 1000,
  errorBoundary = true,
  className = '',
}: ProgressiveLoadingProps) {
  const [loadingPhase, setLoadingPhase] = useState<'initial' | 'spinner' | 'skeleton'>('initial')

  useEffect(() => {
    const spinnerTimer = setTimeout(() => {
      setLoadingPhase('spinner')
    }, showSpinnerAfterMs)

    const skeletonTimer = setTimeout(() => {
      setLoadingPhase('skeleton')
    }, showSkeletonAfterMs)

    return () => {
      clearTimeout(spinnerTimer)
      clearTimeout(skeletonTimer)
    }
  }, [showSpinnerAfterMs, showSkeletonAfterMs])

  const renderFallback = () => {
    if (fallback) return fallback

    switch (loadingPhase) {
      case 'initial':
        return null // 不顯示任何載入狀態
      case 'spinner':
        return (
          <div className="flex items-center justify-center py-4">
            <LoadingSpinner size="md" />
          </div>
        )
      case 'skeleton':
        return (
          skeleton || (
            <div className="space-y-4">
              <LoadingSkeleton variant="text" lines={3} />
              <LoadingSkeleton variant="card" />
            </div>
          )
        )
    }
  }

  const content = (
    <div className={className}>
      <Suspense fallback={renderFallback()}>{children}</Suspense>
    </div>
  )

  return errorBoundary ? <ComponentErrorBoundary>{content}</ComponentErrorBoundary> : content
}
