export function CalendarLegend() {
  return (
    <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong className="text-gray-700 dark:text-gray-200">使用說明：</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>點擊擺攤行程查看詳細資訊</li>
            <li>使用上方按鈕過濾不同狀態</li>
          </ul>
        </div>

        <div>
          <strong className="text-gray-700 dark:text-gray-200">圖例說明：</strong>
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>即將到來的擺攤行程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span>進行中的擺攤行程</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500"></div>
              <span>已結束的擺攤行程</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
