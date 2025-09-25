import { useState, useMemo, useCallback } from 'react'
import { Product } from '@/types/product'

export interface FilterState {
  categories: string[]
  availability: 'all' | 'in_stock' | 'out_of_stock'
  sortBy: 'name' | 'price_low' | 'price_high' | 'newest'
  search: string
  priceRange: {
    min: number
    max: number
  }
}

export interface UseProductFilterReturn {
  filters: FilterState
  setFilters: (filters: FilterState) => void
  filteredProducts: Product[]
  availableCategories: string[]
  resetFilters: () => void
}

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  availability: 'all',
  sortBy: 'name',
  search: '',
  priceRange: {
    min: 0,
    max: 5000,
  },
}

/**
 * 產品篩選和排序 Hook
 *
 * 提供完整的產品篩選功能：
 * - 類別篩選
 * - 庫存狀態篩選
 * - 搜尋功能
 * - 價格區間篩選
 * - 多種排序選項
 * - 效能優化的 memo 計算
 */
export function useProductFilter(products: Product[]): UseProductFilterReturn {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)

  // 計算所有可用類別
  const availableCategories = useMemo(() => {
    const categories = [...new Set(products.map(product => product.category))]
    return categories.sort()
  }, [products])

  // 篩選和排序邏輯
  const filteredProducts = useMemo(() => {
    let filtered = [...products]

    // 類別篩選
    if (filters.categories.length > 0) {
      filtered = filtered.filter(product => filters.categories.includes(product.category))
    }

    // 庫存狀態篩選
    if (filters.availability === 'in_stock') {
      filtered = filtered.filter(product => product.inventory > 0)
    } else if (filters.availability === 'out_of_stock') {
      filtered = filtered.filter(product => product.inventory <= 0)
    }

    // 搜尋篩選
    if (filters.search && filters.search.trim()) {
      const searchTerm = filters.search.toLowerCase().trim()
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
          product.price >= filters.priceRange.min && product.price <= filters.priceRange.max
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
          // 假設 ID 是遞增的，較新的產品有較大的 ID
          return parseInt(b.id) - parseInt(a.id)
        default:
          return 0
      }
    })

    return filtered
  }, [products, filters])

  // 重置篩選條件
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  return {
    filters,
    setFilters,
    filteredProducts,
    availableCategories,
    resetFilters,
  }
}
