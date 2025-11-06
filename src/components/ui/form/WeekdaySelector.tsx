'use client'

import { useState, useEffect } from 'react'

interface WeekdaySelectorProps {
  /** 已選擇的星期陣列，例如：["週一", "週三"] */
  value: string[]
  /** 值變更時的回調函數 */
  onChange: (days: string[]) => void
  /** 自訂樣式類別 */
  className?: string
}

// 星期選項
const WEEKDAYS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'] as const

// 特殊選項
const SPECIAL_OPTIONS = {
  IRREGULAR: '不定期公休',
  ALWAYS_OPEN: '全年無休',
} as const

/**
 * 星期選擇器元件
 *
 * 提供多選星期的介面，支援特殊選項（全年無休、不定期公休）
 * 具有互斥邏輯：選擇「全年無休」會清除其他選項
 */
export function WeekdaySelector({ value, onChange, className = '' }: WeekdaySelectorProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(value)

  // 同步外部 value 變更
  useEffect(() => {
    setSelectedDays(value)
  }, [value])

  // 切換星期選擇
  const toggleDay = (day: string) => {
    let newSelection: string[]

    if (day === SPECIAL_OPTIONS.ALWAYS_OPEN) {
      // 選擇「全年無休」→ 清除所有其他選項
      newSelection = selectedDays.includes(day) ? [] : [day]
    } else {
      // 選擇一般星期或「不定期公休」
      if (selectedDays.includes(day)) {
        // 取消選擇
        newSelection = selectedDays.filter(d => d !== day)
      } else {
        // 新增選擇，並移除「全年無休」（如果存在）
        newSelection = [...selectedDays.filter(d => d !== SPECIAL_OPTIONS.ALWAYS_OPEN), day]
      }
    }

    setSelectedDays(newSelection)
    onChange(newSelection)
  }

  // 檢查是否已選中
  const isSelected = (day: string) => selectedDays.includes(day)

  // 按鈕樣式
  const getButtonClass = (day: string) => {
    const baseClass =
      'px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'

    if (isSelected(day)) {
      return `${baseClass} bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-500 shadow-md`
    }

    return `${baseClass} bg-white border-2 border-gray-300 text-gray-700 hover:border-amber-500 hover:text-amber-600 focus:ring-amber-500`
  }

  // 格式化顯示文字
  const getDisplayText = () => {
    if (selectedDays.length === 0) {
      return '未設定公休日'
    }

    if (selectedDays.includes(SPECIAL_OPTIONS.ALWAYS_OPEN)) {
      return '全年無休'
    }

    if (selectedDays.includes(SPECIAL_OPTIONS.IRREGULAR)) {
      const otherDays = selectedDays.filter(d => d !== SPECIAL_OPTIONS.IRREGULAR)
      if (otherDays.length > 0) {
        return `${otherDays.join('、')}及不定期公休`
      }
      return '不定期公休'
    }

    return `${selectedDays.join('、')}公休`
  }

  return (
    <div className={className}>
      {/* 星期按鈕 */}
      <div className="space-y-3">
        {/* 一般星期 */}
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(day => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={getButtonClass(day)}
              aria-pressed={isSelected(day)}
              aria-label={`${isSelected(day) ? '取消' : ''}選擇${day}為公休日`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* 特殊選項 */}
        <div className="flex flex-wrap gap-2">
          <button
            key={SPECIAL_OPTIONS.IRREGULAR}
            type="button"
            onClick={() => toggleDay(SPECIAL_OPTIONS.IRREGULAR)}
            className={getButtonClass(SPECIAL_OPTIONS.IRREGULAR)}
            aria-pressed={isSelected(SPECIAL_OPTIONS.IRREGULAR)}
            aria-label={`${isSelected(SPECIAL_OPTIONS.IRREGULAR) ? '取消' : ''}選擇不定期公休`}
          >
            {SPECIAL_OPTIONS.IRREGULAR}
          </button>

          <button
            key={SPECIAL_OPTIONS.ALWAYS_OPEN}
            type="button"
            onClick={() => toggleDay(SPECIAL_OPTIONS.ALWAYS_OPEN)}
            className={getButtonClass(SPECIAL_OPTIONS.ALWAYS_OPEN)}
            aria-pressed={isSelected(SPECIAL_OPTIONS.ALWAYS_OPEN)}
            aria-label={`${isSelected(SPECIAL_OPTIONS.ALWAYS_OPEN) ? '取消' : ''}選擇全年無休`}
          >
            {SPECIAL_OPTIONS.ALWAYS_OPEN}
          </button>
        </div>
      </div>

      {/* 已選擇提示 */}
      <div className="mt-3 text-sm text-gray-600">
        <span className="font-medium">已選擇：</span>
        <span className={selectedDays.length > 0 ? 'text-amber-700' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
      </div>
    </div>
  )
}
