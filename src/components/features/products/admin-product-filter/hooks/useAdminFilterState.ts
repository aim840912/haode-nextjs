/**
 * 管理員產品篩選器狀態管理 Hook
 *
 * 此 Hook 負責管理篩選器的所有狀態和邏輯
 */

import { useState, useEffect, useCallback } from 'react'
import type { AdminFilterState } from '../types'

interface UseAdminFilterStateProps {
  onFilterChange: (filters: AdminFilterState) => void
}

interface UseAdminFilterStateReturn {
  filters: AdminFilterState
  isExpanded: boolean
  showPriceRange: boolean
  hasActiveFilters: boolean
  setFilters: React.Dispatch<React.SetStateAction<AdminFilterState>>
  setIsExpanded: React.Dispatch<React.SetStateAction<boolean>>
  setShowPriceRange: React.Dispatch<React.SetStateAction<boolean>>
  handleCategoryChange: (category: string) => void
  handlePriceRangeChange: (type: 'min' | 'max', value: string) => void
  clearAllFilters: () => void
  toggleExpanded: () => void
}

const DEFAULT_FILTERS: AdminFilterState = {
  search: '',
  categories: [],
  availability: 'all',
  status: 'all',
  priceRange: {
    min: 0,
    max: 10000,
  },
  sortBy: 'name',
}

export function useAdminFilterState({
  onFilterChange,
}: UseAdminFilterStateProps): UseAdminFilterStateReturn {
  const [filters, setFilters] = useState<AdminFilterState>(DEFAULT_FILTERS)
  const [isExpanded, setIsExpanded] = useState(false)
  const [showPriceRange, setShowPriceRange] = useState(false)

  // 通知父元件篩選條件變更
  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  // 處理類別勾選
  const handleCategoryChange = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }, [])

  // 處理價格區間變更
  const handlePriceRangeChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [type]: numValue,
      },
    }))
  }, [])

  // 清除所有篩選
  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setShowPriceRange(false)
  }, [])

  // 切換展開/收合
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  // 計算是否有啟用的篩選條件
  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.availability !== 'all' ||
    filters.status !== 'all' ||
    showPriceRange

  return {
    filters,
    isExpanded,
    showPriceRange,
    hasActiveFilters,
    setFilters,
    setIsExpanded,
    setShowPriceRange,
    handleCategoryChange,
    handlePriceRangeChange,
    clearAllFilters,
    toggleExpanded,
  }
}
