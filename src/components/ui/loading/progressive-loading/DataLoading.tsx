'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useLoadingState } from '@/hooks/useLoadingState'
import { GenericError } from '../LoadingError'
import { ProgressiveLoading } from './ProgressiveLoading'

/**
 * 資料載入元件
 *
 * 自動管理非同步資料載入的完整生命週期：
 * - 載入狀態管理
 * - 錯誤處理和重試
 * - 進度更新
 *
 * @example
 * ```tsx
 * <DataLoading
 *   asyncData={async () => await fetchProducts()}
 *   dependencies={[categoryId]}
 * >
 *   {(products) => <ProductList products={products} />}
 * </DataLoading>
 * ```
 */

export interface DataLoadingProps<T> {
  asyncData: () => Promise<T>
  children: (data: T) => ReactNode
  fallback?: ReactNode
  skeleton?: ReactNode
  errorComponent?: (error: { message: string }, retry: () => void) => ReactNode
  dependencies?: React.DependencyList
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
  const {
    isLoading,
    error,
    shouldShowLoading,
    executeAsync,
    retry: _retry,
    reset,
  } = useLoadingState({
    showLoadingAfterMs: 200,
    maxRetries: 3,
  })

  const loadData = useCallback(async () => {
    try {
      const result = await executeAsync(async updateProgress => {
        updateProgress({ current: 10, total: 100, message: '準備載入資料...' })
        const data = await asyncData()
        updateProgress({ current: 100, total: 100, message: '載入完成' })
        return data
      }, '載入資料中...')
      setData(result as T | null)
    } catch (_err) {
      // 錯誤由 executeAsync 處理
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asyncData, executeAsync, ...dependencies])

  const handleRetry = async () => {
    reset()
    setData(null)
    await loadData()
  }

  useEffect(() => {
    loadData()
  }, [loadData])

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
