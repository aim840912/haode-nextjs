/**
 * 價格區間篩選元件
 *
 * 提供最低/最高價格輸入功能
 */

import { cn } from '@/lib/utils/cn'

interface PriceRangeFilterProps {
  show: boolean
  minPrice: number
  maxPrice: number
  onToggle: () => void
  onMinChange: (value: string) => void
  onMaxChange: (value: string) => void
}

export function PriceRangeFilter({
  show,
  minPrice,
  maxPrice,
  onToggle,
  onMinChange,
  onMaxChange,
}: PriceRangeFilterProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-medium text-gray-700">價格區間</label>
        <button
          onClick={onToggle}
          className={cn(
            'text-sm px-3 py-1 rounded',
            show ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {show ? '隱藏' : '設定價格區間'}
        </button>
      </div>

      {show && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">最低價格</label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={minPrice}
              onChange={e => onMinChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">最高價格</label>
            <input
              type="number"
              min="0"
              placeholder="10000"
              value={maxPrice}
              onChange={e => onMaxChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  )
}
