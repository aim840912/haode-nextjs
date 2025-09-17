'use client'

import { useState, useEffect, useCallback } from 'react'

export interface AdminFilterState {
  search: string
  categories: string[]
  availability: 'all' | 'in_stock' | 'out_of_stock'
  status: 'all' | 'active' | 'inactive'
  priceRange: {
    min: number
    max: number
  }
  sortBy:
    | 'name'
    | 'price_low'
    | 'price_high'
    | 'category'
    | 'inventory'
    | 'created_desc'
    | 'created_asc'
}

interface AdminProductFilterProps {
  onFilterChange: (filters: AdminFilterState) => void
  availableCategories: string[]
  productCount: number
  totalCount: number
  loading?: boolean
}

export default function AdminProductFilter({
  onFilterChange,
  availableCategories,
  productCount,
  totalCount,
  loading = false,
}: AdminProductFilterProps) {
  const [filters, setFilters] = useState<AdminFilterState>({
    search: '',
    categories: [],
    availability: 'all',
    status: 'all',
    priceRange: {
      min: 0,
      max: 10000,
    },
    sortBy: 'name',
  })

  const [isExpanded, setIsExpanded] = useState(true)
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

  const clearAllFilters = () => {
    setFilters({
      search: '',
      categories: [],
      availability: 'all',
      status: 'all',
      priceRange: {
        min: 0,
        max: 10000,
      },
      sortBy: 'name',
    })
    setShowPriceRange(false)
  }

  const hasActiveFilters =
    filters.search !== '' ||
    filters.categories.length > 0 ||
    filters.availability !== 'all' ||
    filters.status !== 'all' ||
    showPriceRange

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-lg font-semibold text-gray-900">產品篩選</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                <span>搜尋中...</span>
              </div>
            ) : (
              <>
                顯示 <span className="font-semibold text-amber-900">{productCount}</span> 個產品
                {totalCount !== productCount && <span> / 共 {totalCount} 個</span>}
              </>
            )}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-amber-600 hover:text-amber-800 underline"
            >
              清除所有篩選
            </button>
          )}
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="space-y-6">
          {/* Search */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜尋產品</label>
              <input
                type="text"
                placeholder="搜尋產品名稱、描述..."
                value={filters.search}
                onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as AdminFilterState['sortBy'],
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="name">名稱 A-Z</option>
                <option value="price_low">價格由低到高</option>
                <option value="price_high">價格由高到低</option>
                <option value="category">類別</option>
                <option value="inventory">庫存數量</option>
                <option value="created_desc">建立時間（新到舊）</option>
                <option value="created_asc">建立時間（舊到新）</option>
              </select>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">產品類別</label>
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

          {/* Status Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">庫存狀態</label>
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
                          availability: e.target.value as AdminFilterState['availability'],
                        }))
                      }
                      className="text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">上架狀態</label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: '全部' },
                  { value: 'active', label: '已上架' },
                  { value: 'inactive', label: '已下架' },
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      value={option.value}
                      checked={filters.status === option.value}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          status: e.target.value as AdminFilterState['status'],
                        }))
                      }
                      className="text-amber-600 focus:ring-amber-500 mr-2"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700">價格區間</label>
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
                    value={filters.priceRange.min}
                    onChange={e => handlePriceRangeChange('min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">最高價格</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10000"
                    value={filters.priceRange.max}
                    onChange={e => handlePriceRangeChange('max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
