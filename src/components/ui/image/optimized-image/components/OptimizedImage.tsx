'use client'

import { useCallback } from 'react'
import Image from 'next/image'
import { useImageBlob } from '@/hooks/useImageBlob'
import { cn } from '@/lib/utils/cn'
import { handleImageError } from '@/lib/utils/image-utils'
import { useImageErrorHandling } from '../hooks/useImageErrorHandling'
import { useImageLazyLoad } from '../hooks/useImageLazyLoad'
import { useImageValidation } from '../hooks/useImageValidation'
import {
  OptimizedImageProps,
  DEFAULT_BLUR_DATA_URL,
  RESPONSIVE_SIZES,
  DEFAULT_SIZES,
} from '../types'
import { ImageErrorState } from './ImageErrorState'
import { ImageLoadingState } from './ImageLoadingState'

/**
 * OptimizedImage 元件
 *
 * 功能強化的圖片元件，支援懶加載、錯誤處理、響應式圖片等功能
 *
 * ⚠️ 已知限制：
 * - fill 模式在配合 aspect-ratio 使用時可能有填充問題
 * - 建議關鍵視覺區域（Hero、特色區塊）使用 CSS background-image 替代
 * - 一般產品圖片使用預設模式（width/height）即可正常運作
 *
 * @example
 * // ✅ 推薦：一般圖片使用
 * <OptimizedImage src="/image.jpg" alt="描述" width={300} height={200} />
 *
 * // ⚠️ 注意：fill 模式可能有問題，建議改用 CSS background-image
 * <div style={{ backgroundImage: 'url(/image.jpg)', backgroundSize: 'cover' }} />
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  sizes,
  priority = false,
  quality = 80,
  placeholder = 'blur',
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
  const { isValidImageSrc, needsCrossOrigin, isBase64OrBlob } = useImageValidation()
  const { imgRef, shouldLoad } = useImageLazyLoad({ priority, lazy, threshold })

  // 錯誤處理
  const { hasError, safeSrc, handleErrorCallback } = useImageErrorHandling({
    src,
    alt,
    fallbackSrc,
    enableMultiLevelFallback,
    onError,
    isValidImageSrc,
  })

  // 使用 useCallback 穩定回調函數引用
  const handleLoadCallback = useCallback(() => {
    onLoad?.()
  }, [onLoad])

  // 使用圖片 Blob Hook
  const { processedSrc, isLoading, error, isBase64 } = useImageBlob(safeSrc, {
    fallbackSrc,
    onLoad: handleLoadCallback,
    onError: handleErrorCallback,
  })

  const handleLoad = () => {
    // Image loaded successfully
  }

  const handleError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    handleImageError(event, fallbackSrc)
  }

  // 響應式圖片處理 - 優化的 sizes 配置
  const finalSrc = shouldLoad && processedSrc ? processedSrc : ''
  const finalSizes = enableResponsive && productId ? RESPONSIVE_SIZES : sizes || DEFAULT_SIZES

  // 判斷是否使用原生 img 標籤
  const shouldUseNativeImg = isBase64OrBlob(finalSrc) || !isValidImageSrc(finalSrc)

  const containerClassName = cn('relative overflow-hidden', className)

  if (fill) {
    return (
      <div ref={imgRef} className={containerClassName}>
        <ImageLoadingState shouldLoad={shouldLoad} isLoading={isLoading} />
        {shouldLoad &&
          finalSrc &&
          (shouldUseNativeImg ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={finalSrc}
              alt={alt}
              {...(needsCrossOrigin(finalSrc) && { crossOrigin: 'anonymous' })}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              onLoad={handleLoad}
              onError={handleError}
              style={{ objectFit: 'cover' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={finalSrc}
              alt={alt}
              {...(needsCrossOrigin(finalSrc) && { crossOrigin: 'anonymous' })}
              className={cn(
                'w-full h-full object-cover transition-opacity duration-300',
                isLoading ? 'opacity-0' : 'opacity-100'
              )}
              style={{ objectFit: 'cover' }}
              onLoad={handleLoad}
              onError={handleError}
            />
          ))}
        <ImageErrorState
          error={error}
          showErrorDetails={showErrorDetails}
          isBase64={isBase64}
          hasError={hasError}
          enableMultiLevelFallback={enableMultiLevelFallback}
        />
      </div>
    )
  }

  return (
    <div ref={imgRef} className={containerClassName}>
      <ImageLoadingState shouldLoad={shouldLoad} isLoading={isLoading} />
      {shouldLoad &&
        finalSrc &&
        (shouldUseNativeImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={finalSrc}
            alt={alt}
            {...(needsCrossOrigin(finalSrc) && { crossOrigin: 'anonymous' })}
            width={width || 400}
            height={height || 300}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            style={{ objectFit: 'cover', maxWidth: '100%', height: 'auto' }}
          />
        ) : (
          <Image
            src={finalSrc}
            alt={alt}
            width={width || 400}
            height={height || 300}
            sizes={finalSizes}
            priority={priority}
            quality={quality}
            placeholder={placeholder}
            blurDataURL={blurDataURL || DEFAULT_BLUR_DATA_URL}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleLoad}
            onError={handleError}
          />
        ))}
      <ImageErrorState
        error={error}
        showErrorDetails={showErrorDetails}
        isBase64={isBase64}
        hasError={hasError}
        enableMultiLevelFallback={enableMultiLevelFallback}
      />
    </div>
  )
}
