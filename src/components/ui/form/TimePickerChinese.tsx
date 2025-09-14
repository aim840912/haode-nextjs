'use client'

import { useState, useEffect } from 'react'

interface TimePickerChineseProps {
  value: string // HH:mm 格式 (24小時制)
  onChange: (time: string) => void
  required?: boolean
  className?: string
}

export default function TimePickerChinese({
  value,
  onChange,
  required = false,
  className = '',
}: TimePickerChineseProps) {
  const [period, setPeriod] = useState<'上午' | '下午'>('上午')
  const [hour, setHour] = useState<number>(12)
  const [minute, setMinute] = useState<number>(0)

  // 將24小時制轉換為12小時制的內部狀態
  useEffect(() => {
    if (value) {
      const [hourStr, minuteStr] = value.split(':')
      const hour24 = parseInt(hourStr, 10)
      const min = parseInt(minuteStr, 10)

      setMinute(min)

      if (hour24 === 0) {
        setPeriod('上午')
        setHour(12)
      } else if (hour24 < 12) {
        setPeriod('上午')
        setHour(hour24)
      } else if (hour24 === 12) {
        setPeriod('下午')
        setHour(12)
      } else {
        setPeriod('下午')
        setHour(hour24 - 12)
      }
    }
  }, [value])

  // 將12小時制轉換為24小時制並回傳
  const updateTime = (newPeriod: '上午' | '下午', newHour: number, newMinute: number) => {
    let hour24: number

    if (newPeriod === '上午') {
      hour24 = newHour === 12 ? 0 : newHour
    } else {
      hour24 = newHour === 12 ? 12 : newHour + 12
    }

    const timeString = `${hour24.toString().padStart(2, '0')}:${newMinute.toString().padStart(2, '0')}`
    onChange(timeString)
  }

  const handlePeriodChange = (newPeriod: '上午' | '下午') => {
    setPeriod(newPeriod)
    updateTime(newPeriod, hour, minute)
  }

  const handleHourChange = (newHour: number) => {
    setHour(newHour)
    updateTime(period, newHour, minute)
  }

  const handleMinuteChange = (newMinute: number) => {
    setMinute(newMinute)
    updateTime(period, hour, newMinute)
  }

  // 產生小時選項 (1-12)
  const hourOptions = Array.from({ length: 12 }, (_, i) => i + 1)

  // 產生分鐘選項 (0-59)
  const minuteOptions = Array.from({ length: 60 }, (_, i) => i)

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* 上午/下午 選擇器 */}
      <select
        value={period}
        onChange={e => handlePeriodChange(e.target.value as '上午' | '下午')}
        className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
      >
        <option value="上午">上午</option>
        <option value="下午">下午</option>
      </select>

      {/* 小時選擇器 */}
      <select
        value={hour}
        onChange={e => handleHourChange(parseInt(e.target.value, 10))}
        className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
      >
        {hourOptions.map(h => (
          <option key={h} value={h}>
            {h.toString().padStart(2, '0')}
          </option>
        ))}
      </select>

      <span className="flex items-center text-gray-500">:</span>

      {/* 分鐘選擇器 */}
      <select
        value={minute}
        onChange={e => handleMinuteChange(parseInt(e.target.value, 10))}
        className="border border-gray-300 rounded-md px-3 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        required={required}
      >
        {minuteOptions.map(m => (
          <option key={m} value={m}>
            {m.toString().padStart(2, '0')}
          </option>
        ))}
      </select>
    </div>
  )
}
