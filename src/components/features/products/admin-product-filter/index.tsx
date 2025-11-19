/**
 * 管理員產品篩選器元件
 *
 * 提供完整的產品篩選功能，包含：
 * - 搜尋關鍵字
 * - 類別篩選
 * - 庫存和上架狀態篩選
 * - 價格區間篩選
 * - 排序功能
 */

'use client'

import { cn } from '@/lib/utils/cn'
import { CategoryFilter } from './components/CategoryFilter'
import { FilterHeader } from './components/FilterHeader'
import { PriceRangeFilter } from './components/PriceRangeFilter'
import { SearchAndSort } from './components/SearchAndSort'
import { StatusFilter } from './components/StatusFilter'
import { useAdminFilterState } from './hooks/useAdminFilterState'
import type { AdminProductFilterProps } from './types'

export type { AdminFilterState } from './types'

export function AdminProductFilter({
  onFilterChange,
  availableCategories,
  productCount,
  totalCount,
  loading = false,
}: AdminProductFilterProps) {
  const {
    filters,
    isExpanded,
    showPriceRange,
    hasActiveFilters,
    setFilters,
    setShowPriceRange,
    handleCategoryChange,
    handlePriceRangeChange,
    clearAllFilters,
    toggleExpanded,
  } = useAdminFilterState({ onFilterChange })

  return (
    <div className={cn('bg-white rounded-lg shadow-lg mb-6', isExpanded ? 'p-6' : 'p-4')}>
      <FilterHeader
        isExpanded={isExpanded}
        loading={loading}
        productCount={productCount}
        totalCount={totalCount}
        hasActiveFilters={hasActiveFilters}
        onToggle={toggleExpanded}
        onClearAll={clearAllFilters}
      />

      {isExpanded && (
        <div className="space-y-6">
          <SearchAndSort
            search={filters.search}
            sortBy={filters.sortBy}
            onSearchChange={value => setFilters(prev => ({ ...prev, search: value }))}
            onSortChange={value => setFilters(prev => ({ ...prev, sortBy: value }))}
          />

          <CategoryFilter
            availableCategories={availableCategories}
            selectedCategories={filters.categories}
            onCategoryChange={handleCategoryChange}
          />

          <StatusFilter
            availability={filters.availability}
            status={filters.status}
            onAvailabilityChange={value => setFilters(prev => ({ ...prev, availability: value }))}
            onStatusChange={value => setFilters(prev => ({ ...prev, status: value }))}
          />

          <PriceRangeFilter
            show={showPriceRange}
            minPrice={filters.priceRange.min}
            maxPrice={filters.priceRange.max}
            onToggle={() => setShowPriceRange(prev => !prev)}
            onMinChange={value => handlePriceRangeChange('min', value)}
            onMaxChange={value => handlePriceRangeChange('max', value)}
          />
        </div>
      )}
    </div>
  )
}
