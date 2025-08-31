'use client'

import Image from 'next/image'
import { useState } from 'react'
import { logger } from '@/lib/logger'

interface SimpleImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  priority?: boolean
  quality?: number
  className?: string
  sizes?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: (error: string) => void
}

const DEFAULT_BLUR_DATA =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='

export default function SimpleImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  quality = 85,
  className = '',
  sizes,
  placeholder = 'blur',
  blurDataURL = DEFAULT_BLUR_DATA,
  onLoad,
  onError,
}: SimpleImageProps) {
  const [error, setError] = useState<string | null>(null)

  const handleError = () => {
    const errorMsg = `圖片載入失敗: ${src}`
    logger.warn('SimpleImage 載入失敗', { src, alt })
    setError(errorMsg)
    onError?.(errorMsg)
  }

  const handleLoad = () => {
    setError(null)
    onLoad?.()
  }

  // 錯誤狀態顯示
  if (error) {
    return (
      <div
        className={`bg-gray-100 flex items-center justify-center text-gray-500 text-sm ${className}`}
      >
        <div className="text-center p-4">
          <div className="text-2xl mb-2">❌</div>
          <div>圖片載入失敗</div>
        </div>
      </div>
    )
  }

  // 使用 fill 模式
  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        className={className}
        sizes={sizes || '100vw'}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        onLoad={handleLoad}
        onError={handleError}
      />
    )
  }

  // 使用固定尺寸
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 400}
      height={height || 300}
      priority={priority}
      quality={quality}
      className={className}
      sizes={sizes}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      onLoad={handleLoad}
      onError={handleError}
    />
  )
}

// 響應式圖片組件 - 常見比例
export function ResponsiveSimpleImage({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  priority = false,
  ...props
}: Omit<SimpleImageProps, 'width' | 'height' | 'fill'> & {
  aspectRatio?: 'aspect-square' | 'aspect-video' | 'aspect-[4/3]' | 'aspect-[3/2]'
}) {
  return (
    <div className={`relative ${aspectRatio} overflow-hidden ${className}`}>
      <SimpleImage
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="object-cover"
        {...props}
      />
    </div>
  )
}

// 頭像圖片組件
export function AvatarSimpleImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: Omit<SimpleImageProps, 'width' | 'height' | 'fill'> & {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeMap = {
    sm: { width: 32, height: 32, className: 'w-8 h-8' },
    md: { width: 48, height: 48, className: 'w-12 h-12' },
    lg: { width: 64, height: 64, className: 'w-16 h-16' },
    xl: { width: 96, height: 96, className: 'w-24 h-24' },
  }

  const sizeConfig = sizeMap[size]

  return (
    <SimpleImage
      src={src}
      alt={alt}
      width={sizeConfig.width}
      height={sizeConfig.height}
      className={`rounded-full object-cover ${sizeConfig.className} ${className}`}
      {...props}
    />
  )
}
