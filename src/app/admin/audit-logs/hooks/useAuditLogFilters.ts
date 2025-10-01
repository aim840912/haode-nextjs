import { useState, useCallback } from 'react'
import { AuditLogQueryParams, AuditAction, ResourceType, UserRole } from '@/types/audit'

export interface UseAuditLogFiltersReturn {
  filters: AuditLogQueryParams
  updateFilter: (
    key: keyof AuditLogQueryParams,
    value: string | number | AuditAction | ResourceType | UserRole
  ) => void
  clearFilters: () => void
  loadMore: () => void
}

const DEFAULT_FILTERS: AuditLogQueryParams = {
  limit: 50,
  offset: 0,
  sort_by: 'created_at',
  sort_order: 'desc',
}

/**
 * 審計日誌篩選 Hook
 * 負責管理篩選條件狀態和操作
 */
export function useAuditLogFilters(): UseAuditLogFiltersReturn {
  const [filters, setFilters] = useState<AuditLogQueryParams>(DEFAULT_FILTERS)

  // 更新單個篩選條件
  const updateFilter = useCallback(
    (
      key: keyof AuditLogQueryParams,
      value: string | number | AuditAction | ResourceType | UserRole
    ) => {
      setFilters(prev => ({
        ...prev,
        [key]: value,
        offset: 0, // 重置分頁
      }))
    },
    []
  )

  // 清除所有篩選條件
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
  }, [])

  // 載入更多（分頁）
  const loadMore = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      offset: (prev.offset || 0) + (prev.limit || 50),
    }))
  }, [])

  return {
    filters,
    updateFilter,
    clearFilters,
    loadMore,
  }
}
