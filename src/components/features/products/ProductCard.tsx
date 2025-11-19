'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Star, ShoppingCart, Heart } from 'lucide-react'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { useToast } from '@/providers/ToastProvider'
import { Product } from '@/types/product'

// 動態載入圖片元件以提升效能
const ProductCardImage = dynamic(
  () =>
    import('@/components/features/products/ProductImageGallery').then(mod => ({
      default: mod.ProductCardImage,
    })),
  {
    loading: () => (
      <div className="relative rounded-t-xl overflow-hidden">
        <div className="pb-[133.33%] bg-gray-100 animate-pulse"></div>
      </div>
    ),
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
 * 產品卡片組件 - momo 風格設計
 *
 * 特色：
 * - 3:4 垂直圖片比例（符合商品攝影習慣）
 * - 4 列桌面佈局（與 momo 一致）
 * - 300px 卡片寬度（平衡視覺與資訊密度）
 * - 簡潔的色彩設計和陰影系統
 * - 完整的響應式支援
 */
export const ProductCard = React.memo<ProductCardProps>(
  ({ product, index, isInterested, onProductClick, onToggleInterest }) => {
    const { addToast } = useToast()
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

    const handleQuickAction = async (action: string, e: React.MouseEvent) => {
      e.stopPropagation()

      if (action === 'share') {
        // 分享功能
        const shareUrl = `${window.location.origin}/products?id=${product.id}`
        const shareData = {
          title: product.name,
          text: `查看這個產品：${product.name}`,
          url: shareUrl,
        }

        try {
          // 優先使用 Web Share API（行動裝置支援）
          if (navigator.share) {
            await navigator.share(shareData)
          } else {
            // 備援方案：複製連結到剪貼簿
            await navigator.clipboard.writeText(shareUrl)
            addToast('連結已複製到剪貼簿！', 'success', 3000)
          }
        } catch (error) {
          // AbortError 是使用者取消分享，不需要顯示錯誤
          if ((error as Error).name !== 'AbortError') {
            logger.error('產品分享失敗', error as Error, {
              module: 'ProductCard',
              action: 'handleShare',
              metadata: { productId: product.id, productName: product.name },
            })
            // 最終備援：顯示連結讓使用者手動複製
            addToast(`請複製此連結分享：${shareUrl}`, 'info', 5000)
          }
        }
      } else {
        // 其他快速操作功能
        logger.debug('產品快速操作', {
          module: 'ProductCard',
          action: 'handleQuickAction',
          metadata: { action, productId: product.id },
        })
      }
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
          // 響應式 - momo 風格設計
          'w-full max-w-[300px] mx-auto'
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
        <div className="p-2.5 space-y-2">
          {/* 產品名稱和評分 */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-amber-900 transition-colors duration-300">
              {product.name}
            </h3>
          </div>

          {/* 價格區域 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {/* 現價 */}
              <span className="text-xl font-bold text-gray-900">
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
          <div>
            {/* 主要操作按鈕 */}
            <button
              disabled={(product.availableStock ?? product.inventory) <= 0}
              onClick={handleViewDetails}
              className={cn(
                'w-full flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md',
                (product.availableStock ?? product.inventory) <= 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
              aria-label={
                (product.availableStock ?? product.inventory) > 0 ? '查看產品詳情' : '產品暫時缺貨'
              }
            >
              <span className="text-sm font-medium">
                {(product.availableStock ?? product.inventory) > 0 ? '查看詳情' : '暫時缺貨'}
              </span>
            </button>
          </div>

          {/* 收藏和加入購物車按鈕行 */}
          <div className="flex gap-2 justify-between pt-1">
            {/* 收藏按鈕 */}
            <button
              onClick={e => {
                e.stopPropagation()
                onToggleInterest(product.id, product.name, e)
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors duration-200 shadow-sm hover:shadow-md"
              aria-label={isInterested ? '移除我的收藏' : '加入我的收藏'}
            >
              <Heart
                className={cn(
                  'w-4 h-4',
                  isInterested ? 'fill-red-500 text-red-500' : 'text-gray-600'
                )}
              />
              <span className="text-sm font-medium">{isInterested ? '已收藏' : '收藏'}</span>
            </button>

            {/* 加入購物車按鈕 */}
            <button
              onClick={e => handleQuickAction('addtocart', e)}
              disabled={(product.availableStock ?? product.inventory) <= 0}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 border border-gray-300 py-2 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md',
                (product.availableStock ?? product.inventory) <= 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
              aria-label="加入購物車"
            >
              <ShoppingCart className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium">購物車</span>
            </button>
          </div>
        </div>
      </div>
    )
  }
)

ProductCard.displayName = 'ProductCard'
