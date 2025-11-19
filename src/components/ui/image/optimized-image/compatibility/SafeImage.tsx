import React from 'react'
import { OptimizedImage } from '../components/OptimizedImage'
import { OptimizedImageProps } from '../types'

/**
 * SafeImage 兼容性別名 - 啟用多層 fallback
 */
export const SafeImage = React.memo(function SafeImage(props: OptimizedImageProps) {
  return <OptimizedImage {...props} enableMultiLevelFallback={true} />
})
