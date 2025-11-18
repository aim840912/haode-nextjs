/**
 * Toast 樣式生成工具
 */

import { cn } from '@/lib/utils/cn'
import type { ToastType } from '../types'

/**
 * 根據 Toast 類型取得樣式類別
 */
export function getToastStyles(type: ToastType): string {
  const baseStyles =
    'flex flex-col p-4 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 transform'

  switch (type) {
    case 'success':
      return cn(baseStyles, 'bg-green-50 border-l-4 border-green-500')
    case 'error':
      return cn(baseStyles, 'bg-red-50 border-l-4 border-red-500')
    case 'warning':
      return cn(baseStyles, 'bg-yellow-50 border-l-4 border-yellow-500')
    case 'info':
      return cn(baseStyles, 'bg-blue-50 border-l-4 border-blue-500')
    case 'loading':
      return cn(baseStyles, 'bg-amber-50 border-l-4 border-amber-500')
    default:
      return cn(baseStyles, 'bg-gray-50 border-l-4 border-gray-500')
  }
}

/**
 * 根據 Toast 類型取得圖示顏色樣式
 */
export function getIconStyles(type: ToastType): string {
  switch (type) {
    case 'success':
      return 'text-green-500'
    case 'error':
      return 'text-red-500'
    case 'warning':
      return 'text-yellow-500'
    case 'info':
      return 'text-blue-500'
    case 'loading':
      return 'text-amber-500'
    default:
      return 'text-gray-500'
  }
}
