/**
 * 產品資料獲取 Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { fetchProducts as fetchProductsAPI } from '@/lib/api/products-api'
import { logger } from '@/lib/logger'
import type { Product } from '@/types/product'

export function useProductsData() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setError(null)
      const data = await fetchProductsAPI({ isActive: true })
      const activeProducts = data.slice(0, 3)
      setProducts(activeProducts)
    } catch (error) {
      logger.error('Error fetching products', error as Error, {
        metadata: { component: 'ProductsSection' },
      })
      setError(error instanceof Error ? error.message : '載入產品失敗')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleRetry = useCallback(() => {
    setLoading(true)
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    handleRetry,
  }
}
