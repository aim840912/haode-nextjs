/**
 * ProductsSection 主元件
 */

'use client'

import React from 'react'
import { useProductsData } from '@/hooks/useProductsData'
import { cn } from '@/lib/utils/cn'
import { useVisibility } from '../hooks/useVisibility'
import { EmptyState } from './EmptyState'
import { ErrorState } from './ErrorState'
import { LoadingState } from './LoadingState'
import { ProductCard } from './ProductCard'
import { SectionHeader } from './SectionHeader'
import { ViewAllButton } from './ViewAllButton'

function ProductsSection() {
  // 使用統一的 useProductsData Hook,限制只取前 3 個產品
  const { products, loading, error, handleRetry } = useProductsData({ limit: 3 })
  const { isVisible, ref } = useVisibility()

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error.message} onRetry={handleRetry} />
  }

  return (
    <section id="products" ref={ref} className="py-16 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeader isVisible={isVisible} />

        {products.length > 0 ? (
          <>
            <div
              className={cn(
                'flex flex-wrap justify-center gap-8 mb-12',
                isVisible && 'animate-slide-up animation-delay-300'
              )}
            >
              {products.map((product, index) => (
                <div
                  key={product.id}
                  className="w-full sm:w-[calc(50%-1rem)] md:w-[calc(33.333%-1.5rem)] lg:w-[calc(25%-1.5rem)] max-w-sm"
                >
                  <ProductCard product={product} index={index} />
                </div>
              ))}
            </div>

            <ViewAllButton isVisible={isVisible} />
          </>
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  )
}

export { ProductsSection }
