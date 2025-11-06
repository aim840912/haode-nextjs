'use client'

import { UnifiedProductsTable } from './UnifiedProductsTable'

interface ProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number
}

/**
 * 產品表格元件 - 向後相容包裝器
 *
 * 現在使用統一的 UnifiedProductsTable 實作
 * 保持原有 API 以確保向後相容性
 */
export function ProductsTable({ onDelete, onToggleActive, refreshTrigger }: ProductsTableProps) {
  // 直接使用統一的產品表格元件
  // showAdminFeatures 設為 true 以保持原有行為
  // showFilters 設為 false 以符合原始 ProductsTable 的簡潔設計
  return (
    <UnifiedProductsTable
      onDelete={onDelete}
      onToggleActive={onToggleActive}
      refreshTrigger={refreshTrigger}
      showAdminFeatures={true}
      showFilters={false}
      variant="simple"
    />
  )
}
