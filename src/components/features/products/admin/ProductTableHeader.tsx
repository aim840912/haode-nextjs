'use client'

import { useState, useEffect } from 'react'
import AdminProductFilter, { AdminFilterState } from '../AdminProductFilter'
import { SearchHistoryManager } from './utils/searchHistory'

interface ProductTableHeaderProps {
  filters: AdminFilterState
  onFiltersChange: (filters: AdminFilterState) => void
  productsCount: number
  loading: boolean
}

/**
 * 產品表格表頭元件
 * 包含篩選器、搜尋功能和搜尋歷史
 */
export function ProductTableHeader({
  filters,
  onFiltersChange,
  productsCount,
  loading,
}: ProductTableHeaderProps) {
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  useEffect(() => {
    setSearchHistory(SearchHistoryManager.getHistory())
  }, [])

  const handleFiltersChange = (newFilters: AdminFilterState) => {
    onFiltersChange(newFilters)

    // 如果有搜尋詞且不在歷史中，則添加到歷史
    if (newFilters.search && newFilters.search !== filters.search) {
      SearchHistoryManager.addToHistory(newFilters.search)
      setSearchHistory(SearchHistoryManager.getHistory())
    }
  }

  const handleClearHistory = () => {
    SearchHistoryManager.clearHistory()
    setSearchHistory([])
  }

  const handleUseHistoryTerm = (term: string) => {
    onFiltersChange({ ...filters, search: term })
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">產品管理</h1>
          <p className="mt-2 text-sm text-gray-700">
            管理您的產品，包括新增、編輯、刪除和設定產品狀態。
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-800">
            共 {loading ? '載入中...' : productsCount} 項產品
          </span>
        </div>
      </div>

      {/* 篩選器 */}
      <AdminProductFilter
        onFilterChange={handleFiltersChange}
        availableCategories={[]} // TODO: 從產品資料中計算可用分類
        productCount={productsCount}
        totalCount={productsCount} // 目前使用相同值
        loading={loading}
      />

      {/* 搜尋歷史 */}
      {searchHistory.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">最近搜尋</h3>
            <button
              onClick={handleClearHistory}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              清除歷史
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((term, index) => (
              <button
                key={index}
                onClick={() => handleUseHistoryTerm(term)}
                className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductTableHeader
