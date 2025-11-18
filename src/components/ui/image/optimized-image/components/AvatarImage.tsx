import React from 'react'
import { cn } from '@/lib/utils/cn'
import { AvatarImageProps, AVATAR_SIZE_CLASSES, AVATAR_SIZE_PX } from '../types'
import { OptimizedImage } from './OptimizedImage'

/**
 * 頭像圖片組件
 */
export const AvatarImage = React.memo(function AvatarImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: AvatarImageProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={AVATAR_SIZE_PX[size].width}
      height={AVATAR_SIZE_PX[size].height}
      className={cn('rounded-full object-cover', AVATAR_SIZE_CLASSES[size], className)}
      {...props}
    />
  )
})
