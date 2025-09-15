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
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import { logger } from '@/lib/logger'
import { getFullImageUrl } from '@/lib/image-url-utils'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'

interface SortableImage {
  id: string
  url?: string
  path: string
  size: 'thumbnail' | 'medium' | 'large'
  file?: File
  preview?: string
  position: number
  alt?: string
}

interface SortableImageProps {
  image: SortableImage
  onRemove: (id: string) => void
}

function SortableImageItem({ image, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: itemIsDragging,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: itemIsDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-lg overflow-hidden border-2 transition-all duration-200 ${
        itemIsDragging
          ? 'border-amber-400 shadow-lg scale-105 z-10'
          : 'border-gray-200 hover:border-gray-300'
      }`}
      {...attributes}
    >
      {/* 拖拽手柄 */}
      <div
        {...listeners}
        className="absolute top-2 left-2 bg-black/50 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
        title="拖拽排序"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      </div>

      {/* 圖片 */}
      <div className="aspect-square relative">
        <SimpleImage
          src={getFullImageUrl(image.preview || image.url || '/images/placeholder.jpg')}
          alt={image.alt || `圖片 ${image.position + 1}`}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          priority={image.position === 0}
          onError={() => {
            logger.warn('圖片載入失敗', {
              metadata: {
                imageId: image.id,
                url: image.url,
                preview: image.preview,
              },
            })
          }}
        />
      </div>

      {/* 位置標記 */}
      <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
        #{image.position + 1}
        {image.position === 0 && <span className="ml-1 text-amber-300">主圖</span>}
      </div>

      {/* 圖片大小標記 */}
      {image.size && (
        <div className="absolute bottom-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs">
          {image.size}
        </div>
      )}

      {/* 刪除按鈕 */}
      <button
        onClick={() => onRemove(image.id)}
        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        aria-label={`刪除圖片 ${image.position + 1}`}
        type="button"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  )
}

interface SortableImageGalleryProps {
  images: SortableImage[]
  onImagesReorder: (images: SortableImage[]) => void
  onImageRemove: (id: string) => void
  layout?: 'grid' | 'list'
  maxColumns?: number
  className?: string
}

export default function SortableImageGallery({
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
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p>尚未上傳任何圖片</p>
        <p className="text-sm mt-1">請使用上方的圖片上傳功能</p>
      </div>
    )
  }

  const sortingStrategy =
    layout === 'list' ? verticalListSortingStrategy : horizontalListSortingStrategy

  const gridClass =
    layout === 'grid'
      ? `grid gap-4 ${
          maxColumns === 2
            ? 'grid-cols-2'
            : maxColumns === 3
              ? 'grid-cols-2 md:grid-cols-3'
              : maxColumns === 4
                ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5'
        }`
      : 'flex flex-col gap-4'

  return (
    <div className={className}>
      {/* 說明文字 */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">圖片排序說明</p>
            <ul className="space-y-1 text-blue-700">
              <li>• 拖拽圖片左上角的排序圖示來調整順序</li>
              <li>• 第一張圖片會自動設為主要展示圖片</li>
              <li>• 排序會即時保存</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 統計資訊 */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-600">共 {images.length} 張圖片</div>
        <div className="text-xs text-gray-500">
          主圖：{images.find(img => img.position === 0)?.id?.substring(0, 8) || '未設定'}...
        </div>
      </div>

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
      {isDragging && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs text-center">
            <div className="text-amber-600 mb-2">
              <svg
                className="w-8 h-8 mx-auto animate-bounce"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                />
              </svg>
            </div>
            <p className="text-sm text-gray-700">正在調整圖片順序...</p>
          </div>
        </div>
      )}
    </div>
  )
}
