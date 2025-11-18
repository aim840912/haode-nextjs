import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger'
import { BASE64_PLACEHOLDER } from '../types'

interface UseImageErrorHandlingOptions {
  src: string
  alt: string
  fallbackSrc?: string
  enableMultiLevelFallback?: boolean
  onError?: (error?: string) => void
  isValidImageSrc: (url: string) => boolean
}

/**
 * 圖片錯誤處理和 fallback 邏輯 Hook
 */
export function useImageErrorHandling({
  src,
  alt,
  fallbackSrc = '/images/placeholder.jpg',
  enableMultiLevelFallback = false,
  onError,
  isValidImageSrc,
}: UseImageErrorHandlingOptions) {
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  // 重置錯誤狀態當 src 改變時
  useEffect(() => {
    setHasError(false)
    setCurrentSrc(src)
  }, [src])

  /**
   * 錯誤處理回調
   */
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

  /**
   * 確保 src 有效，如果無效則使用 fallback
   */
  const safeSrc = isValidImageSrc(currentSrc)
    ? currentSrc
    : isValidImageSrc(fallbackSrc)
      ? fallbackSrc
      : BASE64_PLACEHOLDER

  return {
    hasError,
    currentSrc,
    safeSrc,
    handleErrorCallback,
  }
}
