interface LoadingSkeletonProps {
  className?: string
  variant?: 'text' | 'card' | 'circle' | 'rectangle'
  lines?: number
  height?: string
  width?: string
}

export function LoadingSkeleton({
  className = '',
  variant = 'rectangle',
  lines = 3,
  height = 'h-4',
  width = 'w-full',
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 rounded'

  switch (variant) {
    case 'text':
      return (
        <div className={`space-y-2 ${className}`}>
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className={`${baseClasses} ${height} ${i === lines - 1 ? 'w-3/4' : width}`}
            />
          ))}
        </div>
      )

    case 'card':
      return (
        <div className={`${baseClasses} p-6 ${className}`}>
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      )

    case 'circle':
      return <div className={`${baseClasses} rounded-full ${height} ${width} ${className}`} />

    case 'rectangle':
    default:
      return <div className={`${baseClasses} ${height} ${width} ${className}`} />
  }
}

// 產品卡片載入骨架
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex justify-center mb-4">
        <LoadingSkeleton variant="circle" height="h-16" width="w-16" />
      </div>
      <LoadingSkeleton variant="text" lines={2} className="mb-4" />
      <LoadingSkeleton height="h-6" width="w-24" className="mx-auto mb-2" />
      <LoadingSkeleton height="h-8" width="w-20" className="mx-auto" />
    </div>
  )
}

// 頁面載入骨架
export function PageLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="animate-pulse">
        {/* 標題區域 */}
        <div className="text-center mb-12">
          <LoadingSkeleton height="h-8" width="w-64" className="mx-auto mb-4" />
          <LoadingSkeleton height="h-4" width="w-96" className="mx-auto" />
        </div>

        {/* 內容網格 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>

        {/* 按鈕區域 */}
        <div className="text-center">
          <LoadingSkeleton height="h-12" width="w-32" className="mx-auto" />
        </div>
      </div>
    </div>
  )
}

// 列表項目載入骨架
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 animate-pulse">
      <LoadingSkeleton variant="circle" height="h-12" width="w-12" />
      <div className="flex-1">
        <LoadingSkeleton height="h-4" width="w-3/4" className="mb-2" />
        <LoadingSkeleton height="h-3" width="w-1/2" />
      </div>
      <LoadingSkeleton height="h-6" width="w-16" />
    </div>
  )
}

// 評論載入骨架
export function ReviewSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="flex items-center mb-4">
        <LoadingSkeleton variant="circle" height="h-10" width="w-10" className="mr-3" />
        <div className="flex-1">
          <LoadingSkeleton height="h-4" width="w-24" className="mb-1" />
          <LoadingSkeleton height="h-3" width="w-16" />
        </div>
        <div className="flex space-x-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} variant="circle" height="h-4" width="w-4" />
          ))}
        </div>
      </div>
      <LoadingSkeleton variant="text" lines={3} />
    </div>
  )
}
