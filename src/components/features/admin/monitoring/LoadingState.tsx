import React from 'react'

/**
 * 監控數據載入中狀態元件
 */
export const LoadingState = React.memo(() => {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">載入監控數據中...</p>
      </div>
    </div>
  )
})

LoadingState.displayName = 'LoadingState'
