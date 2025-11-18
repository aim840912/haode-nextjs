import React from 'react'
import { LoadingSpinner } from '@/components/ui/loading/LoadingSpinner'

interface ImageLoadingStateProps {
  shouldLoad: boolean
  isLoading: boolean
}

/**
 * 圖片載入狀態顯示元件
 */
export const ImageLoadingState = React.memo(function ImageLoadingState({
  shouldLoad,
  isLoading,
}: ImageLoadingStateProps) {
  if (shouldLoad && !isLoading) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {shouldLoad ? (
        <LoadingSpinner size="sm" />
      ) : (
        <div className="text-gray-400 text-sm">載入中...</div>
      )}
    </div>
  )
})
