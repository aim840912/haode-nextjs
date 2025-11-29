'use client'

import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { SimpleImage } from '@/components/ui/image/OptimizedImage'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils/cn'
import { getFullImageUrl } from '@/lib/utils/image-url-utils'
import { SortableImageProps } from './types'

export function SortableImageItem({
  image,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SortableImageProps) {
  return (
    <div
      className={cn(
        'relative group rounded-lg overflow-hidden border-2 transition-all duration-200',
        'border-gray-200 hover:border-gray-300'
      )}
    >
      {/* 排序按鈕 */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onMoveUp}
          disabled={isFirst}
          className={cn(
            'bg-black/50 text-white p-1.5 rounded-full transition-colors',
            isFirst ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
          )}
          title="上移"
          type="button"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
        <button
          onClick={onMoveDown}
          disabled={isLast}
          className={cn(
            'bg-black/50 text-white p-1.5 rounded-full transition-colors',
            isLast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-black/70'
          )}
          title="下移"
          type="button"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
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
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
