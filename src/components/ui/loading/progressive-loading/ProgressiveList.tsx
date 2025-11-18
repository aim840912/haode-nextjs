'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { LoadingSkeleton } from '../LoadingSkeleton'

/**
 * 列表漸進式載入元件
 *
 * 提供批次載入和無限滾動功能：
 * - 初始載入一批資料
 * - 滾動到底部自動載入更多
 * - 手動「載入更多」按鈕
 * - 載入中顯示 Skeleton
 *
 * @example
 * ```tsx
 * <ProgressiveList
 *   items={products}
 *   renderItem={(product) => <ProductCard product={product} />}
 *   batchSize={20}
 * />
 * ```
 */

export interface ProgressiveListProps<T> {
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

  const loadMore = useCallback(async () => {
    if (isLoadingMore || visibleCount >= items.length) return

    setIsLoadingMore(true)

    // 模擬載入延遲
    await new Promise(resolve => setTimeout(resolve, 500))

    setVisibleCount(prev => Math.min(prev + batchSize, items.length))
    setIsLoadingMore(false)
  }, [isLoadingMore, visibleCount, items.length, batchSize])

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
  }, [isLoadingMore, visibleCount, items.length, loadMoreThreshold, loadMore])

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
