'use client'

import { useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { ProductCard } from '@/components/features/products/ProductCard'
import { ProductDetailModal } from '@/components/features/products/ProductDetailModal'
import { ProductStructuredData } from '@/components/features/seo/StructuredData'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ErrorHandler } from '@/components/ui/error/ErrorHandler'
import { LoadingManager } from '@/components/ui/loading/LoadingManager'
import { Breadcrumbs, createProductBreadcrumbs } from '@/components/ui/navigation/Breadcrumbs'
import { useProductFilter, FilterState } from '@/hooks/useProductFilter'
import { useProductInterest } from '@/hooks/useProductInterest'
import { useProductModal } from '@/hooks/useProductModal'
import { useProductsData } from '@/hooks/useProductsData'
import { ToastProvider } from '@/providers/ToastProvider'
import { AdminControls } from './components/AdminControls'
import { ProductsEmptyState } from './components/ProductsEmptyState'
import { ProductsLoadingState } from './components/ProductsLoadingState'

// 動態載入大型組件，提升初始載入速度
const ProductFilter = dynamic(
  () => import('@/components/features/products/ProductFilter').then(mod => mod.ProductFilter),
  {
    loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

// 為測試目的擴展 Window 介面
declare global {
  interface Window {
    refreshProducts?: () => void
    refreshProductsNormal?: () => void
  }
}

function ProductsPage() {
  // 使用新的自定義 hooks
  const { products, loading, refetch } = useProductsData()
  const { toggleInterest, isInterested } = useProductInterest()
  const { selectedProduct, openModal, closeModal, requestQuote } = useProductModal(products)
  const { setFilters, filteredProducts, availableCategories } = useProductFilter(products)

  // 篩選處理函數
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  // 管理員重新整理功能
  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* SEO Structured Data for Products */}
      {filteredProducts.length > 0 && (
        <>
          {filteredProducts.slice(0, 3).map((product, index) => (
            <ProductStructuredData
              key={`structured-data-${product.id}-${index}`}
              product={{
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                inventory: product.inventory,
                images:
                  product.productImages && product.productImages.length > 0
                    ? product.productImages.map(img => img.storage_url)
                    : ['/images/placeholder.jpg'],
              }}
            />
          ))}
        </>
      )}

      {/* Breadcrumb */}
      <div className="bg-white dark:bg-slate-800 border-b dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs items={createProductBreadcrumbs()} enableStructuredData={true} />
        </div>
      </div>

      {/* Header - 包含標題和篩選條件 */}
      <div className="bg-white dark:bg-slate-800 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-6">
          {/* 標題列 */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 mb-2">
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-light text-amber-900 dark:text-amber-300 mb-1">
                精選農產品
              </h1>
            </div>

            {/* 管理員控制按鈕 */}
            <AdminControls onRefresh={handleRefresh} loading={loading} />
          </div>

          {/* 篩選條件 - 整合到 Header 內 */}
          <ProductFilter
            onFilterChange={handleFilterChange}
            availableCategories={availableCategories}
            productCount={filteredProducts.length}
            totalCount={products.length}
            integrated={true}
          />
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-16">
        {loading ? (
          <ProductsLoadingState />
        ) : (
          <>
            {/* Products Display - 電商精品風格 */}
            {products.length === 0 ? (
              <ProductsEmptyState type="no_data" />
            ) : filteredProducts.length === 0 ? (
              <ProductsEmptyState type="no_results" />
            ) : (
              <div className="mt-8">
                <div className="relative bg-gray-50 dark:bg-slate-800/50 rounded-xl p-8 border border-gray-200 dark:border-slate-700">
                  {/* 簡潔風格網格布局 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredProducts.map((product, index) => (
                      <ProductCard
                        key={`product-${product.id}`}
                        product={product}
                        index={index}
                        isInterested={isInterested(product.id)}
                        onProductClick={openModal}
                        onToggleInterest={toggleInterest}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isInterested={isInterested(selectedProduct.id)}
          onClose={closeModal}
          onToggleInterest={toggleInterest}
          onRequestQuote={requestQuote}
        />
      )}
    </div>
  )
}

export default function ProductsPageWithErrorBoundary() {
  return (
    <ToastProvider>
      <ErrorHandler>
        <LoadingManager defaultTimeout={30000} showOverlay={false}>
          <ComponentErrorBoundary>
            <Suspense
              fallback={
                <div className="p-6">
                  <ProductsLoadingState />
                </div>
              }
            >
              <ProductsPage />
            </Suspense>
          </ComponentErrorBoundary>
        </LoadingManager>
      </ErrorHandler>
    </ToastProvider>
  )
}
