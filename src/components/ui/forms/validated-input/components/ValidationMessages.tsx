import React from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'

interface ValidationMessagesProps {
  id: string
  error?: string
  warning?: string
  success?: string
  helpText?: string
}

/**
 * 驗證訊息顯示元件
 */
export const ValidationMessages = React.memo(function ValidationMessages({
  id,
  error,
  warning,
  success,
  helpText,
}: ValidationMessagesProps) {
  return (
    <div className="space-y-1">
      {/* 錯誤訊息 */}
      {error && (
        <p id={`${id}-error`} className="text-sm text-red-600 flex items-center" role="alert">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* 警告訊息 */}
      {warning && !error && (
        <p id={`${id}-warning`} className="text-sm text-yellow-600 flex items-center">
          <Info className="w-4 h-4 mr-1 flex-shrink-0" />
          {warning}
        </p>
      )}

      {/* 成功訊息 */}
      {success && !error && !warning && (
        <p id={`${id}-success`} className="text-sm text-green-600 flex items-center">
          <CheckCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {/* 說明文字 */}
      {helpText && !error && !warning && !success && (
        <p id={`${id}-help`} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}
    </div>
  )
})
