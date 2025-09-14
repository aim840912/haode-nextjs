'use client'

import { useState, useEffect, useCallback } from 'react'
import { Product } from '@/types/product'
import { logger } from '@/lib/logger'
import { AdminFilterState } from '../../AdminProductFilter'

interface UseProductsDataReturn {
  products: Product[]
  loading: boolean
  error: string | null
  fetchProducts: () => Promise<void>
  refetch: () => Promise<void>
}

/**
 * 產品資料獲取 Hook
 * 負責管理產品列表的載入、錯誤處理和重新整理
 */
export function useProductsData(
  filters?: AdminFilterState,
  refreshTrigger?: number
): UseProductsDataReturn {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin-proxy/products')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.data)) {
        setProducts(data.data)
        logger.info('產品資料載入成功', {
          module: 'useProductsData',
          metadata: {
            count: data.data.length,
            hasFilters: !!filters,
          },
        })
      } else {
        throw new Error('API 回應格式錯誤')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '載入產品失敗'
      logger.error('產品資料載入失敗', error as Error, {
        module: 'useProductsData',
        metadata: { filters },
      })
      setError(errorMessage)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // 初始載入
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // 響應外部重新整理觸發器
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      fetchProducts()
    }
  }, [refreshTrigger, fetchProducts])

  const refetch = useCallback(() => fetchProducts(), [fetchProducts])

  return {
    products,
    loading,
    error,
    fetchProducts,
    refetch,
  }
}
