'use client'

interface FilterResultsCountProps {
  productCount: number
  totalCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function FilterResultsCount({
  productCount,
  totalCount,
  hasActiveFilters,
  onClearFilters,
}: FilterResultsCountProps) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div className="text-sm text-gray-600">
        顯示 <span className="font-semibold text-amber-900">{productCount}</span> 個產品
        {totalCount !== productCount && <span> / 共 {totalCount} 個</span>}
      </div>
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="text-sm text-amber-600 hover:text-amber-800 underline"
        >
          清除篩選
        </button>
      )}
    </div>
  )
}
