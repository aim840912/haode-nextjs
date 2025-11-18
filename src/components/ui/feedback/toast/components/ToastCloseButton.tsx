/**
 * Toast 關閉按鈕元件
 */

import React from 'react'

interface ToastCloseButtonProps {
  onClose: () => void
}

export const ToastCloseButton = React.memo(function ToastCloseButton({
  onClose,
}: ToastCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
    >
      <span className="sr-only">關閉</span>
      <span className="text-lg">×</span>
    </button>
  )
})
