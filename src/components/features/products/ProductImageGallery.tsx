'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { Product } from '@/types/product'
import OptimizedImage from '@/components/ui/image/OptimizedImage'
import { generateImageUrlsFromSupabaseUrl, preloadImages } from '@/lib/utils/image-utils'

interface ProductImageGalleryProps {
  product: Product
  className?: string
  showThumbnails?: boolean
  autoSlide?: boolean
  slideInterval?: number
  onImageChange?: (index: number) => void
}

export default function ProductImageGallery({
  product,
  className = '',
  showThumbnails = true,
  autoSlide = false,
  slideInterval = 5000,
  onImageChange,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // 處理圖片數據，支援新舊格式
  const images =
    product.productImages ||
    product.images.map((url, index) => ({
      id: `${product.id}-${index}`,
      url,
      alt: product.name,
      position: index,
      size: 'medium' as const,
    }))

  // 主圖片URLs，優先使用galleryImages，其次使用第一張圖片
  const imageUrls = useMemo(
    () =>
      product.galleryImages ||
      (images.length > 0
        ? images.map(img => img.url)
        : [product.images[0] || '/images/placeholder.jpg']),
    [product.galleryImages, images, product.images]
  )

  useEffect(() => {
    // 預載入所有圖片
    if (imageUrls.length > 0) {
      preloadImages(imageUrls)
    }
  }, [imageUrls])

  useEffect(() => {
    if (autoSlide && imageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % imageUrls.length)
      }, slideInterval)

      return () => clearInterval(interval)
    }
  }, [autoSlide, slideInterval, imageUrls.length])

  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
    setIsImageLoaded(false)
    onImageChange?.(index)
  }

  const handlePrevious = () => {
    const newIndex = currentImageIndex === 0 ? imageUrls.length - 1 : currentImageIndex - 1
    handleImageChange(newIndex)
  }

  const handleNext = () => {
    const newIndex = (currentImageIndex + 1) % imageUrls.length
    handleImageChange(newIndex)
  }

  const handleImageLoad = () => {
    setIsImageLoaded(true)
  }

  if (imageUrls.length === 0) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-2">📷</div>
          <div>暫無商品圖片</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 主圖片顯示區域 */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden group">
        {/* 使用 padding-bottom 創建響應式容器 */}
        <div style={{ paddingBottom: '100%' }} className="relative">
          <Image
            src={imageUrls[currentImageIndex]}
            alt={`${product.name} - 圖片 ${currentImageIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentImageIndex === 0}
            onLoad={handleImageLoad}
          />
        </div>

        {/* 圖片載入狀態 */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900"></div>
          </div>
        )}

        {/* 導航按鈕 - 只在多張圖片時顯示 */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="上一張圖片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
              aria-label="下一張圖片"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* 圖片指示器 */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`切換到第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
        )}

        {/* 圖片計數器 */}
        {imageUrls.length > 1 && (
          <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
            {currentImageIndex + 1} / {imageUrls.length}
          </div>
        )}
      </div>

      {/* 縮圖列表 */}
      {showThumbnails && imageUrls.length > 1 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {imageUrls.map((url, index) => {
            // 對於縮圖，直接使用主圖 URL 避免產生不存在的縮圖變體
            let thumbnailUrl = url

            // 只有當有明確的 productImages 且有縮圖時才使用
            if (
              product.productImages?.[index]?.url &&
              !product.productImages[index].url.includes('thumbnail-')
            ) {
              thumbnailUrl = product.productImages[index].url
            }

            return (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentImageIndex
                    ? 'border-amber-900 ring-2 ring-amber-900/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <OptimizedImage
                  src={thumbnailUrl}
                  alt={`${product.name} 縮圖 ${index + 1}`}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  lazy={false}
                />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// 簡化版本的產品圖片展示元件
export function SimpleProductImage({
  product,
  size = 'medium',
  className = '',
}: {
  product: Product
  size?: 'thumbnail' | 'medium' | 'large'
  className?: string
}) {
  // 根據所需尺寸選擇最適合的圖片 URL
  let imageUrl =
    product.primaryImageUrl ||
    product.thumbnailUrl ||
    product.images[0] ||
    '/images/placeholder.jpg'

  // 如果是 Supabase Storage URL 且需要特定尺寸，生成對應的縮圖
  if (imageUrl && imageUrl.includes('supabase.co/storage') && size !== 'medium') {
    const imageUrls = generateImageUrlsFromSupabaseUrl(imageUrl)
    imageUrl = imageUrls[size]
  }

  const sizeMap = {
    thumbnail: { width: 200, height: 200 },
    medium: { width: 400, height: 400 },
    large: { width: 600, height: 600 },
  }

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      <OptimizedImage
        src={imageUrl}
        alt={product.name}
        width={sizeMap[size].width}
        height={sizeMap[size].height}
        className="w-full h-full object-cover"
        productId={product.id}
        enableResponsive={true}
      />
    </div>
  )
}

// 產品卡片用的圖片元件 - 直接實作避免嵌套問題
export function ProductCardImage({
  product,
  className = '',
  aspectRatio = 'aspect-square',
  priority = false,
  index = 0,
}: {
  product: Product
  className?: string
  aspectRatio?: string
  priority?: boolean
  index?: number
}) {
  const imageUrl =
    product.thumbnailUrl ||
    product.primaryImageUrl ||
    product.images[0] ||
    '/images/placeholder.jpg'

  // 直接設定 padding-bottom 確保容器有明確高度
  const paddingBottomMap: Record<string, string> = {
    'aspect-square': '100%', // 1:1
    'aspect-video': '56.25%', // 16:9
    'aspect-[4/3]': '75%', // 4:3
    'aspect-[3/2]': '66.67%', // 3:2
    'aspect-[2/1]': '50%', // 2:1
  }

  const paddingBottom = paddingBottomMap[aspectRatio] || '100%'

  // 智能懶載入：前6個產品（首屏可見）優先載入，其他懶載入
  const shouldPrioritize = priority || index < 6
  const loadingStrategy = shouldPrioritize ? 'eager' : 'lazy'

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 使用 padding-bottom 技巧創建響應式容器 */}
      <div style={{ paddingBottom }} className="relative">
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={shouldPrioritize}
          loading={loadingStrategy}
        />
      </div>

      {/* 特價標籤 */}
      {product.isOnSale && (
        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
          特價
        </div>
      )}

      {/* 缺貨標籤 */}
      {product.inventory === 0 && (
        <div className="absolute top-2 right-2 bg-gray-500 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
          缺貨
        </div>
      )}
    </div>
  )
}
