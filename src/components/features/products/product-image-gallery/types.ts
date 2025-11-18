import { Product } from '@/types/product'

/**
 * ProductImageGallery Props
 */
export interface ProductImageGalleryProps {
  /** 商品資料 */
  product: Product
  /** 自訂樣式類別 */
  className?: string
  /** 是否顯示縮圖導航 */
  showThumbnails?: boolean
  /** 是否啟用自動輪播 */
  autoSlide?: boolean
  /** 自動輪播間隔（毫秒） */
  slideInterval?: number
  /** 圖片變更回調 */
  onImageChange?: (index: number) => void
}

/**
 * MainImageDisplay Props
 */
export interface MainImageDisplayProps {
  /** 圖片 URL 陣列 */
  imageUrls: string[]
  /** 當前圖片索引 */
  currentImageIndex: number
  /** 圖片是否已載入 */
  isImageLoaded: boolean
  /** 商品名稱 */
  productName: string
  /** 自訂樣式類別 */
  className?: string
  /** 上一張回調 */
  onPrevious: () => void
  /** 下一張回調 */
  onNext: () => void
  /** 切換到指定索引回調 */
  onImageChange: (index: number) => void
  /** 圖片載入完成回調 */
  onImageLoad: () => void
}

/**
 * ImageThumbnails Props
 */
export interface ImageThumbnailsProps {
  /** 圖片 URL 陣列 */
  imageUrls: string[]
  /** 當前圖片索引 */
  currentImageIndex: number
  /** 商品名稱 */
  productName: string
  /** 切換到指定索引回調 */
  onImageChange: (index: number) => void
}

/**
 * useImageGallery Hook Return Type
 */
export interface UseImageGalleryReturn {
  /** 圖片 URL 陣列 */
  imageUrls: string[]
  /** 當前圖片索引 */
  currentImageIndex: number
  /** 圖片是否已載入 */
  isImageLoaded: boolean
  /** 切換到指定索引 */
  handleImageChange: (index: number) => void
  /** 切換到上一張 */
  handlePrevious: () => void
  /** 切換到下一張 */
  handleNext: () => void
  /** 圖片載入完成 */
  handleImageLoad: () => void
}
