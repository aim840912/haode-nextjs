/**
 * Toast 操作按鈕元件
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'
import type { ToastAction } from '../types'

interface ToastActionButtonsProps {
  actions: ToastAction[]
}

export const ToastActionButtons = React.memo(function ToastActionButtons({
  actions,
}: ToastActionButtonsProps) {
  if (actions.length === 0) return null

  return (
    <div className="mt-3 flex space-x-2">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={cn(
            'px-3 py-1 text-xs font-medium rounded-md transition-colors',
            action.variant === 'primary'
              ? 'bg-amber-600 text-white hover:bg-amber-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          )}
        >
          {action.label}
        </button>
      ))}
    </div>
  )
})
