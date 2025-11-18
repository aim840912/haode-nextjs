import React from 'react'
import { CheckCircle, AlertCircle, Info } from 'lucide-react'
import { InputState } from '../types'

interface StatusIconProps {
  inputState: InputState
}

/**
 * 狀態圖標元件
 */
export const StatusIcon = React.memo(function StatusIcon({ inputState }: StatusIconProps) {
  switch (inputState) {
    case 'error':
      return <AlertCircle className="w-5 h-5 text-red-500" />
    case 'success':
      return <CheckCircle className="w-5 h-5 text-green-500" />
    case 'validating':
      return (
        <div className="w-5 h-5">
          <svg className="animate-spin w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )
    case 'warning':
      return <Info className="w-5 h-5 text-yellow-500" />
    default:
      return null
  }
})
