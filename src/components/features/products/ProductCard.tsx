import React from 'react'
import dynamic from 'next/dynamic'
import { Product } from '@/types/product'
import { InterestButton } from './InterestButton'

// 動態載入圖片元件以提升效能
const ProductCardImage = dynamic(
  () =>
    import('@/components/features/products/ProductImageGallery').then(mod => ({
      default: mod.ProductCardImage,
    })),
  {
    loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

interface ExtendedProduct extends Product {
  features?: string[]
  specifications?: { label: string; value: string }[]
  inStock?: boolean
  image?: string
  allImages?: string[]
  originalPrice?: number
  priceUnit?: string
  unitQuantity?: number
  productCardProps?: {
    id: string
    name: string
    images: string[]
    thumbnailUrl: string
    primaryImageUrl: string
    inventory: number
    isOnSale: boolean
    category: string
    price: number
    description: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
}

interface ProductCardProps {
  /** 產品資料 */
  product: ExtendedProduct
  /** 產品索引 */
  index: number
  /** 是否為感興趣的產品 */
  isInterested: boolean
  /** 產品點擊事件 */
  onProductClick: (product: ExtendedProduct) => void
  /** 興趣切換事件 */
  onToggleInterest: (productId: string, productName: string, e?: React.MouseEvent) => void
}

/**
 * 產品卡片元件
 *
 * 負責顯示單一產品的資訊：
 * - 產品圖片
 * - 基本資訊（名稱、類別、價格）
 * - 興趣按鈕
 * - 操作按鈕（查看詳情、缺貨狀態）
 * - 響應式設計
 */
export const ProductCard = React.memo<ProductCardProps>(
  ({ product, index, isInterested, onProductClick, onToggleInterest }) => {
    const handleCardClick = () => {
      onProductClick(product)
    }

    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (product.inStock) {
        onProductClick(product)
      }
    }

    return (
      <div
        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
        onClick={handleCardClick}
      >
        {/* 產品圖片 */}
        {product.productCardProps && (
          <ProductCardImage product={product.productCardProps} index={index} />
        )}

        {/* 產品資訊 */}
        <div className="p-6">
          {/* 類別 */}
          <div className="text-sm text-amber-600 mb-2">{product.category}</div>

          {/* 產品名稱 */}
          <h3 className="text-xl font-semibold text-gray-800 mb-6">{product.name}</h3>

          {/* 操作按鈕區域 */}
          <div className="flex items-center gap-2 mb-4">
            {/* 興趣按鈕 */}
            <InterestButton
              productId={product.id}
              productName={product.name}
              isInterested={isInterested}
              onToggle={onToggleInterest}
              variant="icon"
              size="md"
            />

            {/* 查看詳情按鈕 */}
            <button
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                product.inStock
                  ? 'bg-amber-900 text-white hover:bg-amber-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              disabled={!product.inStock}
              onClick={handleViewDetails}
            >
              {product.inStock ? '查看詳情' : '暫時缺貨'}
            </button>
          </div>

          {/* 價格區域 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* 現價 */}
              <span className="text-2xl font-bold text-amber-900 whitespace-nowrap">
                NT$ {product.price}
                {product.priceUnit ? ` / ${product.priceUnit}` : ''}
              </span>

              {/* 原價（如果有折扣） */}
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm text-gray-500 line-through whitespace-nowrap">
                  NT$ {product.originalPrice}
                </span>
              )}
            </div>

            {/* 庫存狀態指示器 */}
            <div
              className={`text-xs px-2 py-1 rounded-full ${
                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              {product.inStock ? '有庫存' : '缺貨'}
            </div>
          </div>

          {/* 促銷標籤 */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
              特價
            </div>
          )}
        </div>
      </div>
    )
  }
)

ProductCard.displayName = 'ProductCard'
