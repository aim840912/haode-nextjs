import { InquiryStatus, INQUIRY_STATUS_LABELS } from '@/types/inquiry'

interface BulkActionsProps {
  selectedCount: number
  isBatchProcessing: boolean
  onClearSelection: () => void
  onBatchMarkAsRead: () => void
  onBatchUpdateStatus: (status: InquiryStatus) => void
  onBatchDelete: () => void
}

export default function BulkActions({
  selectedCount,
  isBatchProcessing,
  onClearSelection,
  onBatchMarkAsRead,
  onBatchUpdateStatus,
  onBatchDelete,
}: BulkActionsProps) {
  if (selectedCount === 0) return null

  return (
    <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="text-sm font-medium text-amber-800 dark:text-amber-300">
            已選取 {selectedCount} 筆詢價單
          </div>
          <button
            onClick={onClearSelection}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline self-start"
          >
            取消選取
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* 批量標記已讀 */}
          <button
            onClick={onBatchMarkAsRead}
            disabled={isBatchProcessing}
            className="px-3 py-1.5 text-sm bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBatchProcessing ? '處理中...' : '標記已讀'}
          </button>

          {/* 批量狀態更新下拉選單 */}
          <select
            onChange={e => e.target.value && onBatchUpdateStatus(e.target.value as InquiryStatus)}
            value=""
            disabled={isBatchProcessing}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">更改狀態...</option>
            {(['pending', 'quoted', 'confirmed', 'completed', 'cancelled'] as const).map(status => (
              <option key={status} value={status}>
                更改為 {INQUIRY_STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          {/* 批量刪除 */}
          <button
            onClick={onBatchDelete}
            disabled={isBatchProcessing}
            className="px-3 py-1.5 text-sm bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isBatchProcessing ? '刪除中...' : '批量刪除'}
          </button>
        </div>
      </div>
    </div>
  )
}
