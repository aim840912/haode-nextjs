import {
  InquiryStatus,
  InquiryType,
  INQUIRY_STATUS_LABELS,
  INQUIRY_TYPE_LABELS,
} from '@/types/inquiry'

interface InquiryStats {
  total: number
  unread: number
  unreplied: number
}

interface InquiryFiltersProps {
  statusFilter: InquiryStatus | 'all' | 'unread' | 'unreplied'
  typeFilter: InquiryType | 'all'
  inquiryStats: InquiryStats
  inquiriesCount: number
  onStatusFilterChange: (filter: InquiryStatus | 'all' | 'unread' | 'unreplied') => void
  onTypeFilterChange: (filter: InquiryType | 'all') => void
}

export default function InquiryFilters({
  statusFilter,
  typeFilter,
  inquiryStats,
  inquiriesCount,
  onStatusFilterChange,
  onTypeFilterChange,
}: InquiryFiltersProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
      <div className="space-y-4">
        {/* 類型篩選 */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base shrink-0">
            詢問類型：
          </span>
          <div className="flex flex-wrap gap-2">
            {['all', 'product', 'farm_tour'].map(type => (
              <button
                key={type}
                onClick={() => onTypeFilterChange(type as InquiryType | 'all')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                  typeFilter === type
                    ? 'bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {type === 'all' ? '全部類型' : INQUIRY_TYPE_LABELS[type as InquiryType]}
              </button>
            ))}
          </div>
        </div>

        {/* 狀態篩選 */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-gray-700 dark:text-gray-300 font-medium text-sm sm:text-base shrink-0">
              處理狀態：
            </span>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  'all',
                  'unread',
                  'unreplied',
                  'pending',
                  'quoted',
                  'confirmed',
                  'completed',
                  'cancelled',
                ] as const
              ).map(filter => {
                let displayName = ''
                let badgeClass = ''

                if (filter === 'all') {
                  displayName = '全部'
                } else if (filter === 'unread') {
                  displayName = `未讀 (${inquiryStats.unread})`
                  badgeClass = inquiryStats.unread > 0 ? 'text-orange-600 dark:text-orange-400' : ''
                } else if (filter === 'unreplied') {
                  displayName = `待回覆 (${inquiryStats.unreplied})`
                  badgeClass = inquiryStats.unreplied > 0 ? 'text-red-600 dark:text-red-400' : ''
                } else {
                  displayName = INQUIRY_STATUS_LABELS[filter as InquiryStatus]
                }

                return (
                  <button
                    key={filter}
                    onClick={() => onStatusFilterChange(filter)}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      statusFilter === filter
                        ? 'bg-amber-900 dark:bg-amber-800 text-white hover:bg-amber-800 dark:hover:bg-amber-700'
                        : `bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 ${badgeClass || 'text-gray-700 dark:text-gray-300'}`
                    }`}
                  >
                    {displayName}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
            共 {inquiriesCount} 筆詢問單
          </div>
        </div>
      </div>
    </div>
  )
}
