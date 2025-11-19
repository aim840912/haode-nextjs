/**
 * Toast 圖示元件
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'
import { getIconStyles } from '../utils/styleUtils'
import type { ToastType } from '../types'

interface ToastIconProps {
  type: ToastType
}

/**
 * 根據 Toast 類型取得圖示內容
 */
function getIconContent(type: ToastType): React.ReactNode {
  switch (type) {
    case 'success':
      return '✓'
    case 'error':
      return '✕'
    case 'warning':
      return '⚠'
    case 'info':
      return 'ⓘ'
    case 'loading':
      return (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-600 border-t-transparent"></div>
      )
    default:
      return 'ⓘ'
  }
}

export const ToastIcon = React.memo(function ToastIcon({ type }: ToastIconProps) {
  return (
    <div
      className={cn(
        'flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-bold text-sm',
        getIconStyles(type)
      )}
    >
      {getIconContent(type)}
    </div>
  )
})
