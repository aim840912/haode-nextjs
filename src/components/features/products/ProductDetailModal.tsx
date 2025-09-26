import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types/product'
import { InterestButton } from './InterestButton'

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
 */
export const ProductDetailModal = React.memo<ProductDetailModalProps>(
  ({ product, isInterested, onClose, onToggleInterest, onRequestQuote }) => {
    const [quantity, setQuantity] = useState(1)
    const { user } = useAuth()

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose()
      }
    }

    const handleRequestQuote = () => {
      onRequestQuote(product)
    }

    // 準備圖片畫廊的產品資料
    const galleryProduct = {
      ...product,
      id: product.id.toString(),
      name: product.name,
      images:
        product.galleryImages && product.galleryImages.length > 0
          ? product.galleryImages
          : product.images && product.images.length > 0
            ? product.images
            : ['/images/placeholder.jpg'],
      galleryImages:
        product.galleryImages && product.galleryImages.length > 0
          ? product.galleryImages
          : product.images && product.images.length > 0
            ? product.images
            : undefined,
      thumbnailUrl: product.image || product.thumbnailUrl || product.primaryImageUrl,
      primaryImageUrl: product.image || product.primaryImageUrl || product.thumbnailUrl,
      inventory: product.inventory,
      isOnSale: (product.originalPrice || 0) > product.price,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            {/* 產品圖片畫廊 */}
            <ProductImageGallery product={galleryProduct} showThumbnails={true} autoSlide={false} />

            {/* 產品詳細資訊 */}
            <div>
              {/* 關閉按鈕 */}
              <button
                onClick={onClose}
                className="float-right text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                aria-label="關閉"
              >
                ×
              </button>

              {/* 產品基本資訊 */}
              <div className="text-sm text-amber-600 mb-2">{product.category}</div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{product.name}</h2>

              <p className="text-gray-800 mb-6 leading-relaxed">{product.description}</p>

              {/* 產品特色 */}
              {product.features && product.features.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">產品特色</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.features.map((feature, index) => (
                      <span
                        key={index}
                        className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 商品規格 */}
              {product.specifications && product.specifications.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">商品規格</h4>
                  <div className="space-y-2">
                    {product.specifications.map((spec, index) => (
                      <div
                        key={index}
                        className="flex justify-between py-2 border-b border-gray-100"
                      >
                        <span className="text-gray-800">{spec.label}</span>
                        <span className="font-medium text-gray-900">{spec.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 價格和操作區域 */}
              <div className="border-t pt-6">
                {/* 價格顯示 */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-3xl font-bold text-amber-900 whitespace-nowrap">
                      NT$ {product.price}
                      {product.priceUnit ? ` / ${product.priceUnit}` : ''}
                    </span>
                    {product.originalPrice && product.originalPrice > product.price && (
                      <span className="ml-2 text-lg text-gray-500 line-through whitespace-nowrap">
                        NT$ {product.originalPrice}
                      </span>
                    )}
                  </div>
                </div>

                {/* 數量選擇 */}
                <div className="flex items-center gap-4 mb-6">
                  <span className="text-gray-800 font-medium">數量：</span>
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-1 hover:bg-gray-100 text-gray-800 transition-colors"
                      aria-label="減少數量"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 border-x text-gray-900 font-medium">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-3 py-1 hover:bg-gray-100 text-gray-800 transition-colors"
                      aria-label="增加數量"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 興趣收藏按鈕 */}
                <div className="flex gap-3 mb-4">
                  <InterestButton
                    productId={product.id}
                    productName={product.name}
                    isInterested={isInterested}
                    onToggle={onToggleInterest}
                    variant="button"
                    size="md"
                    className="flex-1"
                  />
                </div>

                {/* 詢問報價按鈕 */}
                <button
                  onClick={handleRequestQuote}
                  className={`w-full py-4 rounded-lg font-semibold text-lg transition-colors ${
                    product.inventory <= 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : !user
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-amber-900 text-white hover:bg-amber-800'
                  }`}
                  disabled={product.inventory <= 0}
                >
                  {product.inventory <= 0 ? (
                    '暫時缺貨'
                  ) : !user ? (
                    '請先登入'
                  ) : (
                    <span className="whitespace-nowrap">
                      立即詢問 - NT$ {product.price * quantity}
                      {product.priceUnit ? ` (${quantity} ${product.priceUnit})` : ''}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

ProductDetailModal.displayName = 'ProductDetailModal'
