'use client'

import Image from 'next/image'
import { useState } from 'react'

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

  const handleError = () => {
    if (!hasError && imgSrc !== fallbackSrc) {
      setHasError(true)
      setImgSrc(fallbackSrc)
    }
  }

  // 確保 src 有效，如果無效則直接使用 fallback
  const safeSrc = imgSrc || fallbackSrc

  if (fill) {
    return (
      <Image
        src={safeSrc}
        alt={alt}
        fill
        className={className}
        sizes={sizes}
        priority={priority}
        onError={handleError}
      />
    )
  }

  return (
    <Image
      src={safeSrc}
      alt={alt}
      width={width || 100}
      height={height || 100}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={handleError}
    />
  )
}