import React from 'react'
import { ExtendedProduct } from './types'

interface ProductModalHeaderProps {
  /** 產品資訊 */
  product: ExtendedProduct
}

/**
 * 產品 Modal 標題元件
 *
 * 顯示產品名稱、描述和價格資訊
 */
export const ProductModalHeader = React.memo<ProductModalHeaderProps>(({ product }) => {
  return (
    <>
      {/* 產品基本資訊 */}
      <div className="space-y-4 mb-6">
        <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h2>

        <p id="modal-description" className="text-gray-700 leading-relaxed text-sm md:text-base">
          {product.description}
        </p>
      </div>

      {/* 價格顯示 - 移到 Features 和 Specifications 之後，在操作區域之前 */}
    </>
  )
})

ProductModalHeader.displayName = 'ProductModalHeader'

interface ProductPriceDisplayProps {
  /** 產品資訊 */
  product: ExtendedProduct
}

/**
 * 產品價格顯示元件
 *
 * 顯示價格、原價和折扣資訊
 */
export const ProductPriceDisplay = React.memo<ProductPriceDisplayProps>(({ product }) => {
  return (
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
  )
})

ProductPriceDisplay.displayName = 'ProductPriceDisplay'
