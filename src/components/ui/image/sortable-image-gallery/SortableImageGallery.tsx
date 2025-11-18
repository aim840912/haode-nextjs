'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { SortableImageGalleryProps } from './types'
import { SortableImageItem } from './SortableImageItem'
import { EmptyGalleryPlaceholder } from './EmptyGalleryPlaceholder'
import { GalleryInstructions } from './GalleryInstructions'
import { GalleryStats } from './GalleryStats'
import { DragOverlay } from './DragOverlay'

export function SortableImageGallery({
  images,
  onImagesReorder,
  onImageRemove,
  layout = 'grid',
  maxColumns = 4,
  className = '',
}: SortableImageGalleryProps) {
  const [isDragging, setIsDragging] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 需要拖拽 8px 才開始排序，避免與點擊衝突
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = () => {
    setIsDragging(true)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragging(false)

    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = images.findIndex(image => image.id === active.id)
      const newIndex = images.findIndex(image => image.id === over?.id)

      const newImages = arrayMove(images, oldIndex, newIndex)

      // 更新位置索引
      const updatedImages = newImages.map((image, index) => ({
        ...image,
        position: index,
      }))

      logger.info('圖片排序已更新', {
        metadata: {
          oldIndex,
          newIndex,
          totalImages: updatedImages.length,
          newOrder: updatedImages.map(img => img.id),
        },
      })

      onImagesReorder(updatedImages)
    }
  }

  if (images.length === 0) {
    return <EmptyGalleryPlaceholder className={className} />
  }

  const sortingStrategy =
    layout === 'list' ? verticalListSortingStrategy : horizontalListSortingStrategy

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

      {/* 可拖拽的圖片網格 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={images.map(img => img.id)} strategy={sortingStrategy}>
          <div className={gridClass}>
            {images.map(image => (
              <SortableImageItem key={image.id} image={image} onRemove={onImageRemove} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* 拖拽提示 */}
      {isDragging && <DragOverlay />}
    </div>
  )
}
