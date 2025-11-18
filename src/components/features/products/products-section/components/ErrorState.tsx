/**
 * 錯誤狀態元件
 */

import React from 'react'

interface ErrorStateProps {
  error: string
  onRetry: () => void
}

export const ErrorState = React.memo(function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <section id="products" className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-5xl md:text-6xl font-bold text-center text-gray-900 mb-16 tracking-wider">
          經典產品
        </h2>
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-600 mb-4">載入產品時發生錯誤</div>
            <p className="text-sm text-red-700 mb-4">{error}</p>
            <button
              onClick={onRetry}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
            >
              重新載入
            </button>
          </div>
        </div>
      </div>
    </section>
  )
})
