/**
 * ProductsSection 主元件
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { useProductsData } from '@/hooks/useProductsData'
import { useVisibility } from '../hooks/useVisibility'
import { SectionHeader } from './SectionHeader'
import { LoadingState } from './LoadingState'
import { ErrorState } from './ErrorState'
import { EmptyState } from './EmptyState'
import { ProductCard } from './ProductCard'
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
    <section id="products" ref={ref} className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <SectionHeader isVisible={isVisible} />

        {products.length > 0 ? (
          <>
            <div
              className={cn(
                'grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-12',
                isVisible ? 'animate-slide-up animation-delay-300' : 'opacity-0'
              )}
            >
              {products.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
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
