import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { X, Plus, Minus, ShoppingCart, Share2, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types/product'
import { InterestButton } from './InterestButton'
import { TailwindGreenButton } from '@/components/ui/buttons/TailwindGreenButton'
import { useModalAnimation, useEscapeKey, useFocusTrap } from '@/hooks/useModalAnimation'
import { cn } from '@/lib/utils'

// 動態載入圖片畫廊
const ProductImageGallery = dynamic(
  () => import('@/components/features/products/ProductImageGallery'),
  {
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

interface ExtendedProduct extends Product {
  features?: string[]
  specifications?: { label: string; value: string }[]
  image?: string
  originalPrice?: number
  priceUnit?: string
  unitQuantity?: number
}

interface ProductDetailModalProps {
  /** 選中的產品 */
  product: ExtendedProduct
  /** 是否為感興趣的產品 */
  isInterested: boolean
  /** 關閉 Modal */
  onClose: () => void
  /** 興趣切換事件 */
  onToggleInterest: (productId: string, productName: string) => void
  /** 詢問報價事件 */
  onRequestQuote: (product: ExtendedProduct) => void
}

/**
 * 產品詳細資訊 Modal
 *
 * 顯示完整的產品詳細資訊：
 * - 產品圖片畫廊
 * - 完整的產品資訊
 * - 產品特色和規格
 * - 數量選擇
 * - 興趣收藏功能
 * - 詢問報價功能
 * - 優雅的動畫效果
 * - 響應式設計
 */
export const ProductDetailModal = React.memo<ProductDetailModalProps>(
  ({ product, isInterested, onClose, onToggleInterest, onRequestQuote }) => {
    const [quantity, setQuantity] = useState(1)
    const [isChangingQuantity, setIsChangingQuantity] = useState(false)
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isRequestingQuote, setIsRequestingQuote] = useState(false)
    const { user } = useAuth()

    // 動畫控制
    const { shouldRender, backdropClasses, contentClasses } = useModalAnimation(true, 300)

    // 鍵盤支援
    useEscapeKey(onClose, shouldRender)
    useFocusTrap(shouldRender)

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }

    const handleRequestQuote = async () => {
      setIsRequestingQuote(true)
      try {
        await onRequestQuote(product)
      } finally {
        setIsRequestingQuote(false)
      }
    }

    // 數量變更動畫
    const handleQuantityChange = (newQuantity: number) => {
      setIsChangingQuantity(true)
      setQuantity(newQuantity)
      setTimeout(() => setIsChangingQuantity(false), 200)
    }

    // 改進的數量增減
    const incrementQuantity = () => {
      handleQuantityChange(quantity + 1)
    }

    const decrementQuantity = () => {
      if (quantity > 1) {
        handleQuantityChange(quantity - 1)
      }
    }

    // 圖片切換處理
    const handleImageChange = (index: number) => {
      setCurrentImageIndex(index)
    }

    // 準備圖片畫廊的產品資料
    const galleryProduct = {
      ...product,
      id: product.id.toString(),
      name: product.name,
      productImages:
        product.productImages && product.productImages.length > 0
          ? product.productImages
          : product.image
            ? [
                {
                  id: 'temp',
                  entity_id: product.id.toString(),
                  storage_url: product.image,
                  file_path: product.image,
                  alt_text: product.name,
                  display_position: 0,
                  module: 'products',
                  size: 'medium' as const,
                  width: 600,
                  height: 600,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              ]
            : [],
      inventory: product.inventory,
      isOnSale: (product.originalPrice || 0) > product.price,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // 確保只在客戶端渲染 Portal
    if (typeof window === 'undefined' || !shouldRender) {
      return null
    }

    const modalContent = (
      <div
        className={cn(backdropClasses)}
        onClick={handleBackdropClick}
        data-modal="true"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <div className={cn(contentClasses, 'overflow-hidden')}>
          {/* Modal 主體 - 響應式設計 */}
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* 移動端頂部拖拽指示器 */}
            <div className="md:hidden bg-gray-300 h-1 w-full"></div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* 產品圖片畫廊 - 左側 現代簡潔設計 */}
              <div className="relative bg-gray-50 md:rounded-l-2xl overflow-hidden border-r border-gray-100">
                <div className="p-6 md:p-8">
                  {/* 頂部分類標籤 */}
                  <div>
                    <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                      {product.category}
                    </span>
                  </div>

                  {/* 圖片容器 - 現代簡潔設計 */}
                  <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                      <ProductImageGallery
                        product={galleryProduct}
                        showThumbnails={false}
                        autoSlide={false}
                        className=""
                        onImageChange={handleImageChange}
                      />
                    </div>
                  </div>

                  {/* 底部區域 - 縮圖預覽 */}
                  <div>
                    {galleryProduct.productImages && galleryProduct.productImages.length > 1 ? (
                      // 多張圖片：顯示縮圖預覽
                      <div className="flex space-x-3 overflow-x-auto pb-2 justify-center">
                        {galleryProduct.productImages.map((image, index) => (
                          <button
                            key={image.id}
                            onClick={() => handleImageChange(index)}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                handleImageChange(index)
                              }
                            }}
                            className={`flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden
                              transition-all duration-200 hover:scale-105
                              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400
                              ${
                                currentImageIndex === index
                                  ? 'ring-2 ring-gray-400 shadow-md'
                                  : 'ring-1 ring-gray-300 hover:ring-gray-400'
                              }`}
                            aria-label={`切換到圖片 ${index + 1}，共 ${galleryProduct.productImages.length} 張`}
                            aria-pressed={currentImageIndex === index}
                            tabIndex={0}
                          >
                            <img
                              src={image.storage_url}
                              alt={`預覽 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    ) : (
                      // 單張或無圖片：顯示產地標籤
                      <div className="text-center">
                        <span className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
                          產地直送 • 新鮮保證
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 產品詳細資訊 - 右側 */}
              <div className="relative p-6 md:p-8 bg-white/80 backdrop-blur-sm">
                {/* 關閉按鈕 - 現代化圓形設計 */}
                <button
                  onClick={onClose}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onClose()
                    }
                  }}
                  className={cn(
                    'absolute top-4 right-4 z-10',
                    'w-10 h-10 bg-white/90 hover:bg-red-50 backdrop-blur-sm rounded-full',
                    'flex items-center justify-center',
                    'shadow-lg hover:shadow-xl',
                    'text-gray-400 hover:text-red-500',
                    'transition-all duration-300 ease-out',
                    'hover:scale-110 hover:rotate-90',
                    'focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2'
                  )}
                  aria-label="關閉產品詳細資訊視窗"
                  tabIndex={0}
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 產品基本資訊 */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      <Zap className="w-3 h-3 mr-1" />
                      熱門商品
                    </span>
                    {product.inventory > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        現貨
                      </span>
                    )}
                  </div>

                  <h2
                    id="modal-title"
                    className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight"
                  >
                    {product.name}
                  </h2>

                  <p
                    id="modal-description"
                    className="text-gray-700 leading-relaxed text-sm md:text-base"
                  >
                    {product.description}
                  </p>
                </div>

                {/* 產品特色 - 優化動畫 */}
                {product.features && product.features.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
                      ✨ 產品特色
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feature, index) => (
                        <span
                          key={index}
                          className={cn(
                            'bg-gray-100 text-gray-700',
                            'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium',
                            'shadow-sm hover:shadow-md',
                            'transition-all duration-300 hover:scale-105 hover:-translate-y-0.5',
                            'border border-gray-200 hover:border-gray-300',
                            'animate-fade-in opacity-0'
                          )}
                          style={{
                            animationDelay: `${index * 150 + 200}ms`,
                            animationFillMode: 'forwards',
                          }}
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 商品規格 - 改進設計 */}
                {product.specifications && product.specifications.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm md:text-base">
                      📋 商品規格
                    </h4>
                    <div className="bg-gray-50/80 rounded-lg p-4 space-y-3">
                      {product.specifications.map((spec, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-200/50 last:border-b-0"
                        >
                          <span className="text-gray-600 text-sm">{spec.label}</span>
                          <span className="font-medium text-gray-900 text-sm">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 價格和操作區域 */}
                <div className="border-t border-gray-200 pt-6">
                  {/* 價格顯示 - 現代簡潔設計 */}
                  <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200 animate-fade-in transition-all duration-300 hover:shadow-md hover:scale-[1.01]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl md:text-3xl font-bold text-gray-900">
                            NT$ {product.price.toLocaleString()}
                          </span>
                          {product.priceUnit && (
                            <span className="text-sm text-gray-600">/ {product.priceUnit}</span>
                          )}
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 line-through">
                              NT$ {product.originalPrice.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                              省 NT$ {(product.originalPrice - product.price).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 數量選擇 - 現代化設計 */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-gray-800 font-medium text-sm md:text-base">選擇數量</span>
                    <div className="flex items-center bg-white rounded-xl shadow-lg border border-gray-200">
                      <button
                        onClick={decrementQuantity}
                        disabled={quantity <= 1}
                        className={cn(
                          'w-10 h-10 flex items-center justify-center rounded-l-xl transition-all duration-200',
                          'hover:bg-gray-50 active:scale-95',
                          quantity <= 1
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-gray-700 hover:text-blue-600'
                        )}
                        aria-label="減少數量"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={e => {
                          const newValue = Math.max(1, parseInt(e.target.value) || 1)
                          handleQuantityChange(newValue)
                        }}
                        onKeyDown={e => {
                          if (e.key === 'ArrowUp') {
                            e.preventDefault()
                            incrementQuantity()
                          } else if (e.key === 'ArrowDown') {
                            e.preventDefault()
                            decrementQuantity()
                          }
                        }}
                        className={cn(
                          'w-16 h-10 text-center border-x border-gray-200 bg-transparent',
                          'font-bold text-lg transition-all duration-200 outline-none',
                          'focus:bg-blue-50 focus:text-blue-600',
                          isChangingQuantity ? 'scale-110 text-blue-600' : 'text-gray-900'
                        )}
                        aria-label="產品數量"
                      />
                      <button
                        onClick={incrementQuantity}
                        className="w-10 h-10 flex items-center justify-center rounded-r-xl text-gray-700 hover:text-blue-600 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                        aria-label="增加數量"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 操作按鈕組 - 現代化設計 */}
                  <div
                    className="space-y-3 mb-6 animate-fade-in opacity-0"
                    style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
                  >
                    {/* 次要操作按鈕 */}
                    <div className="flex gap-3 relative z-10">
                      <InterestButton
                        productId={product.id}
                        productName={product.name}
                        isInterested={isInterested}
                        onToggle={onToggleInterest}
                        variant="button"
                        size="md"
                        className="flex-1 bg-white hover:bg-gray-50 border border-gray-300 shadow-md hover:shadow-lg transition-all duration-200 relative z-20"
                      />
                      <button
                        className={cn(
                          'px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg',
                          'text-gray-700 hover:text-blue-600 transition-all duration-200',
                          'shadow-md hover:shadow-lg flex items-center gap-2'
                        )}
                        onClick={e => {
                          e.stopPropagation()
                          // 分享功能
                        }}
                        aria-label="分享產品"
                      >
                        <Share2 className="w-4 h-4" />
                        <span className="hidden sm:inline">分享</span>
                      </button>
                    </div>
                  </div>

                  {/* 主要操作按鈕 - 綠色 Tailwind 設計 */}
                  <div
                    className="animate-fade-in opacity-0"
                    style={{ animationDelay: '600ms', animationFillMode: 'forwards' }}
                  >
                    <TailwindGreenButton
                      onClick={handleRequestQuote}
                      disabled={product.inventory <= 0 || isRequestingQuote}
                      aria-label={isRequestingQuote ? '處理中...' : '立即詢問報價'}
                      className="py-4 shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {product.inventory <= 0 ? (
                        <span className="font-bold text-base md:text-lg">暫時缺貨</span>
                      ) : isRequestingQuote ? (
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-bold text-base md:text-lg">處理中...</span>
                        </div>
                      ) : !user ? (
                        <span className="font-bold text-base md:text-lg">請先登入</span>
                      ) : (
                        <div className="flex items-center justify-center gap-3">
                          <ShoppingCart className="w-5 h-5" />
                          <div className="flex flex-col items-center">
                            <span className="font-bold text-base md:text-lg">立即詢問報價</span>
                            <span className="text-xs opacity-90">
                              總計 NT$ {(product.price * quantity).toLocaleString()}
                              {product.priceUnit && ` (${quantity} ${product.priceUnit})`}
                            </span>
                          </div>
                        </div>
                      )}
                    </TailwindGreenButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )

    return createPortal(modalContent, document.body)
  }
)

ProductDetailModal.displayName = 'ProductDetailModal'
