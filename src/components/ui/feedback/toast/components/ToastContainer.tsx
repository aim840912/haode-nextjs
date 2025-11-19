/**
 * Toast 容器元件
 */

import React from 'react'
import { getPositionClasses, groupToastsByPosition } from '../utils/positionUtils'
import { ToastItem } from './ToastItem'
import type { Toast } from '../types'

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

export const ToastContainer = React.memo(function ToastContainer({
  toasts,
  onRemove,
}: ToastContainerProps) {
  if (toasts.length === 0) return null

  // 將 toasts 依位置分組
  const toastsByPosition = groupToastsByPosition(toasts)

  return (
    <>
      {Array.from(toastsByPosition.entries()).map(([position, positionToasts]) => (
        <div key={position} className={getPositionClasses(position)}>
          {positionToasts.map(toast => (
            <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
          ))}
        </div>
      ))}
    </>
  )
})
