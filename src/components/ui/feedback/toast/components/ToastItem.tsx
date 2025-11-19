/**
 * Toast 項目元件
 */

import React from 'react'
import { getToastStyles } from '../utils/styleUtils'
import { ToastActionButtons } from './ToastActionButtons'
import { ToastCloseButton } from './ToastCloseButton'
import { ToastIcon } from './ToastIcon'
import { ToastProgressBar } from './ToastProgressBar'
import type { Toast } from '../types'

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

export const ToastItem = React.memo(function ToastItem({ toast, onRemove }: ToastItemProps) {
  return (
    <div className={getToastStyles(toast.type)}>
      <div className="flex items-start space-x-3">
        <ToastIcon type={toast.type} />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-gray-900">{toast.title}</h4>
          {toast.message && <p className="mt-1 text-sm text-gray-600">{toast.message}</p>}

          {/* Progress Bar for Loading Toasts */}
          {toast.type === 'loading' && toast.progress !== undefined && (
            <ToastProgressBar progress={toast.progress} />
          )}

          {/* Action Buttons */}
          {toast.actions && <ToastActionButtons actions={toast.actions} />}
        </div>

        {/* Close Button */}
        {toast.type !== 'loading' && <ToastCloseButton onClose={() => onRemove(toast.id)} />}
      </div>
    </div>
  )
})
