'use client'

import { cn } from '@/lib/utils/cn'

interface PriceRangeFilterProps {
  minPrice: number
  maxPrice: number
  showPriceRange: boolean
  onPriceRangeChange: (type: 'min' | 'max', value: string) => void
  onTogglePriceRange: () => void
}

export function PriceRangeFilter({
  minPrice,
  maxPrice,
  showPriceRange,
  onPriceRangeChange,
  onTogglePriceRange,
}: PriceRangeFilterProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">價格區間</h3>
        <button
          onClick={onTogglePriceRange}
          className={cn(
            'text-sm px-3 py-1 rounded',
            showPriceRange
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
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
              value={minPrice}
              onChange={e => onPriceRangeChange('min', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">最高價格</label>
            <input
              type="number"
              min="0"
              placeholder="5000"
              value={maxPrice}
              onChange={e => onPriceRangeChange('max', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900"
            />
          </div>
        </div>
      )}
    </div>
  )
}
