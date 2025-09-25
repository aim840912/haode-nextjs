'use client'

import UnifiedProductsTable from './UnifiedProductsTable'

interface AdminProductsTableProps {
  onDelete?: (id: string) => void
  onToggleActive?: (id: string, isActive: boolean) => void
  refreshTrigger?: number
}

/**
 * 管理端產品表格元件 - 向後相容包裝器
 *
 * 現在使用統一的 UnifiedProductsTable 實作
 * 保持原有 API 以確保向後相容性
 */
export default function AdminProductsTable({
  onDelete,
  onToggleActive,
  refreshTrigger,
}: AdminProductsTableProps) {
  // 直接使用統一的產品表格元件
  // 完整的管理功能和篩選器
  return (
    <UnifiedProductsTable
      onDelete={onDelete}
      onToggleActive={onToggleActive}
      refreshTrigger={refreshTrigger}
      showAdminFeatures={true}
      showFilters={true}
      variant="admin"
    />
  )
}
