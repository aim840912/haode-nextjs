'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useApiLoading } from '@/hooks/useLoadingState'
import {
  DataLoading,
  ProgressiveLoading,
  ProgressiveList,
  ProgressiveImage,
} from '@/components/ProgressiveLoading'
import { LoadingError } from '@/components/LoadingError'
import { LoadingIndicator, LoadingWrapper } from '@/components/LoadingManager'
import { Product } from '@/types/product'
import { logger } from '@/lib/logger'

// 模擬產品服務
const ProductService = {
  async getAllProducts(): Promise<Product[]> {
    // 模擬 API 延遲
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 模擬隨機錯誤（10% 機率）
    if (Math.random() < 0.1) {
      throw new Error('網路連線失敗，請重試')
    }

    const response = await fetch('/api/products')
    if (!response.ok) {
      throw new Error(`載入失敗: ${response.status}`)
    }

    const data = await response.json()
    return data.data || data
  },

  async searchProducts(query: string): Promise<Product[]> {
    logger.info('搜尋產品', { module: 'ProductService', metadata: { query } })

    await new Promise(resolve => setTimeout(resolve, 800))
    const allProducts = await this.getAllProducts()
    return allProducts.filter(
      product =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
    )
  },
}

function ProductsDemo() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const { user } = useAuth()
  const { executeAsync, error, retry, canRetry } = useApiLoading()

  // 搜尋處理
  const handleSearch = useCallback(
    async (query: string) => {
      if (!query.trim()) return

      setIsSearching(true)
      try {
        await executeAsync(async updateProgress => {
          updateProgress({ current: 20, total: 100, message: '搜尋中...' })
          const results = await ProductService.searchProducts(query)
          updateProgress({ current: 100, total: 100, message: '搜尋完成' })
          return results
        }, `搜尋「${query}」中...`)
      } catch (err) {
        logger.error('產品搜尋失敗', err instanceof Error ? err : new Error(String(err)), {
          module: 'ProductsDemo',
          metadata: { query },
        })
      } finally {
        setIsSearching(false)
      }
    },
    [executeAsync]
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頁面標題 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">產品展示 - 新載入系統</h1>
          <p className="text-gray-600">展示智慧載入、漸進式載入、錯誤處理等新功能</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* 搜尋區域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">智慧搜尋載入</h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="輸入產品名稱搜尋..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              onKeyPress={e => e.key === 'Enter' && handleSearch(searchQuery)}
            />
            <button
              onClick={() => handleSearch(searchQuery)}
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSearching ? (
                <>
                  <LoadingIndicator size="sm" showMessage={false} />
                  <span>搜尋中...</span>
                </>
              ) : (
                <span>搜尋</span>
              )}
            </button>
          </div>

          {/* 搜尋結果區域 */}
          <LoadingWrapper loading={isSearching} useSmartLoading>
            <div className="mt-4">{/* 這裡會顯示搜尋結果 */}</div>
          </LoadingWrapper>
        </div>

        {/* 錯誤處理示範 */}
        {error && (
          <div className="mb-8">
            <LoadingError
              error={error}
              onRetry={retry}
              canRetry={canRetry}
              variant="card"
              showDetails={true}
            />
          </div>
        )}

        {/* 產品列表區域 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">產品列表 - 資料載入</h2>

          <DataLoading
            asyncData={ProductService.getAllProducts}
            dependencies={[user?.id]} // 當使用者改變時重新載入
            skeleton={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            }
            errorComponent={(error, retry) => (
              <LoadingError
                error={{
                  message: error.message || '載入產品失敗',
                  retryable: true,
                  timestamp: Date.now(),
                }}
                onRetry={retry}
                canRetry={true}
                variant="card"
              />
            )}
          >
            {products => (
              <ProgressiveList
                items={products}
                batchSize={6}
                loadingItemsCount={3}
                className="grid grid-cols-1 gap-6"
                itemClassName="transition-all duration-300 hover:scale-105"
                renderItem={(product, index) => <ProductCard key={product.id} product={product} />}
              />
            )}
          </DataLoading>
        </div>

        {/* 漸進式載入示範 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">漸進式載入元件</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressiveLoading
              showSpinnerAfterMs={200}
              showSkeletonAfterMs={1000}
              skeleton={
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
              }
            >
              <DelayedContent
                delay={2000}
                content={
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800">載入完成！</h3>
                    <p className="text-green-600">這個內容在 2 秒後載入</p>
                  </div>
                }
              />
            </ProgressiveLoading>

            <ProgressiveLoading
              showSpinnerAfterMs={500}
              showSkeletonAfterMs={1500}
              skeleton={<div className="h-40 bg-gray-200 rounded animate-pulse"></div>}
            >
              <DelayedContent
                delay={3000}
                content={
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="font-semibold text-blue-800">較慢載入</h3>
                    <p className="text-blue-600">這個內容在 3 秒後載入，會先顯示骨架屏</p>
                  </div>
                }
              />
            </ProgressiveLoading>
          </div>
        </div>
      </div>
    </div>
  )
}

// 產品卡片元件
function ProductCard({ product }: { product: Product }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <ProgressiveImage
        src={product.images?.[0] || '/placeholder-product.jpg'}
        alt={product.name}
        className="w-full h-48 object-cover"
        placeholder="/placeholder-small.jpg"
      />
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-amber-600">NT$ {product.price}</span>
          <button className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors">
            加入購物車
          </button>
        </div>
      </div>
    </div>
  )
}

// 延遲載入內容的輔助元件
function DelayedContent({ delay, content }: { delay: number; content: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, delay)

    return () => clearTimeout(timer)
  }, [delay])

  if (!isLoaded) {
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    )
  }

  return <>{content}</>
}

export default ProductsDemo
