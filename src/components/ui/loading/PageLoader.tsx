'use client'
import { cn } from '@/lib/utils/cn'
import { LoadingSkeleton, ProductCardSkeleton, ListItemSkeleton } from './LoadingSkeleton'
import { LoadingSpinner } from './LoadingSpinner'

export interface PageLoaderProps {
  /**
   * 載入類型
   * - skeleton: 骨架屏（推薦）
   * - spinner: 旋轉載入器
   * - card: 卡片骨架屏
   * - list: 列表骨架屏
   */
  type?: 'skeleton' | 'spinner' | 'card' | 'list'

  /**
   * 載入訊息
   */
  message?: string

  /**
   * 顯示進度條
   */
  showProgress?: boolean

  /**
   * 自訂樣式類名
   */
  className?: string

  /**
   * 骨架屏項目數量（用於 card 和 list 類型）
   */
  itemCount?: number

  /**
   * 最小高度
   */
  minHeight?: string
}

/**
 * 統一的頁面載入元件
 *
 * 使用範例：
 * ```tsx
 * if (loading) {
 *   return <PageLoader type="skeleton" message="載入頁面資料中..." />
 * }
 * ```
 */
export function PageLoader({
  type = 'skeleton',
  message = '載入中...',
  showProgress = false,
  className = '',
  itemCount = 3,
  minHeight = 'min-h-screen',
}: PageLoaderProps) {
  const baseClasses = cn(minHeight, 'bg-gray-50 flex items-center justify-center', className)

  const renderContent = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6">
              <LoadingSpinner size="xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{message}</h2>
            {showProgress && (
              <div className="w-64 bg-gray-200 rounded-full h-2 mb-4">
                <div className="bg-amber-600 h-2 rounded-full animate-pulse w-1/2" />
              </div>
            )}
          </div>
        )

      case 'card':
        return (
          <div className="max-w-7xl mx-auto px-6 py-8 w-full">
            <div className="text-center mb-12">
              <LoadingSkeleton height="h-8" width="w-64" className="mx-auto mb-4" />
              <LoadingSkeleton height="h-4" width="w-96" className="mx-auto" />
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {Array.from({ length: itemCount }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )

      case 'list':
        return (
          <div className="max-w-4xl mx-auto px-6 py-8 w-full">
            <div className="text-center mb-8">
              <LoadingSkeleton height="h-8" width="w-48" className="mx-auto mb-4" />
              <LoadingSkeleton height="h-4" width="w-64" className="mx-auto" />
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {Array.from({ length: itemCount }).map((_, i) => (
                <ListItemSkeleton key={i} />
              ))}
            </div>
          </div>
        )

      case 'skeleton':
      default:
        return (
          <div className="text-center max-w-md mx-auto p-6">
            <div className="mb-6 flex justify-center">
              <LoadingSkeleton variant="circle" height="h-16" width="w-16" />
            </div>
            <LoadingSkeleton height="h-6" width="w-48" className="mx-auto mb-4" />
            <LoadingSkeleton height="h-4" width="w-64" className="mx-auto mb-2" />
            <LoadingSkeleton height="h-4" width="w-56" className="mx-auto" />
            {showProgress && (
              <div className="mt-6">
                <LoadingSkeleton height="h-2" width="w-64" className="mx-auto" />
              </div>
            )}
          </div>
        )
    }
  }

  return <div className={baseClasses}>{renderContent()}</div>
}

/**
 * 特定頁面類型的快捷載入元件
 */

// 產品頁面載入
export function ProductPageLoader() {
  return <PageLoader type="card" message="載入產品資料中..." itemCount={6} />
}

// 精彩時刻頁面載入
export function MomentsPageLoader() {
  return <PageLoader type="card" message="載入精彩時刻中..." itemCount={6} />
}

// 門市據點頁面載入
export function LocationsPageLoader() {
  return <PageLoader type="skeleton" message="載入門市據點資訊中..." />
}

// 農場導覽頁面載入
export function FarmTourPageLoader() {
  return <PageLoader type="skeleton" message="載入農場導覽資訊中..." />
}

// 管理後台頁面載入
export function AdminPageLoader({ message = '載入管理資料中...' }: { message?: string }) {
  return (
    <PageLoader
      type="list"
      message={message}
      minHeight="min-h-[calc(100vh-6rem)]" // 扣除 header 高度
      itemCount={5}
    />
  )
}

// 詳情頁載入
export function DetailPageLoader({ message = '載入詳細資訊中...' }: { message?: string }) {
  return <PageLoader type="skeleton" message={message} />
}
