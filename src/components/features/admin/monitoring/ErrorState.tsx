import React from 'react'
import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  /** 錯誤訊息 */
  error: string
}

/**
 * 監控數據載入失敗狀態元件
 */
export const ErrorState = React.memo<ErrorStateProps>(({ error }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <div className="flex items-center">
        <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
        <h3 className="text-sm font-medium text-red-800">載入失敗</h3>
      </div>
      <div className="mt-2 text-sm text-red-700">{error}</div>
    </div>
  )
})

ErrorState.displayName = 'ErrorState'
