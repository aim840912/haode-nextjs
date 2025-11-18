import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ResponsiveImageProps, ASPECT_RATIO_PADDING_MAP } from '../types'
import { OptimizedImage } from './OptimizedImage'

/**
 * 響應式圖片組件 - 使用 padding-bottom 技巧確保高度
 */
export const ResponsiveImage = React.memo(function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  productId,
  ...props
}: ResponsiveImageProps) {
  const paddingBottom = ASPECT_RATIO_PADDING_MAP[aspectRatio] || '100%'

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div style={{ paddingBottom }} className="relative">
        <div className="absolute inset-0">
          <OptimizedImage
            src={src}
            alt={alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            enableResponsive={true}
            productId={productId}
            lazy={true}
            {...props}
          />
        </div>
      </div>
    </div>
  )
})
