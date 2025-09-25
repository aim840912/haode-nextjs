'use client'

import { useState, useCallback } from 'react'
import { AdminFilterState } from './AdminProductFilter'
import { useProductsData } from './admin/hooks/useProductsData'
import { useProductActions } from './admin/hooks/useProductActions'
import { ProductTableHeader } from './admin/ProductTableHeader'
import { ProductTableHead } from './admin/ProductTableHead'
import { ProductTableRow } from './admin/ProductTableRow'
import { ProductFilters } from './admin/utils/productFilters'

interface UnifiedProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number
  /** 是否顯示管理功能 (默認根據用戶權限判斷) */
  showAdminFeatures?: boolean
  /** 是否顯示篩選器 (默認 true) */
  showFilters?: boolean
  /** 表格模式: 'admin' | 'simple' */
  variant?: 'admin' | 'simple'
}

/**
 * 統一的產品表格元件
 * 整合了 AdminProductsTable 和 ProductsTable 的功能
 * 可根據 props 控制顯示的功能和外觀
 */
export default function UnifiedProductsTable({
  onDelete,
  onToggleActive,
  refreshTrigger,
  showAdminFeatures = true,
  showFilters = true,
  variant = 'admin',
}: UnifiedProductsTableProps) {
  // 篩選狀態管理
  const [filters, setFilters] = useState<AdminFilterState>({
    search: '',
    categories: [],
    availability: 'all',
    status: 'all',
    priceRange: { min: 0, max: 10000 },
    sortBy: 'name',
  })

  // 使用統一的 Hook 管理產品資料
  const { products, setProducts, loading, error, refetch } = useProductsData(
    filters,
    refreshTrigger
  )

  // 使用統一的 Hook 管理產品操作
  const { handleDelete, handleToggleActive, isActionDisabled } = useProductActions({
    products,
    setProducts,
    refetchData: refetch,
    onDelete,
    onToggleActive,
  })

  // 篩選處理函數
  const handleFiltersChange = useCallback((newFilters: AdminFilterState) => {
    setFilters(newFilters)
  }, [])

  // 使用 ProductFilters 工具類處理篩選和排序
  const filteredAndSortedProducts = ProductFilters.filterAndSortProducts(products, filters)

  if (loading) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <ProductTableHeader
            filters={filters}
            onFiltersChange={handleFiltersChange}
            productsCount={0}
            loading={true}
          />
        )}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-900 mx-auto mb-4"></div>
            <p className="text-gray-600">載入產品資料中...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        {showFilters && (
          <ProductTableHeader
            filters={filters}
            onFiltersChange={handleFiltersChange}
            productsCount={0}
            loading={false}
          />
        )}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 text-center">
            <div className="text-red-600 mb-4">⚠️</div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refetch}
              className="bg-amber-900 text-white px-4 py-2 rounded-lg hover:bg-amber-800 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 頁面標題和篩選器 - 根據 variant 決定是否顯示 */}
      {showFilters && variant === 'admin' && (
        <ProductTableHeader
          filters={filters}
          onFiltersChange={handleFiltersChange}
          productsCount={filteredAndSortedProducts.length}
          loading={loading}
        />
      )}

      {/* 產品表格 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <ProductTableHead />
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProducts.map(product => (
              <ProductTableRow
                key={product.id}
                product={product}
                onDelete={showAdminFeatures ? handleDelete : undefined}
                onToggleActive={showAdminFeatures ? handleToggleActive : undefined}
                isActionDisabled={isActionDisabled}
                isAdmin={showAdminFeatures}
              />
            ))}
          </tbody>
        </table>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <div className="mb-6 flex justify-center">
              <svg
                className="w-24 h-24 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <p className="text-gray-500 mb-4">沒有找到符合條件的產品</p>
            {showAdminFeatures && (
              <p className="text-sm text-gray-400">
                您可以
                <a href="/admin/products/add" className="text-amber-600 hover:text-amber-500">
                  新增第一個產品
                </a>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// 向後相容的別名導出
export { UnifiedProductsTable }
export { UnifiedProductsTable as ModernProductsTable }
