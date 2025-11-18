'use client'

import { SortableImage } from './types'

interface GalleryStatsProps {
  images: SortableImage[]
}

export function GalleryStats({ images }: GalleryStatsProps) {
  const mainImage = images.find(img => img.position === 0)

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="text-sm text-gray-600">共 {images.length} 張圖片</div>
      <div className="text-xs text-gray-500">
        主圖：{mainImage?.id?.substring(0, 8) || '未設定'}...
      </div>
    </div>
  )
}
