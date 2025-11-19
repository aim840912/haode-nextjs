/**
 * 行事曆錯誤狀態顯示元件
 *
 * 顯示錯誤訊息並提供重試功能
 */

interface CalendarErrorStateProps {
  /** 錯誤訊息 */
  error: string
  /** 重試回調 */
  onRetry: () => void
}

export function CalendarErrorState({ error, onRetry }: CalendarErrorStateProps) {
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
      <strong>載入失敗：</strong>
      {error}
      <button onClick={onRetry} className="ml-2 text-red-600 hover:text-red-800 underline">
        重試
      </button>
    </div>
  )
}
