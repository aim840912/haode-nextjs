'use client'

import { useState, useEffect } from 'react'

export interface FilterState {
  categories: string[]
  priceRange: [number, number]
  availability: 'all' | 'in_stock' | 'out_of_stock'
  sortBy: 'price_low' | 'price_high' | 'name' | 'rating' | 'newest'
  search?: string
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
  totalCount 
}: ProductFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    priceRange: [0, 2000],
    availability: 'all',
    sortBy: 'name',
    search: ''
  })

  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    onFilterChange(filters)
  }, [filters, onFilterChange])

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const handlePriceChange = (index: number, value: number) => {
    setFilters(prev => ({
      ...prev,
      priceRange: index === 0 
        ? [value, prev.priceRange[1]] 
        : [prev.priceRange[0], value] as [number, number]
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      categories: [],
      priceRange: [0, 2000],
      availability: 'all',
      sortBy: 'name',
      search: ''
    })
  }

  const hasActiveFilters = filters.categories.length > 0 || 
    filters.priceRange[0] > 0 || 
    filters.priceRange[1] < 2000 || 
    filters.availability !== 'all'

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
            {totalCount !== productCount && (
              <span> / 共 {totalCount} 個</span>
            )}
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Categories */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">產品類別</h3>
            <div className="space-y-2">
              {availableCategories.map(category => (
                <label key={category} className="flex items-center">
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

          {/* Price Range */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">價格範圍</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={filters.priceRange[0]}
                  onChange={(e) => handlePriceChange(0, parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="最低"
                />
                <span className="text-gray-500">-</span>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={filters.priceRange[1]}
                  onChange={(e) => handlePriceChange(1, parseInt(e.target.value) || 2000)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900 placeholder-gray-400 bg-white"
                  placeholder="最高"
                />
              </div>
              <div className="text-xs text-gray-600 text-center mt-2">
                目前範圍：NT$ {filters.priceRange[0]} - NT$ {filters.priceRange[1]}
              </div>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">庫存狀態</h3>
            <div className="space-y-2">
              {[
                { value: 'all', label: '全部' },
                { value: 'in_stock', label: '有庫存' },
                { value: 'out_of_stock', label: '缺貨' }
              ].map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={filters.availability === option.value}
                    onChange={(e) => setFilters(prev => ({ ...prev, availability: e.target.value as any }))}
                    className="text-amber-600 focus:ring-amber-500 mr-2"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sort By */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">排序方式</h3>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
            >
              <option value="name">名稱 A-Z</option>
              <option value="price_low">價格由低到高</option>
              <option value="price_high">價格由高到低</option>
              <option value="rating">評分最高</option>
              <option value="newest">最新上架</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">搜尋產品</h3>
            <input
              type="text"
              placeholder="搜尋產品名稱..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 placeholder-gray-500 bg-white"
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>
      </div>

    </div>
  )
}