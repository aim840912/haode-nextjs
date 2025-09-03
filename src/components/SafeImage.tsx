'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger'

interface SafeImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fallbackSrc?: string
}

// Base64 編碼的 1x1 灰色像素作為最終 fallback
const BASE64_PLACEHOLDER = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNiAxNkwyNCAxNkwyNCAyNEwxNiAyNFYxNloiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+'

export default function SafeImage({ 
  src, 
  alt, 
  width, 
  height, 
  fill, 
  className, 
  sizes, 
  priority,
  fallbackSrc = '/images/placeholder.jpg'
}: SafeImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc)
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // 重置錯誤狀態當 src 改變時
  useEffect(() => {
    setHasError(false)
    setIsLoading(true)
    setImgSrc(src || fallbackSrc)
  }, [src, fallbackSrc])

  const handleError = () => {
    logger.warn('SafeImage: 圖片載入失敗', { imgSrc, module: 'SafeImage', action: 'handleError' })
    if (!hasError) {
      setHasError(true)
      setIsLoading(false)
      
      // 如果當前是 fallbackSrc 也失敗了，使用 base64 placeholder
      if (imgSrc === fallbackSrc) {
        setImgSrc(BASE64_PLACEHOLDER)
      } else {
        setImgSrc(fallbackSrc)
      }
    } else if (imgSrc === fallbackSrc && imgSrc !== BASE64_PLACEHOLDER) {
      // Fallback 也失敗了，使用 base64 placeholder
      setImgSrc(BASE64_PLACEHOLDER)
    }
  }

  const handleLoad = () => {
    setIsLoading(false)
  }

  // 確保 src 有效，如果無效則直接使用 fallback
  const safeSrc = imgSrc || fallbackSrc

  // 添加一個驗證函數來確保圖片路徑有效
  const isValidImageSrc = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false
    
    // 檢查是否為有效的 URL 或路徑
    try {
      if (url.startsWith('http') || url.startsWith('https')) {
        new URL(url)
        return true
      }
      // 本地路徑應該以 / 開始
      return url.startsWith('/')
    } catch {
      return false
    }
  }

  // 如果圖片源不有效，使用 fallback；如果 fallback 也無效，使用 base64 placeholder
  const finalSrc = isValidImageSrc(safeSrc) ? safeSrc : 
                   isValidImageSrc(fallbackSrc) ? fallbackSrc : BASE64_PLACEHOLDER

  if (fill) {
    return (
      <>
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
        )}
        <Image
          src={finalSrc}
          alt={alt}
          fill
          className={className}
          sizes={sizes}
          priority={priority}
          onError={handleError}
          onLoad={handleLoad}
          unoptimized={hasError} // 當有錯誤時停用優化
        />
      </>
    )
  }

  return (
    <div className="relative inline-block">
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse rounded"
          style={{ width: width || 100, height: height || 100 }}
        />
      )}
      <Image
        src={finalSrc}
        alt={alt}
        width={width || 100}
        height={height || 100}
        className={className}
        sizes={sizes}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={hasError} // 當有錯誤時停用優化
      />
    </div>
  )
}