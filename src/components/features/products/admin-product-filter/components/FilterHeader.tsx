/**
 * 篩選器 Header 元件
 *
 * 顯示標題、展開/收合按鈕、產品統計資訊、清除篩選按鈕
 */

import { cn } from '@/lib/utils/cn'

interface FilterHeaderProps {
  isExpanded: boolean
  loading: boolean
  productCount: number
  totalCount: number
  hasActiveFilters: boolean
  onToggle: () => void
  onClearAll: () => void
}

export function FilterHeader({
  isExpanded,
  loading,
  productCount,
  totalCount,
  hasActiveFilters,
  onToggle,
  onClearAll,
}: FilterHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', isExpanded && 'mb-6')}>
      <div className="flex items-center space-x-4">
        <h2 className="text-lg font-semibold text-gray-900">產品篩選</h2>
        <button onClick={onToggle} className="text-gray-500 hover:text-gray-700">
          <span className={cn('transform transition-transform', isExpanded && 'rotate-180')}>
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
            onClick={onClearAll}
            className="text-sm text-amber-600 hover:text-amber-800 underline"
          >
            清除所有篩選
          </button>
        )}
      </div>
    </div>
  )
}
