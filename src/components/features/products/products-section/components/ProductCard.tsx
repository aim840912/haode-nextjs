/**
 * 產品卡片元件
 */

import React from 'react'
import Link from 'next/link'
import { SafeImage } from '@/components/ui/image/OptimizedImage'
import { cn } from '@/lib/utils/cn'
import type { Product } from '@/types/product'
import { ProductDiscount } from './ProductDiscount'
import { ProductPrice } from './ProductPrice'

interface ProductCardProps {
  product: Product
  index: number
}

export const ProductCard = React.memo(function ProductCard({ product, index }: ProductCardProps) {
  const animationClass = `stagger-animation-${index + 1}`

  return (
    <Link
      href={`/products?productId=${product.id}`}
      className={cn(
        'group bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl flex flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:scale-[1.01]',
        animationClass
      )}
    >
      <div className="relative">
        <div className="relative aspect-square">
          <SafeImage
            src={product.productImages?.[0]?.storage_url || '/images/placeholder.jpg'}
            alt={product.name || '產品圖片'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={index < 3}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
        </div>

        {product.isOnSale && product.originalPrice && (
          <ProductDiscount originalPrice={product.originalPrice} currentPrice={product.price} />
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="mb-2">
          <h3 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto">
          <ProductPrice
            price={product.price}
            priceUnit={product.priceUnit}
            originalPrice={product.originalPrice}
          />

          <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-[#5d4037] px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#f8f5f0]/50 transition-colors duration-200">
            <span>查看詳情</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  )
})
