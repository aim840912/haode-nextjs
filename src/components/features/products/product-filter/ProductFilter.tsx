'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { FilterState } from '@/hooks/useProductFilter'
import { cn } from '@/lib/utils/cn'
import { AvailabilityFilter } from './AvailabilityFilter'
import { CategoryFilter } from './CategoryFilter'
import { FilterResultsCount } from './FilterResultsCount'
import { FilterToggleButton } from './FilterToggleButton'
import { PriceRangeFilter } from './PriceRangeFilter'
import { SearchAndSort } from './SearchAndSort'

export interface ProductFilterProps {
  onFilterChange: (filters: FilterState) => void
  availableCategories: string[]
  productCount: number
  totalCount: number
  integrated?: boolean // 是否整合到 Header 內
}

export function ProductFilter({
  onFilterChange,
  availableCategories,
  productCount,
  totalCount,
  integrated = false,
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
      Boolean(filters.search && filters.search.trim().length > 0),
    [filters.categories.length, filters.availability, showPriceRange, filters.search]
  )

  const activeFilterCount = useMemo(
    () =>
      filters.categories.length +
      (filters.availability !== 'all' ? 1 : 0) +
      (showPriceRange ? 1 : 0),
    [filters.categories.length, filters.availability, showPriceRange]
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
    <div
      className={cn(
        integrated
          ? // 整合模式：使用分隔線，無背景、圓角、陰影
            ['border-t border-gray-200 dark:border-slate-600 pt-2', isExpanded && 'pb-2']
          : // 獨立模式：卡片樣式
            ['bg-white rounded-lg shadow-lg mb-6', isExpanded ? 'p-6' : 'p-4']
      )}
    >
      {/* Toggle Button */}
      <FilterToggleButton
        isExpanded={isExpanded}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        onToggle={toggleExpanded}
        onClearFilters={clearAllFilters}
      />

      {/* Filter Content */}
      <div
        className={cn(
          'space-y-6 transition-all duration-200',
          !isExpanded ? 'hidden' : 'animate-in slide-in-from-top-2'
        )}
      >
        {/* Results Count */}
        <FilterResultsCount
          productCount={productCount}
          totalCount={totalCount}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearAllFilters}
        />

        <div className="space-y-6">
          {/* Search and Sort */}
          <SearchAndSort
            searchValue={filters.search || ''}
            sortBy={filters.sortBy}
            onSearchChange={handleSearchChange}
            onSortChange={handleSortChange}
            onSearchSelect={handleSearchSelect}
          />

          {/* Categories */}
          <CategoryFilter
            availableCategories={availableCategories}
            selectedCategories={filters.categories}
            onCategoryChange={handleCategoryChange}
          />

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Availability */}
            <AvailabilityFilter
              availability={filters.availability}
              onAvailabilityChange={handleAvailabilityChange}
            />

            {/* Price Range */}
            <PriceRangeFilter
              minPrice={filters.priceRange?.min || 0}
              maxPrice={filters.priceRange?.max || 5000}
              showPriceRange={showPriceRange}
              onPriceRangeChange={handlePriceRangeChange}
              onTogglePriceRange={togglePriceRange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
