'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/lib/auth-context'
import { UserInterestsService } from '@/services/userInterestsServiceAdapter'
import { Product } from '@/types/product'
import { ComponentErrorBoundary } from '@/components/ui/error/ErrorBoundary'
import { ProductCardSkeleton } from '@/components/ui/loading/LoadingSkeleton'
import { LoadingManager } from '@/components/ui/loading/LoadingManager'
import { ErrorHandler, useAsyncWithError } from '@/components/ui/error/ErrorHandler'
import { ProductStructuredData } from '@/components/features/seo/StructuredData'
import Breadcrumbs, { createProductBreadcrumbs } from '@/components/ui/navigation/Breadcrumbs'
import { logger } from '@/lib/logger'

// 動態載入大型組件，提升初始載入速度
const ProductFilter = dynamic(() => import('@/components/features/products/ProductFilter'), {
  loading: () => <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>,
  ssr: false,
})

const ProductImageGallery = dynamic(
  () => import('@/components/features/products/ProductImageGallery'),
  {
    loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

const ProductCardImage = dynamic(
  () =>
    import('@/components/features/products/ProductImageGallery').then(mod => ({
      default: mod.ProductCardImage,
    })),
  {
    loading: () => <div className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>,
    ssr: false,
  }
)

// 引入類型
import type { FilterState } from '@/components/features/products/ProductFilter'

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
}

// 模擬產品的預設值，用於 fallback
const getDefaultProductFeatures = (): string[] => ['產地直送', '新鮮採摘', '品質保證']
const getDefaultProductSpecifications = () => [
  { label: '產地', value: '台灣' },
  { label: '保存', value: '請參考包裝說明' },
]

function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState<ExtendedProduct | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [apiProducts, setApiProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [interestedProducts, setInterestedProducts] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    availability: 'all',
    sortBy: 'name',
    search: '',
    priceRange: {
      min: 0,
      max: 5000,
    },
  })
  const { user } = useAuth()
  const { executeWithErrorHandling } = useAsyncWithError()

  // 當使用者登入狀態改變時重新載入興趣清單
  useEffect(() => {
    const loadInterestedProducts = async () => {
      if (user?.id) {
        // 已登入：從資料庫載入
        const interests = await UserInterestsService.getUserInterests(user.id)
        setInterestedProducts(new Set(interests))
      } else {
        // 未登入：清空興趣清單
        setInterestedProducts(new Set())
      }
    }

    loadInterestedProducts()
  }, [user?.id]) // 只依賴穩定的 user.id

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

  // 篩選和排序邏輯
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts]

    // 類別篩選
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => filters.categories.includes(product.category))
    }

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      filtered = filtered.filter(product => product.inStock)
    } else if (filters.availability === 'out_of_stock') {
      filtered = filtered.filter(product => !product.inStock)
    }

    // 搜尋篩選
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase()
      filtered = filtered.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm) ||
          product.description.toLowerCase().includes(searchTerm) ||
          product.category.toLowerCase().includes(searchTerm)
      )
    }

    // 價格區間篩選
    if (filters.priceRange && (filters.priceRange.min > 0 || filters.priceRange.max < 5000)) {
      filtered = filtered.filter(
        product =>
          product.price >= filters.priceRange!.min && product.price <= filters.priceRange!.max
      )
    }

    // 排序
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_low':
          return a.price - b.price
        case 'price_high':
          return b.price - a.price
        case 'name':
          return a.name.localeCompare(b.name)
        case 'newest':
          return parseInt(b.id) - parseInt(a.id) // 將字串 ID 轉為數字進行比較
        default:
          return 0
      }
    })

    return filtered
  }, [allProducts, filters])

  // 獲取所有可用類別
  const availableCategories = useMemo(() => {
    const categories = [...new Set(allProducts.map(product => product.category))]
    return categories.sort()
  }, [allProducts])

  // 篩選回調函數
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters)
  }, [])

  const handleProductClick = (product: ExtendedProduct) => {
    setSelectedProduct(product)
  }

  const closeModal = () => {
    setSelectedProduct(null)
    setQuantity(1)
  }

  const requestQuote = (product: ExtendedProduct) => {
    if (!user) {
      window.location.href = '/login'
      return
    }

    // 導向詢問單頁面，並預填產品資訊
    const inquiryUrl = `/inquiries/create?product=${encodeURIComponent(product.name)}&quantity=${quantity}&productId=${product.id}`
    window.location.href = inquiryUrl
  }

  const toggleInterest = useCallback(
    async (productId: string, productName: string, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation()
      }

      // 檢查登入狀態
      if (!user?.id) {
        // 創建臨時 toast 提示
        const notification = document.createElement('div')
        notification.innerHTML = `
        <div class="fixed bottom-4 right-4 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg shadow-lg z-50 max-w-sm">
          <div class="flex items-start space-x-3">
            <div class="text-amber-500 text-xl">⚠</div>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-gray-900">需要登入</h4>
              <p class="mt-1 text-sm text-gray-600">請先登入以儲存您感興趣的產品</p>
              <div class="mt-3">
                <a href="/login" class="inline-block px-3 py-1 bg-amber-600 text-white text-xs rounded-md hover:bg-amber-700 transition-colors">
                  立即登入
                </a>
              </div>
            </div>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
              <span class="text-lg">×</span>
            </button>
          </div>
        </div>
      `
        document.body.appendChild(notification)
        setTimeout(() => {
          if (document.body.contains(notification)) {
            document.body.removeChild(notification)
          }
        }, 5000)
        return
      }

      // 使用函數式更新避免依賴舊狀態
      let isRemoving = false
      setInterestedProducts(prev => {
        isRemoving = prev.has(productId)
        const newSet = new Set(prev)
        if (isRemoving) {
          newSet.delete(productId)
        } else {
          newSet.add(productId)
        }
        return newSet
      })

      // 已登入：儲存到資料庫
      const success = await UserInterestsService.toggleInterest(user.id, productId)
      if (!success) {
        // 如果儲存失敗，恢復原狀態
        setInterestedProducts(prev => {
          const newSet = new Set(prev)
          if (isRemoving) {
            newSet.add(productId) // 恢復
          } else {
            newSet.delete(productId) // 恢復
          }
          return newSet
        })
        logger.error('Failed to update interests in database', undefined, {
          metadata: { action: 'update_interests' },
        })
        return
      }

      // 觸發自定義事件通知其他元件更新
      window.dispatchEvent(new CustomEvent('interestedProductsUpdated'))

      // 顯示提示訊息
      const message = isRemoving
        ? `已從興趣清單移除 ${productName}`
        : `已將 ${productName} 加入興趣清單！`

      // 簡單的提示，可以考慮後續改為 toast 通知
      const notification = document.createElement('div')
      notification.textContent = message
      notification.className =
        'fixed bottom-4 right-4 bg-amber-900 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      document.body.appendChild(notification)
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 2000)
    },
    [user?.id] // 只依賴 user?.id，避免循環依賴
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Structured Data for Products */}
      {filteredAndSortedProducts.length > 0 && (
        <>
          {filteredAndSortedProducts.slice(0, 3).map((product, index) => (
            <ProductStructuredData
              key={`structured-data-${product.id}-${index}`}
              product={{
                name: product.name,
                description: product.description,
                category: product.category,
                price: product.price,
                inventory: product.inStock ? 100 : 0,
                images: product.image ? [product.image] : ['/images/placeholder.jpg'],
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

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-100 to-orange-50 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4">
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl font-light text-amber-900 mb-2 sm:mb-4">
                精選農產品
              </h1>
              <p className="text-lg sm:text-xl text-gray-700">
                來自台灣各地的優質農產，新鮮直送到你家
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto max-w-sm sm:max-w-none">
              {/* 重新整理按鈕 - 對所有用戶可見 */}
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

              {user && user.role === 'admin' && (
                <>
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
              productCount={filteredAndSortedProducts.length}
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
            ) : filteredAndSortedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">沒有找到符合條件的產品</div>
                <p className="text-sm text-gray-400">請嘗試調整篩選條件</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {filteredAndSortedProducts.map((product, index) => (
                  <div
                    key={`product-${product.id}`} // 移除 index 避免不必要的重新渲染
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => handleProductClick(product as unknown as ExtendedProduct)}
                  >
                    {/* Product Image */}
                    <ProductCardImage product={product.productCardProps} index={index} />

                    {/* Product Info */}
                    <div className="p-6">
                      <div className="text-sm text-amber-600 mb-2">{product.category}</div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-6">{product.name}</h3>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 mb-4">
                        {/* 我有興趣按鈕 */}
                        <button
                          onClick={e => toggleInterest(product.id, product.name, e)}
                          className="p-2 rounded-full hover:bg-amber-50 transition-colors"
                          title={interestedProducts.has(product.id) ? '移除興趣' : '我有興趣'}
                        >
                          {interestedProducts.has(product.id) ? (
                            <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                          ) : (
                            <svg
                              className="w-5 h-5 text-gray-400 hover:text-red-500 transition-colors"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            product.inStock
                              ? 'bg-amber-900 text-white hover:bg-amber-800'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                          disabled={!product.inStock}
                          onClick={e => {
                            e.stopPropagation()
                            if (product.inStock) {
                              handleProductClick(product as unknown as ExtendedProduct)
                            }
                          }}
                        >
                          {product.inStock ? '查看詳情' : '暫時缺貨'}
                        </button>
                      </div>

                      {/* Price */}
                      <div>
                        <span className="text-2xl font-bold text-amber-900 whitespace-nowrap">
                          NT$ {product.price}
                          {product.priceUnit ? ` / ${product.priceUnit}` : ''}
                        </span>
                        {product.originalPrice > product.price && (
                          <span className="ml-2 text-sm text-gray-500 line-through whitespace-nowrap">
                            NT$ {product.originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Product Image Gallery */}
              <ProductImageGallery
                product={{
                  ...selectedProduct,
                  id: selectedProduct.id.toString(),
                  name: selectedProduct.name,
                  images:
                    selectedProduct.allImages && selectedProduct.allImages.length > 0
                      ? selectedProduct.allImages
                      : ['/images/placeholder.jpg'],
                  galleryImages:
                    selectedProduct.allImages && selectedProduct.allImages.length > 0
                      ? selectedProduct.allImages
                      : undefined,
                  thumbnailUrl: selectedProduct.image,
                  primaryImageUrl: selectedProduct.image,
                  inventory: selectedProduct.inStock ? 100 : 0,
                  isOnSale: (selectedProduct.originalPrice || 0) > selectedProduct.price,
                  category: selectedProduct.category,
                  price: selectedProduct.price,
                  description: selectedProduct.description,
                  isActive: true,
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                }}
                showThumbnails={true}
                autoSlide={false}
              />

              {/* Product Details */}
              <div>
                <button
                  onClick={closeModal}
                  className="float-right text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>

                <div className="text-sm text-amber-600 mb-2">{selectedProduct.category}</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">{selectedProduct.name}</h2>

                <p className="text-gray-800 mb-6 leading-relaxed">{selectedProduct.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">產品特色</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.features?.map((feature: string, index: number) => (
                      <span
                        key={index}
                        className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Specifications */}
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-800 mb-3">商品規格</h4>
                  <div className="space-y-2">
                    {selectedProduct.specifications?.map(
                      (spec: { label: string; value: string }, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between py-2 border-b border-gray-100"
                        >
                          <span className="text-gray-800">{spec.label}</span>
                          <span className="font-medium text-gray-900">{spec.value}</span>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Price and Add to Cart */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-3xl font-bold text-amber-900 whitespace-nowrap">
                        NT$ {selectedProduct.price}
                        {selectedProduct.priceUnit ? ` / ${selectedProduct.priceUnit}` : ''}
                      </span>
                      {selectedProduct.originalPrice &&
                        selectedProduct.originalPrice > selectedProduct.price && (
                          <span className="ml-2 text-lg text-gray-500 line-through whitespace-nowrap">
                            NT$ {selectedProduct.originalPrice}
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-gray-800 font-medium">數量：</span>
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-1 hover:bg-gray-100 text-gray-800"
                      >
                        -
                      </button>
                      <span className="px-4 py-1 border-x text-gray-900 font-medium">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3 py-1 hover:bg-gray-100 text-gray-800"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 mb-4">
                    {/* 我有興趣按鈕 */}
                    <button
                      onClick={() => toggleInterest(selectedProduct.id, selectedProduct.name)}
                      className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
                        interestedProducts.has(selectedProduct.id)
                          ? 'bg-red-50 text-red-600 border-2 border-red-200 hover:bg-red-100'
                          : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100 hover:border-red-200 hover:text-red-600'
                      }`}
                    >
                      {interestedProducts.has(selectedProduct.id) ? (
                        <>
                          <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                          </svg>
                          已收藏
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                          我有興趣
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => requestQuote(selectedProduct)}
                    className="w-full bg-amber-900 text-white py-4 rounded-lg font-semibold text-lg hover:bg-amber-800 transition-colors"
                    disabled={!selectedProduct.inStock}
                  >
                    {!selectedProduct.inStock ? (
                      '暫時缺貨'
                    ) : !user ? (
                      '請先登入'
                    ) : (
                      <span className="whitespace-nowrap">
                        立即詢問 - NT$ {selectedProduct.price * quantity}
                        {selectedProduct.priceUnit
                          ? ` (${quantity} ${selectedProduct.priceUnit})`
                          : ''}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPageWithErrorBoundary() {
  return (
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
  )
}
