'use client'

import { useState, useEffect } from 'react'

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

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category],
    }))
  }

  const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = parseInt(value) || 0
    setFilters(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange!,
        [type]: numValue,
      },
    }))
  }

  const clearAllFilters = () => {
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
  }

  const hasActiveFilters =
    filters.categories.length > 0 || filters.availability !== 'all' || showPriceRange

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      {/* Mobile Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full mb-4"
        >
          <span className="text-lg font-semibold text-gray-800">篩選條件</span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
      </div>

      {/* Filter Content */}
      <div className={`space-y-6 ${!isExpanded ? 'hidden lg:block' : ''}`}>
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
              <input
                type="text"
                placeholder="搜尋產品名稱、描述或類別..."
                value={filters.search}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500 bg-white"
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">排序方式</h3>
              <select
                value={filters.sortBy}
                onChange={e =>
                  setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterState['sortBy'] }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
              >
                <option value="name">名稱 A-Z</option>
                <option value="price_low">價格由低到高</option>
                <option value="price_high">價格由高到低</option>
                <option value="rating">評分最高</option>
                <option value="newest">最新上架</option>
              </select>
            </div>
          </div>

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
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          availability: e.target.value as FilterState['availability'],
                        }))
                      }
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
                  onClick={() => setShowPriceRange(!showPriceRange)}
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
