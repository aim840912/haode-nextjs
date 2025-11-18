import React from 'react'
import { cn } from '@/lib/utils/cn'
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/types/inquiry'

/**
 * 狀態過濾選項
 */
const statusOptions = [
  { value: 'all', label: '全部狀態', color: '#6B7280' },
  { value: 'pending', label: INQUIRY_STATUS_LABELS.pending, color: '#9CA3AF' },
  { value: 'quoted', label: INQUIRY_STATUS_LABELS.quoted, color: '#3B82F6' },
  { value: 'confirmed', label: INQUIRY_STATUS_LABELS.confirmed, color: '#10B981' },
  { value: 'completed', label: INQUIRY_STATUS_LABELS.completed, color: '#8B5CF6' },
  { value: 'cancelled', label: INQUIRY_STATUS_LABELS.cancelled, color: '#EF4444' },
]

interface CalendarStatistics {
  total: number
  byStatus: Record<string, number>
}

interface CalendarToolbarProps {
  /** 當前狀態過濾 */
  statusFilter: 'all' | InquiryStatus[]
  /** 狀態過濾變更處理 */
  onStatusFilterChange: (filter: string) => void
  /** 重新整理處理 */
  onRefresh: () => void
  /** 新增預約處理 */
  onAddInquiry?: () => void
  /** 是否為管理員 */
  isAdmin: boolean
  /** 是否載入中 */
  loading: boolean
  /** 統計資料 */
  statistics?: CalendarStatistics | null
}

/**
 * 行事曆工具列元件
 *
 * 包含：
 * - 狀態過濾按鈕群組
 * - 重新整理按鈕
 * - 新增預約按鈕（管理員）
 */
export const CalendarToolbar = React.memo<CalendarToolbarProps>(
  ({
    statusFilter,
    onStatusFilterChange,
    onRefresh,
    onAddInquiry,
    isAdmin,
    loading,
    statistics,
  }) => {
    return (
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        {/* 狀態過濾器 */}
        <div className="flex flex-wrap gap-2">
          {statusOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onStatusFilterChange(option.value)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-lg border transition-all duration-200',
                (statusFilter === 'all' && option.value === 'all') ||
                  (Array.isArray(statusFilter) &&
                    statusFilter.includes(option.value as InquiryStatus))
                  ? 'border-transparent text-white shadow-md'
                  : 'border-gray-300 text-gray-700 hover:border-gray-400'
              )}
              style={{
                backgroundColor:
                  (statusFilter === 'all' && option.value === 'all') ||
                  (Array.isArray(statusFilter) &&
                    statusFilter.includes(option.value as InquiryStatus))
                    ? option.color
                    : 'transparent',
              }}
            >
              {option.label}
              {statistics && (
                <span className="ml-1 text-xs">
                  {option.value === 'all'
                    ? `(${statistics.total})`
                    : `(${statistics.byStatus[option.value as InquiryStatus] || 0})`}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? '載入中...' : '重新整理'}
          </button>

          {isAdmin && onAddInquiry && (
            <button
              onClick={onAddInquiry}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              新增預約
            </button>
          )}
        </div>
      </div>
    )
  }
)

CalendarToolbar.displayName = 'CalendarToolbar'
