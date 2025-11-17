/**
 * 表單驗證邏輯
 */

import { validatePhone } from '@/lib/utils/validation'
import type { TimeRange } from './types'

/**
 * 格式化時間區間
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  if (!startTime || !endTime) return ''
  return `${startTime}-${endTime}`
}

/**
 * 驗證單一欄位
 */
export function validateField(field: string, value: unknown, timeRange?: TimeRange): string {
  const stringValue = String(value)

  switch (field) {
    case 'title':
      return !stringValue.trim() ? '請輸入市集/夜市名稱' : ''

    case 'location':
      return !stringValue.trim() ? '請輸入詳細地址' : ''

    case 'date':
      return !stringValue ? '請選擇日期' : ''

    case 'time': {
      if (!timeRange) return '缺少時間範圍參數'
      const formattedTime = formatTimeRange(timeRange.startTime, timeRange.endTime)
      return !formattedTime ? '請選擇開始時間和結束時間' : ''
    }

    case 'contact': {
      if (!stringValue.trim()) return '請輸入聯絡電話'
      const result = validatePhone(stringValue)
      if (!result.valid) {
        return result.message || '請輸入有效的台灣電話號碼（手機或市話）'
      }
      return ''
    }

    default:
      return ''
  }
}
