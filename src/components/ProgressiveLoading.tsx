'use client'

import { useState, useEffect, ReactNode, Suspense } from 'react'
import { LoadingSkeleton } from './LoadingSkeleton'
import LoadingSpinner from './LoadingSpinner'
import { LoadingError, GenericError } from './LoadingError'
import { useLoadingState } from '@/hooks/useLoadingState'
import { ComponentErrorBoundary } from './ErrorBoundary'

interface ProgressiveLoadingProps {
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

// 資料載入元件
interface DataLoadingProps<T> {
  asyncData: () => Promise<T>
  children: (data: T) => ReactNode
  fallback?: ReactNode
  skeleton?: ReactNode
  errorComponent?: (error: any, retry: () => void) => ReactNode
  dependencies?: any[]
  className?: string
}

export function DataLoading<T>({
  asyncData,
  children,
  fallback,
  skeleton,
  errorComponent,
  dependencies = [],
  className = '',
}: DataLoadingProps<T>) {
  const [data, setData] = useState<T | null>(null)
  const { isLoading, error, shouldShowLoading, executeAsync, retry, reset } = useLoadingState({
    showLoadingAfterMs: 200,
    maxRetries: 3,
  })

  const loadData = async () => {
    try {
      const result = await executeAsync(async updateProgress => {
        updateProgress({ current: 10, total: 100, message: '準備載入資料...' })
        const data = await asyncData()
        updateProgress({ current: 100, total: 100, message: '載入完成' })
        return data
      }, '載入資料中...')
      setData(result as T | null)
    } catch (err) {
      // 錯誤由 executeAsync 處理
    }
  }

  const handleRetry = async () => {
    reset()
    setData(null)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, dependencies)

  if (error) {
    return errorComponent ? (
      errorComponent(error, handleRetry)
    ) : (
      <GenericError message={error.message} onRetry={handleRetry} variant="card" />
    )
  }

  if (isLoading || !data) {
    return (
      <div className={className}>
        <ProgressiveLoading
          fallback={fallback}
          skeleton={skeleton}
          showSpinnerAfterMs={shouldShowLoading ? 0 : 200}
        >
          <div></div> {/* 空內容，觸發 loading 狀態 */}
        </ProgressiveLoading>
      </div>
    )
  }

  return <div className={className}>{children(data)}</div>
}

// 圖片漸進式載入
interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  blurDataURL?: string
  className?: string
  width?: number
  height?: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  className = '',
  width,
  height,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(false)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
      setImageError(null)
      // 平滑過渡
      setTimeout(() => setShowImage(true), 50)
      onLoad?.()
    }
    img.onerror = () => {
      const error = new Error(`Failed to load image: ${src}`)
      setImageError(error.message)
      onError?.(error)
    }
    img.src = src
  }, [src, onLoad, onError])

  if (imageError) {
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <span className="text-sm">載入失敗</span>
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {/* 佔位圖或模糊背景 */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
            />
          ) : placeholder ? (
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
              <LoadingSpinner size="sm" color="gray" />
            </div>
          )}
        </div>
      )}

      {/* 實際圖片 */}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          showImage ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width, height }}
      />
    </div>
  )
}

// 列表項目漸進式載入
interface ProgressiveListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  loadingItemsCount?: number
  batchSize?: number
  loadMoreThreshold?: number
  className?: string
  itemClassName?: string
}

export function ProgressiveList<T>({
  items,
  renderItem,
  loadingItemsCount = 3,
  batchSize = 10,
  loadMoreThreshold = 5,
  className = '',
  itemClassName = '',
}: ProgressiveListProps<T>) {
  const [visibleCount, setVisibleCount] = useState(Math.min(batchSize, items.length))
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    setVisibleCount(Math.min(batchSize, items.length))
  }, [items.length, batchSize])

  const loadMore = async () => {
    if (isLoadingMore || visibleCount >= items.length) return

    setIsLoadingMore(true)

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 500))

    setVisibleCount(prev => Math.min(prev + batchSize, items.length))
    setIsLoadingMore(false)
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset
      const windowHeight = window.innerHeight
      const docHeight = document.documentElement.offsetHeight

      if (scrollTop + windowHeight >= docHeight - loadMoreThreshold && !isLoadingMore) {
        loadMore()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isLoadingMore, visibleCount, items.length, loadMoreThreshold])

  return (
    <div className={className}>
      {items.slice(0, visibleCount).map((item, index) => (
        <div key={index} className={itemClassName}>
          {renderItem(item, index)}
        </div>
      ))}

      {isLoadingMore && (
        <div className="space-y-4 mt-4">
          {Array.from({ length: Math.min(loadingItemsCount, items.length - visibleCount) }).map(
            (_, index) => (
              <div key={index} className="animate-pulse">
                <LoadingSkeleton variant="card" />
              </div>
            )
          )}
        </div>
      )}

      {visibleCount < items.length && !isLoadingMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
          >
            載入更多 ({items.length - visibleCount} 項)
          </button>
        </div>
      )}
    </div>
  )
}
