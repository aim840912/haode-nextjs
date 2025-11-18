import React from 'react'
import { OptimizedImage } from '@/components/ui/image/OptimizedImage'
import { cn } from '@/lib/utils/cn'
import { ImageThumbnailsProps } from './types'

/**
 * 縮圖導航列元件
 *
 * 顯示所有圖片的縮圖，支援點擊切換主圖
 */
export const ImageThumbnails = React.memo<ImageThumbnailsProps>(
  ({ imageUrls, currentImageIndex, productName, onImageChange }) => {
    if (imageUrls.length <= 1) {
      return null
    }

    return (
      <div className="flex space-x-3 overflow-x-auto pb-2 px-1">
        {imageUrls.map((url, index) => (
          <button
            key={index}
            onClick={() => onImageChange(index)}
            className={cn(
              'flex-shrink-0 w-18 h-18 rounded-xl overflow-hidden transition-all duration-300 hover:scale-110',
              index === currentImageIndex
                ? 'ring-2 ring-gray-400 shadow-lg shadow-gray-400/20 scale-105'
                : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
            )}
          >
            <OptimizedImage
              src={url}
              alt={`${productName} 縮圖 ${index + 1}`}
              width={72}
              height={72}
              className="w-full h-full object-cover transition-transform duration-300"
              lazy={false}
            />
          </button>
        ))}
      </div>
    )
  }
)

ImageThumbnails.displayName = 'ImageThumbnails'
