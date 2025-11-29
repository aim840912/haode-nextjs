'use client'

import { useCallback } from 'react'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { EmptyGalleryPlaceholder } from './EmptyGalleryPlaceholder'
import { GalleryInstructions } from './GalleryInstructions'
import { GalleryStats } from './GalleryStats'
import { SortableImageItem } from './SortableImageItem'
import { SortableImageGalleryProps, SortableImage } from './types'

export function SortableImageGallery({
  images,
  onImagesReorder,
  onImageRemove,
  layout = 'grid',
  maxColumns = 4,
  className = '',
}: SortableImageGalleryProps) {
  // 移動圖片
  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (toIndex < 0 || toIndex >= images.length) return

      const newImages = [...images]
      const [removed] = newImages.splice(fromIndex, 1)
      newImages.splice(toIndex, 0, removed)

      // 更新位置索引
      const updatedImages: SortableImage[] = newImages.map((image, index) => ({
        ...image,
        position: index,
      }))

      logger.info('圖片排序已更新', {
        metadata: {
          fromIndex,
          toIndex,
          totalImages: updatedImages.length,
          newOrder: updatedImages.map(img => img.id),
        },
      })

      onImagesReorder(updatedImages)
    },
    [images, onImagesReorder]
  )

  if (images.length === 0) {
    return <EmptyGalleryPlaceholder className={className} />
  }

  const gridClass = cn(
    layout === 'grid' && 'grid gap-4',
    layout === 'grid' && maxColumns === 2 && 'grid-cols-2',
    layout === 'grid' && maxColumns === 3 && 'grid-cols-2 md:grid-cols-3',
    layout === 'grid' && maxColumns === 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    layout === 'grid' &&
      maxColumns !== 2 &&
      maxColumns !== 3 &&
      maxColumns !== 4 &&
      'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    layout === 'list' && 'flex flex-col gap-4'
  )

  return (
    <div className={className}>
      {/* 說明文字 */}
      <GalleryInstructions />

      {/* 統計資訊 */}
      <GalleryStats images={images} />

      {/* 圖片網格 */}
      <div className={gridClass}>
        {images.map((image, index) => (
          <SortableImageItem
            key={image.id}
            image={image}
            onRemove={onImageRemove}
            onMoveUp={() => moveImage(index, index - 1)}
            onMoveDown={() => moveImage(index, index + 1)}
            isFirst={index === 0}
            isLast={index === images.length - 1}
          />
        ))}
      </div>
    </div>
  )
}
