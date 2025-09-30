'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import SearchInput from '@/components/ui/search/SearchInput'
import PopularSearches from '@/components/ui/search/PopularSearches'

export interface FilterState {
  categories: string[]
  availability: 'all' | 'in_stock' | 'out_of_stock'
  sortBy: 'price_low' | 'price_high' | 'name' | 'rating' | 'newest'
  search?: string
  priceRange?: {
    min: number
    max: number
  }
}

interface ProductFilterProps {
  onFilterChange: (filters: FilterState) => void
  availableCategories: string[]
  productCount: number
  totalCount: number
}

export default function ProductFilter({
  onFilterChange,
  availableCategories,
  productCount,
  totalCount,
}: ProductFilterProps) {
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

  const [isExpanded, setIsExpanded] = useState(false)
  const [showPriceRange, setShowPriceRange] = useState(false)

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleCategoryChange = useCallback((category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }, [])

  const handlePriceRangeChange = useCallback((type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange!,
        [type]: numValue,
      },
    }))
  }, [])

  const clearAllFilters = useCallback(() => {
    setFilters({
      categories: [],
      availability: 'all',
      sortBy: 'name',
      search: '',
      priceRange: {
        min: 0,
        max: 5000,
      },
    })
    setShowPriceRange(false)
  }, [])

  const hasActiveFilters = useMemo(
    () =>
      filters.categories.length > 0 ||
      filters.availability !== 'all' ||
      showPriceRange ||
      (filters.search && filters.search.trim().length > 0),
    [filters.categories.length, filters.availability, showPriceRange, filters.search]
  )

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
  }, [])

  const handleSortChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))
  }, [])

  const handleSearchSelect = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, search: query }))
  }, [])

  const handleAvailabilityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      availability: e.target.value as FilterState['availability'],
    }))
  }, [])

  const togglePriceRange = useCallback(() => {
    setShowPriceRange(prev => !prev)
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-lg ${isExpanded ? 'p-6' : 'p-4'} mb-6`}>
      {/* Toggle Button - 所有裝置都可使用 */}
      <div className={isExpanded ? 'mb-4' : ''}>
        <button
          onClick={toggleExpanded}
          className="flex items-center justify-between w-full hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className={`${isExpanded ? 'text-lg' : 'text-base'} font-semibold text-gray-800`}>
              篩選條件
            </span>
            {hasActiveFilters && (
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                {filters.categories.length +
                  (filters.availability !== 'all' ? 1 : 0) +
                  (showPriceRange ? 1 : 0)}{' '}
                個篩選
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{isExpanded ? '收合' : '展開'}</span>
            <svg
              className={`w-5 h-5 text-gray-500 transform transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>

        {/* 收合狀態下只顯示清除篩選按鈕 */}
        {!isExpanded && hasActiveFilters && (
          <div className="text-sm text-gray-600 mt-2 px-2">
            <button
              onClick={clearAllFilters}
              className="text-amber-600 hover:text-amber-800 underline"
            >
              清除所有篩選
            </button>
          </div>
        )}
      </div>

      {/* Filter Content */}
      <div
        className={`space-y-6 transition-all duration-200 ${!isExpanded ? 'hidden' : 'animate-in slide-in-from-top-2'}`}
      >
        {/* Results Count */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="text-sm text-gray-600">
            顯示 <span className="font-semibold text-amber-900">{productCount}</span> 個產品
            {totalCount !== productCount && <span> / 共 {totalCount} 個</span>}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-amber-600 hover:text-amber-800 underline"
            >
              清除篩選
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Search and Sort Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">搜尋產品</h3>
              <SearchInput
                value={filters.search || ''}
                onChange={handleSearchChange}
                placeholder="搜尋產品名稱、描述或類別..."
                showHistory={true}
                showSuggestions={true}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">排序方式</h3>
              <select
                value={filters.sortBy}
                onChange={handleSortChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
              >
                <option value="name">名稱 A-Z</option>
                <option value="price_low">價格由低到高</option>
                <option value="price_high">價格由高到低</option>
                <option value="newest">最新上架</option>
              </select>
            </div>
          </div>

          {/* Popular Searches - 只在沒有搜尋條件時顯示 */}
          {(!filters.search || filters.search.trim().length === 0) && (
            <div className="lg:w-1/2">
              <PopularSearches onSearchSelect={handleSearchSelect} limit={5} showStats={false} />
            </div>
          )}

          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">產品類別</h3>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map(category => (
                <label
                  key={category}
                  className="flex items-center bg-gray-50 px-3 py-2 rounded-lg hover:bg-gray-100 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryChange(category)}
                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">{category}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Availability */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">庫存狀態</h3>
              <div className="space-y-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'in_stock', label: '有庫存' },
                  { value: 'out_of_stock', label: '缺貨' },
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="availability"
                      value={option.value}
                      checked={filters.availability === option.value}
                      onChange={handleAvailabilityChange}
                      className="text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    <span className="text-sm text-gray-900">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">價格區間</h3>
                <button
                  onClick={togglePriceRange}
                  className={`text-sm px-3 py-1 rounded ${
                    showPriceRange
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {showPriceRange ? '隱藏' : '設定價格區間'}
                </button>
              </div>

              {showPriceRange && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最低價格</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={filters.priceRange?.min || 0}
                      onChange={e => handlePriceRangeChange('min', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">最高價格</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="5000"
                      value={filters.priceRange?.max || 5000}
                      onChange={e => handlePriceRangeChange('max', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
