'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { ImageThumbnails } from './ImageThumbnails'
import { MainImageDisplay } from './MainImageDisplay'
import { ProductImageGalleryProps } from './types'
import { useImageGallery } from './useImageGallery'

/**
 * 產品圖片輪播元件
 *
 * **重構說明**:
 * - 原始 264 行縮減為 ~60 行
 * - 業務邏輯抽取到 useImageGallery hook
 * - 主圖展示拆分為 MainImageDisplay 元件
 * - 縮圖導航拆分為 ImageThumbnails 元件
 * - 主元件只負責 UI 編排
 */
export function ProductImageGallery({
  product,
  className = '',
  showThumbnails = true,
  autoSlide = false,
  slideInterval = 5000,
  onImageChange,
}: ProductImageGalleryProps) {
  const {
    imageUrls,
    currentImageIndex,
    isImageLoaded,
    handleImageChange,
    handlePrevious,
    handleNext,
    handleImageLoad,
  } = useImageGallery(product, autoSlide, slideInterval, onImageChange)

  // 無圖片狀態
  if (imageUrls.length === 0) {
    return (
      <div className={cn('flex items-center justify-center bg-gray-100', className)}>
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-2">📷</div>
          <div>暫無商品圖片</div>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* 主圖片顯示區域 */}
      <MainImageDisplay
        imageUrls={imageUrls}
        currentImageIndex={currentImageIndex}
        isImageLoaded={isImageLoaded}
        productName={product.name}
        className={className}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onImageChange={handleImageChange}
        onImageLoad={handleImageLoad}
      />

      {/* 縮圖列表 */}
      {showThumbnails && (
        <ImageThumbnails
          imageUrls={imageUrls}
          currentImageIndex={currentImageIndex}
          productName={product.name}
          onImageChange={handleImageChange}
        />
      )}
    </div>
  )
}
