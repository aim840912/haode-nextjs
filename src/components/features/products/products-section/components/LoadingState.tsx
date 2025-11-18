/**
 * 載入狀態元件
 */

import React from 'react'
import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'

export const LoadingState = React.memo(function LoadingState() {
  return (
    <section id="products" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-4 tracking-wider">
          經典產品
        </h2>
        <p className="text-center text-gray-600 text-lg mb-16">精選來自梅山的優質農產品</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  )
})
