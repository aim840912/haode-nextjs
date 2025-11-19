import React from 'react'
import { cn } from '@/lib/utils/cn'
import { AvatarImage } from '../components/AvatarImage'
import { OptimizedImage } from '../components/OptimizedImage'
import { OptimizedImageProps } from '../types'

/**
 * SimpleImage 兼容性別名 - 啟用錯誤詳情顯示
 */
export const SimpleImage = React.memo(function SimpleImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} showErrorDetails={true} />
})

/**
 * SimpleImage 響應式組件的兼容性別名
 */
export const ResponsiveSimpleImage = React.memo(function ResponsiveSimpleImage({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  priority = false,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height' | 'fill'> & {
  aspectRatio?: 'aspect-square' | 'aspect-video' | 'aspect-[4/3]' | 'aspect-[3/2]'
}) {
  return (
    <div className={cn('relative', aspectRatio, 'overflow-hidden', className)}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        showErrorDetails={true}
        {...props}
      />
    </div>
  )
})

/**
 * SimpleImage 頭像組件的兼容性別名
 */
export const AvatarSimpleImage = React.memo(function AvatarSimpleImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: OptimizedImageProps & {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  return (
    <AvatarImage
      src={src}
      alt={alt}
      size={size}
      className={className}
      showErrorDetails={true}
      {...props}
    />
  )
})
