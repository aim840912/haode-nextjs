import { useEffect, useMemo, useState } from 'react'
import { preloadImages } from '@/lib/utils/image-utils'
import { Product } from '@/types/product'
import { UseImageGalleryReturn } from './types'

/**
 * 圖片輪播業務邏輯 Hook
 *
 * 負責：
 * - 圖片數據處理
 * - 圖片預載入
 * - 自動輪播邏輯
 * - 導航控制
 * - 圖片載入狀態管理
 *
 * @param product - 商品資料
 * @param autoSlide - 是否啟用自動輪播
 * @param slideInterval - 自動輪播間隔（毫秒）
 * @param onImageChange - 圖片變更回調
 */
export function useImageGallery(
  product: Product,
  autoSlide: boolean,
  slideInterval: number,
  onImageChange?: (index: number) => void
): UseImageGalleryReturn {
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

  // 預載入所有圖片
  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls)
    }
  }, [imageUrls])

  // 自動輪播邏輯
  useEffect(() => {
    if (autoSlide && imageUrls.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % imageUrls.length)
      }, slideInterval)

      return () => clearInterval(interval)
    }
  }, [autoSlide, slideInterval, imageUrls.length])

  // 切換到指定索引
  const handleImageChange = (index: number) => {
    setCurrentImageIndex(index)
    setIsImageLoaded(false)
    onImageChange?.(index)
  }

  // 切換到上一張
  const handlePrevious = () => {
    const newIndex = currentImageIndex === 0 ? imageUrls.length - 1 : currentImageIndex - 1
    handleImageChange(newIndex)
  }

  // 切換到下一張
  const handleNext = () => {
    const newIndex = (currentImageIndex + 1) % imageUrls.length
    handleImageChange(newIndex)
  }

  // 圖片載入完成
  const handleImageLoad = () => {
    setIsImageLoaded(true)
  }

  return {
    imageUrls,
    currentImageIndex,
    isImageLoaded,
    handleImageChange,
    handlePrevious,
    handleNext,
    handleImageLoad,
  }
}
