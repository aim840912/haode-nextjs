/**
 * Month Range Selector Component
 *
 * 月份範圍選擇器元件
 * 用於選擇農場體驗活動的開始和結束月份
 */

interface MonthRangeSelectorProps {
  startMonth: number
  endMonth: number
  onStartMonthChange: (month: number) => void
  onEndMonthChange: (month: number) => void
}

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: `${i + 1}月`,
}))

export function MonthRangeSelector({
  startMonth,
  endMonth,
  onStartMonthChange,
  onEndMonthChange,
}: MonthRangeSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
          開始月份 *
        </label>
        <select
          name="start_month"
          value={startMonth}
          onChange={e => onStartMonthChange(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
        >
          {monthOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
          結束月份 *
        </label>
        <select
          name="end_month"
          value={endMonth}
          onChange={e => onEndMonthChange(Number(e.target.value))}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
        >
          {monthOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
