'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { useModalAnimation, useEscapeKey, useFocusTrap } from '@/hooks/useModalAnimation'
import { cn } from '@/lib/utils'
import { ProductFeaturesList } from './modal/ProductFeaturesList'
import { ProductModalActions } from './modal/ProductModalActions'
import { ProductModalHeader, ProductPriceDisplay } from './modal/ProductModalHeader'
import { ProductQuantitySelector } from './modal/ProductQuantitySelector'
import { ProductSpecificationsList } from './modal/ProductSpecificationsList'
import type { ProductDetailModalProps, ExtendedProduct } from './modal/types'

// 動態載入圖片畫廊
const ProductImageGallery = dynamic(
  () =>
    import('@/components/features/products/ProductImageGallery').then(
      mod => mod.ProductImageGallery
    ),
  {
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

// 導出型別供外部使用
export type { ExtendedProduct, ProductDetailModalProps }

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
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

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
                    {galleryProduct.productImages && galleryProduct.productImages.length > 1 && (
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
                            className={cn(
                              'relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden',
                              'transition-all duration-200 hover:scale-105',
                              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-400',
                              currentImageIndex === index
                                ? 'ring-2 ring-gray-400 shadow-md'
                                : 'ring-1 ring-gray-300 hover:ring-gray-400'
                            )}
                            aria-label={`切換到圖片 ${index + 1}，共 ${galleryProduct.productImages.length} 張`}
                            aria-pressed={currentImageIndex === index}
                            tabIndex={0}
                          >
                            <Image
                              src={image.storage_url}
                              alt={`預覽 ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="120px"
                            />
                          </button>
                        ))}
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
                <ProductModalHeader product={product} />

                {/* 產品特色 */}
                {product.features && <ProductFeaturesList features={product.features} />}

                {/* 商品規格 */}
                {product.specifications && (
                  <ProductSpecificationsList specifications={product.specifications} />
                )}

                {/* 價格和操作區域 */}
                <div className="border-t border-gray-200 pt-6">
                  {/* 價格顯示 */}
                  <ProductPriceDisplay product={product} />

                  {/* 數量選擇 */}
                  <ProductQuantitySelector quantity={quantity} onQuantityChange={setQuantity} />

                  {/* 操作按鈕組 */}
                  <ProductModalActions
                    product={product}
                    quantity={quantity}
                    isInterested={isInterested}
                    onToggleInterest={onToggleInterest}
                    onRequestQuote={onRequestQuote}
                  />
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
