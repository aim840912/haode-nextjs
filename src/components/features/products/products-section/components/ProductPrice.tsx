/**
 * 產品價格元件
 */

import React from 'react'

interface ProductPriceProps {
  price: number
  priceUnit?: string | null
  originalPrice?: number | null
}

export const ProductPrice = React.memo(function ProductPrice({
  price,
  priceUnit,
  originalPrice,
}: ProductPriceProps) {
  return (
    <div className="flex items-baseline gap-2 mb-3">
      <span className="text-lg font-bold text-gray-900">NT$ {price}</span>
      {priceUnit && <span className="text-sm text-gray-500">/ {priceUnit}</span>}
      {originalPrice && originalPrice > price && (
        <span className="text-sm text-gray-400 line-through ml-2">NT$ {originalPrice}</span>
      )}
    </div>
  )
})
