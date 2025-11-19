/**
 * Basic Info Section Component
 *
 * 基本資訊區塊元件
 * 包含月份範圍選擇器和活動標題輸入
 */

import { MonthRangeSelector } from './MonthRangeSelector'

interface BasicInfoSectionProps {
  startMonth: number
  endMonth: number
  title: string
  onStartMonthChange: (month: number) => void
  onEndMonthChange: (month: number) => void
  onTitleChange: (title: string) => void
}

export function BasicInfoSection({
  startMonth,
  endMonth,
  title,
  onStartMonthChange,
  onEndMonthChange,
  onTitleChange,
}: BasicInfoSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">基本資訊</h3>

      <MonthRangeSelector
        startMonth={startMonth}
        endMonth={endMonth}
        onStartMonthChange={onStartMonthChange}
        onEndMonthChange={onEndMonthChange}
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
          活動標題 *
        </label>
        <input
          type="text"
          name="title"
          value={title}
          onChange={e => onTitleChange(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-slate-700"
          placeholder="輸入體驗活動標題"
        />
      </div>
    </div>
  )
}
