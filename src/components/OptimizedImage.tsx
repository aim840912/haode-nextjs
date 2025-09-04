'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { logger } from '@/lib/logger'
import LoadingSpinner from './LoadingSpinner'
import { handleImageError, buildResponsiveImageSrcSet } from '@/lib/image-utils'
import { useImageBlob } from '@/hooks/useImageBlob'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  sizes?: string
  priority?: boolean
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  fallbackSrc?: string
  onError?: (error?: string) => void // 增強錯誤回調
  onLoad?: () => void
  lazy?: boolean // 啟用懶加載
  productId?: string // 產品ID，用於生成響應式圖片
  enableResponsive?: boolean // 啟用響應式圖片
  threshold?: number // Intersection Observer 閾值
  enableMultiLevelFallback?: boolean // 啟用多層 fallback (來自 SafeImage)
  showErrorDetails?: boolean // 是否顯示錯誤詳情 (來自 SimpleImage)
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  quality = 80, // 提升品質到 80 以獲得更好的視覺體驗
  placeholder = 'blur', // 預設使用 blur placeholder
  blurDataURL,
  fallbackSrc = '/images/placeholder.jpg',
  onError,
  onLoad,
  lazy = true,
  productId,
  enableResponsive = false,
  threshold = 0.1,
  enableMultiLevelFallback = false,
  showErrorDetails = false,
}: OptimizedImageProps) {
  const [isInView, setIsInView] = useState(priority || !lazy)
  const [shouldLoad, setShouldLoad] = useState(priority || !lazy)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLDivElement>(null)

  // Base64 編碼的 1x1 灰色像素作為最終 fallback (來自 SafeImage)
  const BASE64_PLACEHOLDER =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAxNkwyNCAyNEwxNiAyNFYxNloiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'

  // 驗證圖片 URL 是否有效 (來自 SafeImage 邏輯)
  const isValidImageSrc = useCallback((url: string): boolean => {
    if (!url || typeof url !== 'string') return false

    try {
      if (url.startsWith('http') || url.startsWith('https')) {
        new URL(url)
        return true
      }
      return url.startsWith('/') || url.startsWith('data:') || url.startsWith('blob:')
    } catch {
      return false
    }
  }, [])

  // 重置錯誤狀態當 src 改變時
  useEffect(() => {
    setHasError(false)
    setCurrentSrc(src)
  }, [src])

  // 使用 useCallback 穩定回調函數引用
  const handleLoadCallback = useCallback(() => {
    setHasError(false)
    onLoad?.()
  }, [onLoad])

  const handleErrorCallback = useCallback(
    (errorMsg: string) => {
      logger.error('圖片載入失敗', new Error(errorMsg), { metadata: { src: currentSrc, alt } })

      if (enableMultiLevelFallback && !hasError) {
        // SafeImage 多層 fallback 邏輯
        setHasError(true)
        if (currentSrc === fallbackSrc) {
          setCurrentSrc(BASE64_PLACEHOLDER)
        } else if (isValidImageSrc(fallbackSrc)) {
          setCurrentSrc(fallbackSrc)
        } else {
          setCurrentSrc(BASE64_PLACEHOLDER)
        }
      }

      onError?.(errorMsg)
    },
    [currentSrc, enableMultiLevelFallback, hasError, fallbackSrc, isValidImageSrc, alt, onError]
  )

  // 確保 src 有效，如果無效則使用 fallback
  const safeSrc = isValidImageSrc(currentSrc)
    ? currentSrc
    : isValidImageSrc(fallbackSrc)
      ? fallbackSrc
      : BASE64_PLACEHOLDER

  // 使用新的圖片 Blob Hook
  const { processedSrc, isLoading, error, isBase64, blobUrl } = useImageBlob(safeSrc, {
    fallbackSrc,
    onLoad: handleLoadCallback,
    onError: handleErrorCallback,
  })

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !lazy || shouldLoad) return

    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries
        if (entry.isIntersecting) {
          setIsInView(true)
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin: '100px', // 提前 100px 開始載入
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, lazy, shouldLoad, threshold])

  const handleLoad = () => {
    // Image loaded successfully
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    handleImageError(event, fallbackSrc)
  }

  // 優化的模糊預設圖片 base64 - 更柔和的灰色漸層
  const defaultBlurDataURL =
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjI0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iYSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agc3RvcC1jb2xvcj0iI2Y5ZmFmYiIvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNlNWU3ZWIiLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjYSkiLz4KPC9zdmc+'

  // 響應式圖片處理 - 優化的 sizes 配置
  const finalSrc = shouldLoad && processedSrc ? processedSrc : ''
  const finalSizes =
    enableResponsive && productId
      ? '(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw'
      : sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'

  // 判斷圖片類型：base64、Blob URL 或普通 URL
  const isBase64OrBlob = finalSrc && (finalSrc.startsWith('data:') || finalSrc.startsWith('blob:'))

  const containerClassName = fill
    ? `relative overflow-hidden ${className}`
    : `relative overflow-hidden ${className}`

  if (fill) {
    return (
      <div ref={imgRef} className={containerClassName}>
        {(!shouldLoad || isLoading) && (
          <div className="absolute inset-0 flex items-center justify-center">
            {shouldLoad ? (
              <LoadingSpinner size="sm" />
            ) : (
              <div className="text-gray-400 text-sm">載入中...</div>
            )}
          </div>
        )}
        {shouldLoad &&
          finalSrc &&
          (isBase64OrBlob ? (
            // 對於 base64 和 Blob URL，使用原生 img 標籤
            <img
              src={finalSrc}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              onLoad={handleLoad}
              onError={handleError}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            // 對於普通 URL，在 fill 模式下使用原生 img 標籤避免 Next.js Image 的兼容性問題
            <img
              src={finalSrc}
              alt={alt}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              }`}
              style={{ objectFit: 'cover' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          ))}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center bg-gray-100">
            <div className="text-2xl mb-2">❌</div>
            <div className="font-semibold">圖片載入失敗</div>
            {showErrorDetails && <div className="mt-1 opacity-80 text-xs">{error}</div>}
            {isBase64 && <div className="mt-1 text-xs text-blue-600">📷 Base64 → Blob 轉換</div>}
            {enableMultiLevelFallback && hasError && (
              <div className="mt-1 text-xs text-orange-600">🔄 多層 Fallback 啟用</div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div ref={imgRef} className={containerClassName}>
      {(!shouldLoad || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          {shouldLoad ? (
            <LoadingSpinner size="sm" />
          ) : (
            <div className="text-gray-400 text-sm">載入中...</div>
          )}
        </div>
      )}
      {shouldLoad &&
        finalSrc &&
        (isBase64OrBlob ? (
          // 對於 base64 和 Blob URL，使用原生 img 標籤
          <img
            src={finalSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: 'cover' }}
          />
        ) : (
          // 對於普通 URL，使用 Next.js Image 組件進行優化
          <Image
            src={finalSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            sizes={finalSizes}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL || defaultBlurDataURL}
            className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            onLoad={handleLoad}
            onError={handleError}
          />
        ))}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 text-xs p-2 text-center bg-gray-100">
          <div className="text-2xl mb-2">❌</div>
          <div className="font-semibold">圖片載入失敗</div>
          {showErrorDetails && <div className="mt-1 opacity-80 text-xs">{error}</div>}
          {isBase64 && <div className="mt-1 text-xs text-blue-600">📷 Base64 → Blob 轉換</div>}
          {enableMultiLevelFallback && hasError && (
            <div className="mt-1 text-xs text-orange-600">🔄 多層 Fallback 啟用</div>
          )}
        </div>
      )}
    </div>
  )
}

// 響應式圖片組件 - 使用 padding-bottom 技巧確保高度
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = 'aspect-square',
  className = '',
  productId,
  ...props
}: OptimizedImageProps & {
  aspectRatio?: string
}) {
  // 將 aspectRatio 轉換為 padding-bottom 百分比
  const paddingBottomMap: Record<string, string> = {
    'aspect-square': '100%', // 1:1
    'aspect-video': '56.25%', // 16:9
    'aspect-[4/3]': '75%', // 4:3
    'aspect-[3/2]': '66.67%', // 3:2
    'aspect-[2/1]': '50%', // 2:1
  }

  const paddingBottom = paddingBottomMap[aspectRatio] || '100%'

  return (
    <div className={`relative overflow-hidden ${className}`}>
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
}

// 頭像圖片組件
export function AvatarImage({
  src,
  alt,
  size = 'md',
  className = '',
  ...props
}: OptimizedImageProps & {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  }

  const sizePx = {
    sm: { width: 32, height: 32 },
    md: { width: 48, height: 48 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={sizePx[size].width}
      height={sizePx[size].height}
      className={`rounded-full object-cover ${sizeClasses[size]} ${className}`}
      {...props}
    />
  )
}

// === 兼容性別名 - 方便遷移 ===

// SafeImage 兼容性別名 - 啟用多層 fallback
export function SafeImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} enableMultiLevelFallback={true} />
}

// SimpleImage 兼容性別名 - 啟用錯誤詳情顯示
export function SimpleImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} showErrorDetails={true} />
}

// SimpleImage 響應式組件的兼容性別名
export function ResponsiveSimpleImage({
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
    <div className={`relative ${aspectRatio} overflow-hidden ${className}`}>
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
}

// SimpleImage 頭像組件的兼容性別名
export function AvatarSimpleImage({
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
}
