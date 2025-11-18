import React from 'react'
import { INQUIRY_STATUS_LABELS, type InquiryStatus } from '@/types/inquiry'

/**
 * 狀態選項（與 CalendarToolbar 共用）
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

interface CalendarStatisticsProps {
  /** 統計資料 */
  statistics: CalendarStatistics | null
  /** 是否載入中 */
  loading: boolean
}

/**
 * 行事曆統計資訊元件
 *
 * 顯示：
 * - 總預約數
 * - 各狀態預約數量（使用顏色區分）
 */
export const CalendarStatisticsDisplay = React.memo<CalendarStatisticsProps>(
  ({ statistics, loading }) => {
    if (!statistics || loading) {
      return null
    }

    return (
      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
          {/* 總預約數 */}
          <div>
            <div className="text-2xl font-bold text-gray-900">{statistics.total}</div>
            <div className="text-sm text-gray-600">總預約</div>
          </div>

          {/* 各狀態數量 */}
          {Object.entries(statistics.byStatus).map(([status, count]) => (
            <div key={status}>
              <div
                className="text-lg font-semibold"
                style={{ color: statusOptions.find(opt => opt.value === status)?.color }}
              >
                {count}
              </div>
              <div className="text-xs text-gray-600">
                {INQUIRY_STATUS_LABELS[status as InquiryStatus]}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
)

CalendarStatisticsDisplay.displayName = 'CalendarStatisticsDisplay'
