import React from 'react'
import { OptimizedImageProps } from '../types'
import { OptimizedImage } from '../components/OptimizedImage'

/**
 * SafeImage 兼容性別名 - 啟用多層 fallback
 */
export const SafeImage = React.memo(function SafeImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} enableMultiLevelFallback={true} />
})
