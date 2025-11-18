'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { LoadingSpinner } from '../LoadingSpinner'

/**
 * 圖片漸進式載入元件
 *
 * 提供平滑的圖片載入體驗：
 * 1. 顯示佔位圖或模糊預覽
 * 2. 預載入完整圖片
 * 3. 平滑過渡到完整圖片
 *
 * @example
 * ```tsx
 * <ProgressiveImage
 *   src="/images/product.jpg"
 *   alt="產品圖片"
 *   blurDataURL="data:image/jpeg;base64,..."
 *   width={800}
 *   height={600}
 * />
 * ```
 */

export interface ProgressiveImageProps {
  src: string
  alt: string
  placeholder?: string
  blurDataURL?: string
  className?: string
  width?: number
  height?: number
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function ProgressiveImage({
  src,
  alt,
  placeholder,
  blurDataURL,
  className = '',
  width,
  height,
  onLoad,
  onError,
}: ProgressiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState<string | null>(null)
  const [showImage, setShowImage] = useState(false)

  useEffect(() => {
    if (!src) return

    const img = new Image()
    img.onload = () => {
      setImageLoaded(true)
      setImageError(null)
      // 平滑過渡
      setTimeout(() => setShowImage(true), 50)
      onLoad?.()
    }
    img.onerror = () => {
      const error = new Error(`Failed to load image: ${src}`)
      setImageError(error.message)
      onError?.(error)
    }
    img.src = src
  }, [src, onLoad, onError])

  if (imageError) {
    return (
      <div
        className={cn('bg-gray-200 flex items-center justify-center text-gray-500', className)}
        style={{ width, height }}
      >
        <span className="text-sm">載入失敗</span>
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ width, height }}>
      {/* 佔位圖或模糊背景 */}
      {!imageLoaded && (
        <div className="absolute inset-0">
          {blurDataURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={blurDataURL}
              alt=""
              className="w-full h-full object-cover filter blur-sm scale-110"
            />
          ) : placeholder ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={placeholder} alt="" className="w-full h-full object-cover opacity-50" />
          ) : (
            <div className="w-full h-full bg-gray-200 animate-pulse flex items-center justify-center">
              <LoadingSpinner size="sm" color="gray" />
            </div>
          )}
        </div>
      )}

      {/* 實際圖片 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-opacity duration-300',
          showImage ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width, height }}
      />
    </div>
  )
}
