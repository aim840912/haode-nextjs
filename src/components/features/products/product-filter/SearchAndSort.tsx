'use client'

import { PopularSearches } from '@/components/ui/search/PopularSearches'
import { SearchInput } from '@/components/ui/search/SearchInput'
import { FilterState } from '@/hooks/useProductFilter'

interface SearchAndSortProps {
  searchValue: string
  sortBy: FilterState['sortBy']
  onSearchChange: (value: string) => void
  onSortChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
  onSearchSelect: (query: string) => void
}

export function SearchAndSort({
  searchValue,
  sortBy,
  onSearchChange,
  onSortChange,
  onSearchSelect,
}: SearchAndSortProps) {
  return (
    <>
      {/* Search and Sort Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">搜尋產品</h3>
          <SearchInput
            value={searchValue}
            onChange={onSearchChange}
            placeholder="搜尋產品名稱、描述或類別..."
            showHistory={true}
            showSuggestions={true}
          />
        </div>
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">排序方式</h3>
          <select
            value={sortBy}
            onChange={onSortChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-gray-900 bg-white"
          >
            <option value="name">名稱 A-Z</option>
            <option value="price_low">價格由低到高</option>
            <option value="price_high">價格由高到低</option>
            <option value="newest">最新上架</option>
          </select>
        </div>
      </div>

      {/* Popular Searches - 只在沒有搜尋條件時顯示 */}
      {(!searchValue || searchValue.trim().length === 0) && (
        <div className="lg:w-1/2">
          <PopularSearches onSearchSelect={onSearchSelect} limit={5} showStats={false} />
        </div>
      )}
    </>
  )
}
