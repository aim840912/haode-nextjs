'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import { OptimizedImage } from '@/components/ui/image/OptimizedImage'
import { cn } from '@/lib/utils/cn'
import { generateImageUrlsFromSupabaseUrl, preloadImages } from '@/lib/utils/image-utils'
import { Product } from '@/types/product'

interface ProductImageGalleryProps {
  product: Product
  className?: string
  showThumbnails?: boolean
  autoSlide?: boolean
  slideInterval?: number
  onImageChange?: (index: number) => void
}

export function ProductImageGallery({
  product,
  className = '',
  showThumbnails = true,
  autoSlide = false,
  slideInterval = 5000,
  onImageChange,
}: ProductImageGalleryProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)

  // 處理圖片數據
  const imageUrls = useMemo(
    () =>
      product.productImages && product.productImages.length > 0
        ? product.productImages.map(img => img.storage_url)
        : ['/images/placeholder.jpg'],
    [product.productImages]
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
      {/* 主圖片顯示區域 - 優雅框架內的圖片 */}
      <div
        className={cn(
          'relative bg-white overflow-hidden group',
          className.includes('elegant-frame')
            ? 'rounded-lg'
            : 'rounded-2xl shadow-2xl shadow-black/10 border border-white/20'
        )}
      >
        {/* 圖片容器 - 適應父容器高度 */}
        <div
          className={cn('relative', className.includes('h-full') && 'h-full min-h-[300px]')}
          style={!className.includes('h-full') ? { paddingBottom: '100%' } : {}}
        >
          <Image
            src={imageUrls[currentImageIndex]}
            alt={`${product.name} - 圖片 ${currentImageIndex + 1}`}
            fill
            className="object-cover transition-all duration-700 hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={currentImageIndex === 0}
            onLoad={handleImageLoad}
          />

          {/* 優雅框架專用的細緻覆蓋層 */}
          {className.includes('elegant-frame') ? (
            <>
              {/* 內側陰影邊框 */}
              <div className="absolute inset-0 shadow-inner shadow-amber-900/10" />
              {/* 微妙的暖色調覆蓋 */}
              <div className="absolute inset-0 bg-gradient-to-tr from-amber-50/10 via-transparent to-orange-50/10 pointer-events-none" />
            </>
          ) : (
            <>
              {/* 精緻的內陰影邊框 */}
              <div className="absolute inset-0 shadow-inner shadow-black/5 rounded-2xl" />
              {/* 玻璃效果覆蓋層 */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/10 pointer-events-none" />
            </>
          )}
        </div>

        {/* 圖片載入狀態 - 精緻的載入動畫 */}
        {!isImageLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50/50 backdrop-blur-sm">
            <div className="relative mb-4">
              {/* 外圈旋轉動畫 */}
              <div className="animate-spin rounded-full h-14 w-14 border-4 border-amber-200/50 border-t-amber-500"></div>
              {/* 內圈反向旋轉 */}
              <div className="absolute inset-1 animate-spin-reverse rounded-full h-12 w-12 border-3 border-orange-200/50 border-b-orange-400"></div>
              {/* 中心點 */}
              <div className="absolute inset-4 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg"></div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium text-gray-700 animate-pulse">載入圖片中</p>
              <div className="flex space-x-1 justify-center">
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                ></div>
                <div
                  className="w-2 h-2 bg-amber-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* 導航按鈕 - 優雅框架風格 */}
        {imageUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className={cn(
                'absolute left-2 top-1/2 -translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110',
                className.includes('elegant-frame')
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 hover:text-amber-900 p-2 rounded-lg shadow-md border border-amber-200/50'
                  : 'bg-white/90 hover:bg-white text-gray-700 hover:text-amber-600 p-3 rounded-full shadow-lg hover:shadow-xl backdrop-blur-sm'
              )}
              aria-label="上一張圖片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className={cn(
                'absolute right-2 top-1/2 -translate-y-1/2 transition-all duration-300 opacity-0 group-hover:opacity-100 hover:scale-110',
                className.includes('elegant-frame')
                  ? 'bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 text-amber-800 hover:text-amber-900 p-2 rounded-lg shadow-md border border-amber-200/50'
                  : 'bg-white/90 hover:bg-white text-gray-700 hover:text-amber-600 p-3 rounded-full shadow-lg hover:shadow-xl backdrop-blur-sm'
              )}
              aria-label="下一張圖片"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* 圖片指示器 - 現代化設計 */}
        {imageUrls.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 backdrop-blur-sm rounded-full px-3 py-2">
            {imageUrls.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={cn(
                  'w-3 h-3 rounded-full transition-all duration-300 hover:scale-125',
                  index === currentImageIndex
                    ? 'bg-white shadow-lg'
                    : 'bg-white/60 hover:bg-white/80'
                )}
                aria-label={`切換到第 ${index + 1} 張圖片`}
              />
            ))}
          </div>
        )}

        {/* 圖片計數器 - 現代化設計 */}
        {imageUrls.length > 1 && (
          <div className="absolute top-4 right-4 bg-white/90 hover:bg-white text-gray-700 px-3 py-2 rounded-full text-sm font-medium shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105">
            <span className="text-amber-600 font-bold">{currentImageIndex + 1}</span>
            <span className="mx-1 text-gray-400">/</span>
            <span>{imageUrls.length}</span>
          </div>
        )}
      </div>

      {/* 縮圖列表 - 現代化設計 */}
      {showThumbnails && imageUrls.length > 1 && (
        <div className="flex space-x-3 overflow-x-auto pb-2 px-1">
          {imageUrls.map((url, index) => (
            <button
              key={index}
              onClick={() => handleImageChange(index)}
              className={cn(
                'flex-shrink-0 w-18 h-18 rounded-xl overflow-hidden transition-all duration-300 hover:scale-110',
                index === currentImageIndex
                  ? 'ring-2 ring-gray-400 shadow-lg shadow-gray-400/20 scale-105'
                  : 'ring-2 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
              )}
            >
              <OptimizedImage
                src={url}
                alt={`${product.name} 縮圖 ${index + 1}`}
                width={72}
                height={72}
                className="w-full h-full object-cover transition-transform duration-300"
                lazy={false}
              />
            </button>
          ))}
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
    (product.productImages && product.productImages.length > 0
      ? product.productImages[0].storage_url
      : null) || '/images/placeholder.jpg'

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
    <div className={cn('relative overflow-hidden rounded-lg', className)}>
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
    (product.productImages && product.productImages.length > 0
      ? product.productImages[0].storage_url
      : null) || '/images/placeholder.jpg'

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
    <div className={cn('relative overflow-hidden', className)}>
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
    </div>
  )
}
