'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import { Product } from '@/types/product'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'
import { LoadingManager } from '@/components/ui/loading/LoadingManager'
import { ErrorHandler, useAsyncWithError } from '@/components/ui/error/ErrorHandler'
import { ProductStructuredData } from '@/components/features/seo/StructuredData'
import Breadcrumbs, { createProductBreadcrumbs } from '@/components/ui/navigation/Breadcrumbs'
import { logger } from '@/lib/logger'
import { ToastProvider } from '@/providers/ToastProvider'
import { useProductInterest } from '@/hooks/useProductInterest'
import { useProductFilter } from '@/hooks/useProductFilter'
import { ProductCard } from '@/components/features/products/ProductCard'
import { ProductDetailModal } from '@/components/features/products/ProductDetailModal'

// 動態載入大型組件，提升初始載入速度
const ProductFilter = dynamic(() => import('@/components/features/products/ProductFilter'), {
  loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>,
  ssr: false,
})

// 為測試目的擴展 Window 介面
declare global {
  interface Window {
    refreshProducts?: () => void
    refreshProductsNormal?: () => void
  }
}

// 用於模擬產品的擴展類型
interface ExtendedProduct extends Product {
  features?: string[]
  specifications?: { label: string; value: string }[]
  inStock?: boolean
  image?: string
  allImages?: string[] // 儲存所有圖片URL
  originalPrice?: number
  priceUnit?: string // 價格單位
  unitQuantity?: number // 單位數量
  productCardProps?: {
    id: string
    name: string
    images: string[]
    thumbnailUrl: string
    primaryImageUrl: string
    inventory: number
    isOnSale: boolean
    category: string
    price: number
    description: string
    isActive: boolean
    createdAt: string
    updatedAt: string
  }
}

// 模擬產品的預設值，用於 fallback
const getDefaultProductFeatures = (): string[] => ['產地直送', '新鮮採摘', '品質保證']
const getDefaultProductSpecifications = () => [
  { label: '產地', value: '台灣' },
  { label: '保存', value: '請參考包裝說明' },
]

