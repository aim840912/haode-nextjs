/**
 * Toast 進度條元件
 */

import React from 'react'

interface ToastProgressBarProps {
  progress: number
}

export const ToastProgressBar = React.memo(function ToastProgressBar({
  progress,
}: ToastProgressBarProps) {
  return (
    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
      <div
        className="bg-amber-600 h-1.5 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
      />
    </div>
  )
})
