'use client'

import { useState, useCallback } from 'react'
import { AdminFilterState } from './AdminProductFilter'
import { useProductsData } from './admin/hooks/useProductsData'
import { useProductActions } from './admin/hooks/useProductActions'
import { ProductTableHeader } from './admin/ProductTableHeader'
import { ProductTableRow } from './admin/ProductTableRow'
import { ProductFilters } from './admin/utils/productFilters'

interface AdminProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number
}

export default function AdminProductsTable({
  onDelete,
  onToggleActive,
  refreshTrigger,
}: AdminProductsTableProps) {
  // 篩選狀態管理
  const [filters, setFilters] = useState<AdminFilterState>({
    search: '',
    categories: [],
    availability: 'all',
    status: 'all',
    catalogVisibility: 'all',
    priceRange: { min: 0, max: 10000 },
    sortBy: 'name',
  })

  // 使用自訂 Hook 管理產品資料
  const { products, loading, error, refetch } = useProductsData(filters, refreshTrigger)

  // 使用自訂 Hook 管理產品操作
  const { handleDelete, handleToggleActive, handleToggleShowInCatalog, isActionDisabled } =
    useProductActions({
      products,
      setProducts: () => {}, // 空函數，因為產品狀態由 useProductsData 管理
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
      <ProductTableHeader
        filters={filters}
        onFiltersChange={handleFiltersChange}
        productsCount={0}
        loading={true}
      />
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <ProductTableHeader
          filters={filters}
          onFiltersChange={handleFiltersChange}
          productsCount={0}
          loading={false}
        />
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
      {/* 頁面標題和篩選器 */}
      <ProductTableHeader
        filters={filters}
        onFiltersChange={handleFiltersChange}
        productsCount={filteredAndSortedProducts.length}
        loading={loading}
      />

      {/* 產品表格 */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedProducts.map(product => (
              <ProductTableRow
                key={product.id}
                product={product}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
                onToggleShowInCatalog={handleToggleShowInCatalog}
                isActionDisabled={isActionDisabled}
                isAdmin={true} // TODO: 從實際的用戶角色判斷
              />
            ))}
          </tbody>
        </table>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">沒有找到符合條件的產品</p>
          </div>
        )}
      </div>
    </div>
  )
}
