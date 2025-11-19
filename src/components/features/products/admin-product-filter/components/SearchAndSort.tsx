/**
 * 搜尋和排序元件
 *
 * 包含搜尋輸入框和排序下拉選單
 */

import type { AdminFilterState } from '../types'

interface SearchAndSortProps {
  search: string
  sortBy: AdminFilterState['sortBy']
  onSearchChange: (value: string) => void
  onSortChange: (value: AdminFilterState['sortBy']) => void
}

export function SearchAndSort({
  search,
  sortBy,
  onSearchChange,
  onSortChange,
}: SearchAndSortProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">搜尋產品</label>
        <input
          type="text"
          placeholder="搜尋產品名稱、描述..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
        <select
          value={sortBy}
          onChange={e => onSortChange(e.target.value as AdminFilterState['sortBy'])}
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
  )
}
