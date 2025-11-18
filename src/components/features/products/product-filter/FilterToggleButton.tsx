'use client'

import { cn } from '@/lib/utils/cn'

interface FilterToggleButtonProps {
  isExpanded: boolean
  hasActiveFilters: boolean
  activeFilterCount: number
  onToggle: () => void
  onClearFilters: () => void
}

export function FilterToggleButton({
  isExpanded,
  hasActiveFilters,
  activeFilterCount,
  onToggle,
  onClearFilters,
}: FilterToggleButtonProps) {
  return (
    <div className={cn(isExpanded && 'mb-4')}>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full hover:bg-gray-50 p-1.5 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className={cn(isExpanded ? 'text-lg' : 'text-base', 'font-semibold text-gray-800')}>
            篩選條件
          </span>
          {hasActiveFilters && (
            <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
              {activeFilterCount} 個篩選
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{isExpanded ? '收合' : '展開'}</span>
          <svg
            className={cn(
              'w-5 h-5 text-gray-500 transform transition-transform duration-200',
              isExpanded && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 收合狀態下只顯示清除篩選按鈕 */}
      {!isExpanded && hasActiveFilters && (
        <div className="text-sm text-gray-600 mt-2 px-2">
          <button
            onClick={onClearFilters}
            className="text-amber-600 hover:text-amber-800 underline"
          >
            清除所有篩選
          </button>
        </div>
      )}
    </div>
  )
}
