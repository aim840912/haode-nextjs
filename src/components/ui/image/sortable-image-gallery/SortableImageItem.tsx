'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { getFullImageUrl } from '@/lib/utils/image-url-utils'
import { SortableImageProps } from './types'

export function SortableImageItem({ image, onRemove }: SortableImageProps) {
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
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all duration-200',
        itemIsDragging
          ? 'border-amber-400 shadow-lg scale-105 z-10'
          : 'border-gray-200 hover:border-gray-300'
      )}
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
          src={
            // 對於預覽圖片（data: URLs）直接使用，其他使用 getFullImageUrl 處理
            image.preview?.startsWith('data:') || image.preview?.startsWith('blob:')
              ? image.preview
              : getFullImageUrl(image.preview || image.url || '/images/placeholder.jpg')
          }
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
