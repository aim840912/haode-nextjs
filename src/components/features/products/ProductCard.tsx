import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Product } from '@/types/product'
import { InterestButton } from './InterestButton'
import { cn } from '@/lib/utils'
import { Star, ShoppingCart, Eye, Share2 } from 'lucide-react'
import { logger } from '@/lib/logger'

// 動態載入圖片元件以提升效能
const ProductCardImage = dynamic(
  () =>
    import('@/components/features/products/ProductImageGallery').then(mod => ({
      default: mod.ProductCardImage,
    })),
  {
    loading: () => <div className="h-64 bg-gray-100 rounded-t-xl animate-pulse"></div>,
    ssr: false,
  }
)

interface ProductCardProps {
  /** 產品資料 */
  product: Product
  /** 產品索引 */
  index: number
  /** 是否為感興趣的產品 */
  isInterested: boolean
  /** 產品點擊事件 */
  onProductClick: (product: Product) => void
  /** 興趣切換事件 */
  onToggleInterest: (productId: string, productName: string, e?: React.MouseEvent) => void
}

/**
 * 產品卡片組件 - 電商精品風格
 *
 * 特色：
 * - 奢華的漸變色彩設計
 * - 精緻的多層陰影系統
 * - 快速操作工具列
 * - 產品評級和標籤系統
 * - 高端購物體驗設計
 * - 完整的響應式支援
 */
export const ProductCard = React.memo<ProductCardProps>(
  ({ product, index, isInterested, onProductClick, onToggleInterest }) => {
    const [isHovered, setIsHovered] = useState(false)
    const [showQuickActions, setShowQuickActions] = useState(false)

    const handleCardClick = () => {
      onProductClick(product)
    }

    const handleViewDetails = (e: React.MouseEvent) => {
      e.stopPropagation()
      if (product.inventory > 0) {
        onProductClick(product)
      }
    }

    const handleQuickAction = (action: string, e: React.MouseEvent) => {
      e.stopPropagation()
      // 這裡可以實作快速操作功能
      logger.debug('產品快速操作', {
        module: 'ProductCard',
        action: 'handleQuickAction',
        metadata: { action, productId: product.id },
      })
    }

    return (
      <div
        className={cn(
          // 基礎樣式 - 簡潔背景
          'group relative bg-white',
          'cursor-pointer overflow-hidden rounded-xl',
          // 簡潔陰影系統
          'shadow-lg hover:shadow-xl',
          // 簡潔邊框
          'border border-gray-200',
          // 動畫效果
          'transition-all duration-300 ease-out',
          'hover:-translate-y-2 hover:scale-[1.01]',
          // 響應式
          'w-full max-w-sm mx-auto'
        )}
        onClick={handleCardClick}
        onMouseEnter={() => {
          setIsHovered(true)
          setShowQuickActions(true)
        }}
        onMouseLeave={() => {
          setIsHovered(false)
          setShowQuickActions(false)
        }}
      >
        {/* 產品標籤系統 */}
        <div className="absolute top-4 left-4 z-20 space-y-2 max-w-[calc(100%-120px)] sm:max-w-[calc(100%-100px)]">
          {/* 促銷標籤 */}
          {product.originalPrice && product.originalPrice > product.price && (
            <div className="inline-flex items-center bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg max-w-full">
              <Star className="w-3 h-3 mr-1 fill-current flex-shrink-0" />
              <span className="truncate">特價</span>
            </div>
          )}

          {/* 類別標籤 */}
          <div className="inline-block bg-gray-600 text-white text-xs font-medium px-3 py-1 rounded-full shadow-md max-w-full">
            <span className="truncate">{product.category}</span>
          </div>
        </div>

        {/* 快速操作工具列 */}
        <div
          className={cn(
            'absolute top-4 right-4 z-30 flex flex-col gap-2 sm:top-3 sm:right-3',
            'transform transition-all duration-300',
            showQuickActions ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-70'
          )}
        >
          {/* 興趣按鈕 */}
          <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 shadow-lg">
            <InterestButton
              productId={product.id}
              productName={product.name}
              isInterested={isInterested}
              onToggle={onToggleInterest}
              variant="icon"
              size="sm"
            />
          </div>

          {/* 分享 */}
          <button
            onClick={e => handleQuickAction('share', e)}
            className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white transition-colors duration-200"
          >
            <Share2 className="w-4 h-4 text-gray-700" />
          </button>
        </div>

        {/* 產品圖片 */}
        <div className="relative overflow-hidden rounded-t-xl">
          <ProductCardImage product={product} index={index} />

          {/* 圖片遮罩 */}
          <div
            className={cn(
              'absolute inset-0 transition-opacity duration-300',
              'bg-black/20',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>

        {/* 產品資訊區域 */}
        <div className="p-6 space-y-4">
          {/* 產品名稱和評分 */}
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-amber-900 transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          {/* 價格區域 */}
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              {/* 現價 */}
              <span className="text-2xl font-bold text-gray-900">
                NT$ {product.price}
                {product.priceUnit && (
                  <span className="text-sm font-normal text-gray-600 ml-1">
                    / {product.priceUnit}
                  </span>
                )}
              </span>

              {/* 原價和折扣 */}
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 line-through">
                    NT$ {product.originalPrice}
                  </span>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                    -
                    {Math.round(
                      ((product.originalPrice - product.price) / product.originalPrice) * 100
                    )}
                    %
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 操作按鈕組 */}
          <div className="flex gap-3">
            {/* 主要操作按鈕 */}
            <button
              className={cn(
                'flex-1 flex items-center justify-center py-3 rounded-lg text-sm font-medium transition-all duration-300',
                'shadow-md hover:shadow-lg transform hover:scale-[1.02]',
                product.inventory > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              )}
              disabled={product.inventory <= 0}
              onClick={handleViewDetails}
            >
              {product.inventory > 0 ? '查看詳情' : '暫時缺貨'}
            </button>

            {/* 快速購買按鈕 */}
            {product.inventory > 0 && (
              <button
                onClick={e => handleQuickAction('addtocart', e)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 p-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
)

ProductCard.displayName = 'ProductCard'
