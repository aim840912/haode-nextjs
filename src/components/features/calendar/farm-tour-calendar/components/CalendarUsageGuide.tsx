/**
 * 行事曆使用說明元件
 *
 * 顯示一般使用說明和管理員功能說明
 */

interface CalendarUsageGuideProps {
  /** 是否為管理員 */
  isAdmin: boolean
}

export function CalendarUsageGuide({ isAdmin }: CalendarUsageGuideProps) {
  return (
    <div className="mt-4 text-sm text-gray-600">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>使用說明：</strong>
          <ul className="mt-2 space-y-1 list-disc list-inside">
            <li>點擊預約查看詳細資訊</li>
            <li>點擊日期可快速新增預約</li>
            <li>使用上方按鈕過濾不同狀態</li>
          </ul>
        </div>

        {isAdmin && (
          <div>
            <strong>管理員功能：</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>拖放預約可調整時間</li>
              <li>所有操作都會記錄日誌</li>
              <li>變更會即時同步到系統</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
