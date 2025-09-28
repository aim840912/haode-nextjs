import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { createPortal } from 'react-dom'
import { X, Plus, Minus, ShoppingCart, Share2, Zap } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types/product'
import { InterestButton } from './InterestButton'
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

    const handleRequestQuote = () => {
      onRequestQuote(product)
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
                  product_id: product.id.toString(),
                  url: product.image,
                  path: product.image,
                  position: 0,
                  size: 'medium' as const,
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
          <div className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 backdrop-blur-sm rounded-2xl shadow-2xl shadow-amber-900/25 border border-amber-200/30 overflow-hidden">
            {/* 移動端頂部拖拽指示器 */}
            <div className="md:hidden bg-gradient-to-r from-amber-200 to-orange-200 h-1 w-full"></div>

            <div className="grid md:grid-cols-2 gap-0">
              {/* 產品圖片畫廊 - 左側 優雅框架設計 */}
              <div className="relative bg-gradient-to-br from-amber-50/80 via-orange-50/70 via-yellow-50/60 to-amber-25/50 md:rounded-l-2xl overflow-hidden">
                {/* 柔和背景紋理層 */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-amber-50/40 pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.1),transparent_50%)] pointer-events-none"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(251,146,60,0.08),transparent_50%)] pointer-events-none"></div>
                {/* 優雅的相框外框 */}
                <div className="p-6 md:p-8 h-full flex flex-col">
                  {/* 頂部優雅裝飾條 */}
                  <div className="mb-4 pb-3 border-b border-amber-200/50">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gradient-to-r from-amber-400 to-orange-400 rounded-full shadow-sm"></div>
                      <span className="text-sm font-medium text-amber-800">{product.category}</span>
                    </div>
                  </div>

                  {/* 精緻的相框容器 */}
                  <div className="flex-1 relative">
                    {/* 外框 - 仿古相框效果 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 rounded-2xl shadow-inner">
                      {/* 外框紋理 */}
                      <div className="absolute inset-0 rounded-2xl border border-amber-300/30 shadow-md"></div>
                      <div className="absolute inset-1 rounded-2xl border border-white/60"></div>
                    </div>

                    {/* 中框 - 立體邊框 */}
                    <div className="absolute inset-2 bg-gradient-to-br from-white via-amber-25 to-orange-25 rounded-xl shadow-lg">
                      {/* 中框細節 */}
                      <div className="absolute inset-0 rounded-xl border-2 border-amber-200/40 shadow-inner"></div>
                      <div className="absolute inset-0.5 rounded-xl border border-white/80"></div>
                      {/* 立體感增強 */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-transparent via-white/20 to-amber-100/30"></div>
                    </div>

                    {/* 內框 - 圖片容器 */}
                    <div className="absolute inset-4 rounded-lg overflow-hidden shadow-2xl">
                      {/* 內框邊界 - 確保不干擾點擊事件 */}
                      <div className="absolute inset-0 rounded-lg border-2 border-amber-900/10 shadow-inner z-0 pointer-events-none"></div>
                      <ProductImageGallery
                        product={galleryProduct}
                        showThumbnails={true}
                        autoSlide={false}
                        className="h-full elegant-frame"
                      />
                    </div>

                    {/* 角落裝飾 - 精緻相框金屬角 */}
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 z-20">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-600 transform rotate-45 rounded-sm shadow-lg"></div>
                        <div className="absolute inset-0.5 bg-gradient-to-br from-yellow-200 to-amber-300 transform rotate-45 rounded-sm"></div>
                        <div className="absolute inset-1 bg-gradient-to-br from-white/80 to-amber-100/60 transform rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="absolute top-0.5 right-0.5 w-5 h-5 z-20">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-bl from-amber-400 via-orange-400 to-amber-600 transform -rotate-45 rounded-sm shadow-lg"></div>
                        <div className="absolute inset-0.5 bg-gradient-to-bl from-yellow-200 to-amber-300 transform -rotate-45 rounded-sm"></div>
                        <div className="absolute inset-1 bg-gradient-to-bl from-white/80 to-amber-100/60 transform -rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-0.5 left-0.5 w-5 h-5 z-20">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 via-orange-400 to-amber-600 transform -rotate-45 rounded-sm shadow-lg"></div>
                        <div className="absolute inset-0.5 bg-gradient-to-tr from-yellow-200 to-amber-300 transform -rotate-45 rounded-sm"></div>
                        <div className="absolute inset-1 bg-gradient-to-tr from-white/80 to-amber-100/60 transform -rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                    <div className="absolute bottom-0.5 right-0.5 w-5 h-5 z-20">
                      <div className="relative w-full h-full">
                        <div className="absolute inset-0 bg-gradient-to-tl from-amber-400 via-orange-400 to-amber-600 transform rotate-45 rounded-sm shadow-lg"></div>
                        <div className="absolute inset-0.5 bg-gradient-to-tl from-yellow-200 to-amber-300 transform rotate-45 rounded-sm"></div>
                        <div className="absolute inset-1 bg-gradient-to-tl from-white/80 to-amber-100/60 transform rotate-45 rounded-sm"></div>
                      </div>
                    </div>
                  </div>

                  {/* 底部優雅簽名區 */}
                  <div className="mt-4 pt-3 border-t border-amber-200/50">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                      <span className="text-xs text-amber-900 font-medium tracking-wide">
                        產地直送
                      </span>
                      <div className="w-8 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent"></div>
                    </div>
                  </div>
                </div>

                {/* 柔和的背景紋理 */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23d97706' fill-opacity='0.15'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3Ccircle cx='10' cy='10' r='2'/%3E%3Ccircle cx='50' cy='10' r='2'/%3E%3Ccircle cx='10' cy='50' r='2'/%3E%3Ccircle cx='50' cy='50' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                      backgroundSize: '60px 60px',
                    }}
                  />
                </div>
              </div>

              {/* 產品詳細資訊 - 右側 */}
              <div className="relative p-6 md:p-8 bg-white/80 backdrop-blur-sm">
                {/* 關閉按鈕 - 現代化圓形設計 */}
                <button
                  onClick={onClose}
                  className={cn(
                    'absolute top-4 right-4 z-10',
                    'w-10 h-10 bg-white/90 hover:bg-red-50 backdrop-blur-sm rounded-full',
                    'flex items-center justify-center',
                    'shadow-lg hover:shadow-xl',
                    'text-gray-400 hover:text-red-500',
                    'transition-all duration-300 ease-out',
                    'hover:scale-110 hover:rotate-90'
                  )}
                  aria-label="關閉視窗"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* 產品基本資訊 */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800">
                      <Zap className="w-3 h-3 mr-1" />
                      熱門商品
                    </span>
                    {product.inventory > 0 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        現貨
                      </span>
                    )}
                  </div>

                  <h2
                    id="modal-title"
                    className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent leading-tight"
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
                            'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800',
                            'px-3 py-1.5 rounded-full text-xs md:text-sm font-medium',
                            'shadow-md hover:shadow-lg',
                            'transition-all duration-200 hover:scale-105',
                            'border border-amber-200/50'
                          )}
                          style={{
                            animationDelay: `${index * 100}ms`,
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

                {/* 價格和操作區域 - 漸變分隔線 */}
                <div className="border-t border-gradient-to-r from-amber-200 via-orange-200 to-amber-200 pt-6">
                  {/* 價格顯示 - 更醒目的設計 */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 mb-6 border border-amber-200/30">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-amber-900 to-orange-800 bg-clip-text text-transparent">
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
                            : 'text-gray-700 hover:text-amber-600'
                        )}
                        aria-label="減少數量"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <div
                        className={cn(
                          'w-16 h-10 flex items-center justify-center border-x border-gray-200',
                          'font-bold text-lg transition-all duration-200',
                          isChangingQuantity ? 'scale-110 text-amber-600' : 'text-gray-900'
                        )}
                      >
                        {quantity}
                      </div>
                      <button
                        onClick={incrementQuantity}
                        className="w-10 h-10 flex items-center justify-center rounded-r-xl text-gray-700 hover:text-amber-600 hover:bg-gray-50 transition-all duration-200 active:scale-95"
                        aria-label="增加數量"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 操作按鈕組 - 現代化設計 */}
                  <div className="space-y-3 mb-6">
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
                          'text-gray-700 hover:text-amber-600 transition-all duration-200',
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

                  {/* 主要操作按鈕 - 醒目設計 */}
                  <button
                    onClick={handleRequestQuote}
                    disabled={product.inventory <= 0}
                    className={cn(
                      'w-full py-4 rounded-xl font-bold text-base md:text-lg transition-all duration-300',
                      'shadow-xl hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98]',
                      'flex items-center justify-center gap-3',
                      product.inventory <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none hover:scale-100'
                        : !user
                          ? 'bg-gradient-to-r from-gray-600 to-gray-700 text-white hover:from-gray-700 hover:to-gray-800'
                          : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
                    )}
                  >
                    {product.inventory <= 0 ? (
                      <>
                        <span>暫時缺貨</span>
                      </>
                    ) : !user ? (
                      <>
                        <span>請先登入</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5" />
                        <div className="flex flex-col items-center">
                          <span>立即詢問報價</span>
                          <span className="text-xs opacity-90">
                            總計 NT$ {(product.price * quantity).toLocaleString()}
                            {product.priceUnit && ` (${quantity} ${product.priceUnit})`}
                          </span>
                        </div>
                      </>
                    )}
                  </button>
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
