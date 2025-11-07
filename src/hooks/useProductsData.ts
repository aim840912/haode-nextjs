import { useState, useEffect, useCallback } from 'react'
import { useAsyncWithError } from '@/components/ui/error/ErrorHandler'
import { fetchProducts as fetchProductsAPI } from '@/lib/api/products-api'
import { logger } from '@/lib/logger'
import { Product } from '@/types/product'

export interface UseProductsDataReturn {
  products: Product[]
  loading: boolean
  error: Error | null
  refetch: (forceRefresh?: boolean) => Promise<void>
}

/**
 * 產品資料獲取 Hook
 *
 * 統一管理產品資料的載入、錯誤處理和重新獲取邏輯
 * - 自動過濾非活躍產品
 * - 統一錯誤處理
 * - 支援強制重新整理
 * - 去重複邏輯
 */
export function useProductsData(): UseProductsDataReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { executeWithErrorHandling } = useAsyncWithError()

  const fetchProducts = useCallback(
    async (_forceRefresh: boolean = false) => {
      setLoading(true)
      setError(null)

      try {
        const result = await executeWithErrorHandling(
          async () => {
            const data = await fetchProductsAPI({ isActive: true })

            // 過濾重複產品
            const uniqueProducts = data.filter(
              (product: Product, index: number, self: Product[]) =>
                index === self.findIndex(p => p.id === product.id)
            )

            setProducts(uniqueProducts)
            return uniqueProducts
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
          setProducts([])
          setError(new Error('載入產品失敗'))
        }
      } catch (error) {
        const errorObj = error as Error
        logger.error('Unexpected error in fetchProducts', errorObj, {
          metadata: { action: 'fetch_products' },
        })
        setProducts([])
        setError(errorObj)
      } finally {
        setLoading(false)
      }
    },
    [executeWithErrorHandling]
  )

  // 初始載入
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

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
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    refetch: fetchProducts,
  }
}
