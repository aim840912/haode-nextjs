import { Product } from '@/types/product'

/**
 * 擴展的產品型別，包含額外的詳細資訊
 */
export interface ExtendedProduct extends Product {
  /** 產品特色列表 */
  features?: string[]
  /** 產品規格列表 */
  specifications?: { label: string; value: string }[]
  /** 產品圖片 URL */
  image?: string
  /** 原始價格（用於顯示折扣） */
  originalPrice?: number
  /** 價格單位（如：斤、公斤） */
  priceUnit?: string
  /** 單位數量 */
  unitQuantity?: number
}

/**
 * ProductDetailModal 主元件的 Props
 */
export interface ProductDetailModalProps {
  /** 選中的產品 */
  product: ExtendedProduct
  /** 是否為感興趣的產品 */
  isInterested: boolean
  /** 關閉 Modal */
  onClose: () => void
  /** 興趣切換事件 */
  onToggleInterest: (productId: string, productName: string) => void
  /** 詢問報價事件 */
  onRequestQuote: (product: ExtendedProduct) => Promise<void> | void
}
