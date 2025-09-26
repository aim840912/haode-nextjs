interface EmptyStateProps {
  type: 'no_data' | 'no_results'
}

/**
 * 產品頁面空狀態組件
 *
 * 統一處理不同類型的空狀態顯示
 * - no_data: 沒有產品資料
 * - no_results: 篩選後無結果
 */
export function ProductsEmptyState({ type }: EmptyStateProps) {
  if (type === 'no_data') {
    return (
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
        <div className="text-gray-500 mb-4">目前沒有產品資料</div>
        <p className="text-sm text-gray-400">請稍後再試，或聯絡我們獲取更多資訊</p>
      </div>
    )
  }

  return (
    <div className="text-center py-12">
      <div className="mb-6 flex justify-center">
        <svg
          className="w-16 h-16 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>
      <div className="text-gray-500 mb-4">沒有找到符合條件的產品</div>
      <p className="text-sm text-gray-400">請嘗試調整篩選條件</p>
    </div>
  )
}