function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null)
  const [apiProducts, setApiProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { executeWithErrorHandling } = useAsyncWithError()

  // 使用新的 hooks
  const { toggleInterest, isInterested } = useProductInterest()

  // 興趣功能現在由 useProductInterest hook 處理

  const fetchProducts = useCallback(
    async (forceRefresh: boolean = false) => {
      setLoading(true)
      try {
        const result = await executeWithErrorHandling(
          async () => {
            // 添加時間戳參數避免快取，確保獲取最新資料
            const timestamp = Date.now()
            const url = forceRefresh
              ? `/api/products?t=${timestamp}&nocache=true`
              : `/api/products?t=${timestamp}`
            const response = await fetch(url)

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            // 處理統一 API 回應格式
            const data = result.data || result

            // 確保 data 是陣列
            if (!Array.isArray(data)) {
              throw new Error('API 回應格式錯誤：data 不是陣列')
            }

            setApiProducts(data.filter((p: Product) => p.isActive))
            return data
          },
          {
            taskId: 'fetch-products',
            loadingMessage: '載入產品中...',
            errorMessage: '載入產品失敗',
            context: { page: 'products' },
          }
        )

        // 如果 executeWithErrorHandling 返回 null (發生錯誤)，設置空陣列
        if (result === null) {
          setApiProducts([])
        }
      } catch (error) {
        logger.error('Unexpected error in fetchProducts', error as Error, {
          metadata: { action: 'fetch_products' },
        })
        setApiProducts([])
      } finally {
        setLoading(false)
      }
    },
    [] // 移除 executeWithErrorHandling 依賴以避免無限循環
  )

  // 初始載入 - 只在組件掛載時執行一次
  useEffect(() => {
    fetchProducts()
  }, []) // 移除 fetchProducts 依賴，只在組件掛載時執行一次

  // 提供全域方法供測試使用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.refreshProducts = () => fetchProducts(true)
      window.refreshProductsNormal = () => fetchProducts(false)
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete window.refreshProducts
        delete window.refreshProductsNormal
      }
    }
  }, []) // 移除 fetchProducts 依賴，避免重複設置

  // 只使用 API 產品資料，確保 SSR 和 CSR 一致
  const allProducts = useMemo(() => {
    // 過濾重複的產品 ID
    const uniqueProducts = apiProducts.filter(
      (product, index, self) => index === self.findIndex(p => p.id === product.id)
    )

    // 預計算共用資料避免重複建立
    const defaultFeatures = getDefaultProductFeatures()
    const defaultSpecs = getDefaultProductSpecifications()
    const currentTime = new Date().toISOString() // 只建立一次時間戳

    return uniqueProducts.map(product => {
      return {
        id: product.id, // 保持字串格式
        name: product.name,
        category: product.category,
        price: product.price,
        priceUnit: product.priceUnit, // 新增單位價格欄位
        unitQuantity: product.unitQuantity, // 新增單位數量欄位
        originalPrice: product.originalPrice || product.price,
        image: product.images?.[0] || '/images/placeholder.jpg',
        allImages: product.images || [], // 儲存所有圖片URL
        description: product.description,
        features: defaultFeatures,
        specifications: defaultSpecs,
        inStock: product.inventory > 0,
        // 預建構 ProductCardImage 的 props，避免每次渲染重新建立
        productCardProps: {
          id: product.id,
          name: product.name,
          images: product.images?.[0] ? [product.images[0]] : ['/images/placeholder.jpg'],
          thumbnailUrl: product.images?.[0] || '/images/placeholder.jpg',
          primaryImageUrl: product.images?.[0] || '/images/placeholder.jpg',
          inventory: product.inventory > 0 ? 100 : 0,
          isOnSale: (product.originalPrice || 0) > product.price,
          category: product.category,
          price: product.price,
          description: product.description,
          isActive: true,
          createdAt: currentTime,
          updatedAt: currentTime,
        },
      }
    })
  }, [apiProducts])

  // 使用 useProductFilter hook 進行篩選和排序
  const { filters, setFilters, filteredProducts, availableCategories } = useProductFilter(
    allProducts.map(p => ({
      id: p.id,
      name: p.name,
      category: p.category,
      price: p.price,
      priceUnit: p.priceUnit,
      unitQuantity: p.unitQuantity,
      originalPrice: p.originalPrice,
      images: p.allImages,
      inventory: p.inStock ? 100 : 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      description: p.description,
    }))
  )

  // 檢查 URL 參數並自動開啟產品 modal
  useEffect(() => {
    if (typeof window === 'undefined' || allProducts.length === 0) return

    const params = new URLSearchParams(window.location.search)
    const productId = params.get('productId')

    if (productId) {
      const product = allProducts.find(p => p.id === productId)
      if (product) {
        setSelectedProduct(product as unknown as ExtendedProduct)
        // 移除 URL 參數，保持 URL 乾淨
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      }
    }
  }, [allProducts]) // 依賴 allProducts，確保產品載入後再檢查

  // 篩選交由 useProductFilter hook 處理
  const handleFilterChange = useCallback(
    (newFilters: any) => {
      setFilters(newFilters)
    },
    [setFilters]
  )

  const handleProductClick = (product: ExtendedProduct) => {
    setSelectedProduct(product)
  }

  const closeModal = useCallback(() => {
    setSelectedProduct(null)
  }, [])

  const requestQuote = useCallback(
    (product: ExtendedProduct) => {
      if (!user) {
        window.location.href = '/login'
        return
      }

      // 導向詢問單頁面，並預填產品資訊（包含價格）
      // 數量現在由 Modal 內部管理
      const inquiryUrl = `/inquiries/create?product=${encodeURIComponent(product.name)}&productId=${product.id}&price=${product.price}`
      window.location.href = inquiryUrl
    },
    [user]
  )

  // 興趣功能現在由 useProductInterest hook 處理

  return (
    <div className="min-h-screen bg-gray-50">
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
                  product.images && product.images.length > 0
                    ? product.images
                    : ['/images/placeholder.jpg'],
              }}
            />
          ))}
        </>
      )}

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Breadcrumbs items={createProductBreadcrumbs()} enableStructuredData={true} />
        </div>
      </div>

      {/* Header - 統一簡潔設計 */}
      <div className="bg-white py-4 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-xl sm:text-2xl font-light text-amber-900 mb-1">精選農產品</h1>
            </div>

            {/* 功能按鈕區域 - 根據角色顯示不同內容 */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto max-w-sm sm:max-w-none">
              {/* 管理員：完整功能按鈕 */}
              {user?.role === 'admin' && (
                <>
                  <button
                    onClick={() => {
                      setApiProducts([])
                      setLoading(true)
                      fetchProducts()
                    }}
                    disabled={loading}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="重新整理產品列表"
                  >
                    <span>{loading ? '更新中...' : '重新整理'}</span>
                  </button>
                  <a
                    href="/admin/products"
                    className="w-full sm:w-auto px-4 py-2 bg-gray-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>產品管理</span>
                  </a>
                  <a
                    href="/admin/products/add"
                    className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded-lg sm:rounded-full text-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>新增產品</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <>
            {/* Product Filter */}
            <ProductFilter
              onFilterChange={handleFilterChange}
              availableCategories={availableCategories}
              productCount={filteredProducts.length}
              totalCount={allProducts.length}
            />

            {/* Products Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-900 mx-auto mb-4"></div>
                <div className="text-gray-500 mb-4">載入產品中...</div>
                <p className="text-sm text-gray-400">請稍候片刻</p>
              </div>
            ) : apiProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6 flex justify-center">
                  <svg
                    className="w-24 h-24 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div className="text-gray-500 mb-4">目前沒有產品資料</div>
                <p className="text-sm text-gray-400">請稍後再試，或聯絡我們獲取更多資訊</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">沒有找到符合條件的產品</div>
                <p className="text-sm text-gray-400">請嘗試調整篩選條件</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredProducts.map((product, index) => {
                  // 找到對應的 allProducts 項目以獲取完整資料
                  const extendedProduct = allProducts.find(p => p.id === product.id)
                  if (!extendedProduct) return null

                  return (
                    <ProductCard
                      key={`product-${product.id}`}
                      product={extendedProduct as ExtendedProduct}
                      index={index}
                      isInterested={isInterested(product.id)}
                      onProductClick={handleProductClick}
                      onToggleInterest={toggleInterest}
                    />
                  )
                })}
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
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 p-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
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
