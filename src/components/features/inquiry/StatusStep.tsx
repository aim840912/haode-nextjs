'use client'

import { InquiryStatus, INQUIRY_STATUS_LABELS } from '@/types/inquiry'

interface StatusStepProps {
  status: InquiryStatus
  isActive: boolean
  isCompleted: boolean
  timestamp?: string
  description?: string
  stepNumber: number
  isLast?: boolean
  layout?: 'horizontal' | 'vertical'
}

export default function StatusStep({
  status,
  isActive,
  isCompleted,
  timestamp,
  description,
  stepNumber,
  isLast = false,
  layout = 'horizontal',
}: StatusStepProps) {
  // 狀態圖標對應
  const statusIcons = {
    pending: '📝',
    quoted: '💬',
    confirmed: '✅',
    completed: '🎉',
    cancelled: '❌',
  }

  // 狀態顏色配置
  const getStatusColors = () => {
    if (isCompleted) {
      return 'bg-green-500 border-green-500 text-white'
    } else if (isActive) {
      return 'bg-amber-500 border-amber-500 text-white'
    } else {
      return 'bg-gray-200 border-gray-300 text-gray-500'
    }
  }

  // 連接線顏色
  const getConnectorColor = () => {
    return isCompleted ? 'bg-green-500' : 'bg-gray-300'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (layout === 'vertical') {
    return (
      <div className="flex items-start space-x-4">
        {/* 狀態指示器和連接線 */}
        <div className="flex flex-col items-center">
          <div
            className={`
              w-10 h-10 rounded-full border-2 flex items-center justify-center
              font-semibold text-sm transition-all duration-300
              ${getStatusColors()}
              ${isActive ? 'ring-4 ring-amber-200 scale-105' : ''}
            `}
          >
            <span className="text-lg">{statusIcons[status]}</span>
          </div>
          {!isLast && (
            <div className={`w-1 h-16 mt-2 transition-all duration-500 ${getConnectorColor()}`} />
          )}
        </div>

        {/* 狀態內容 */}
        <div className="flex-1 pb-8">
          <div className="flex items-center justify-between mb-1">
            <h3
              className={`font-semibold transition-all duration-300 ${
                isActive
                  ? 'text-amber-900 text-lg'
                  : isCompleted
                    ? 'text-green-800'
                    : 'text-gray-600'
              }`}
            >
              {INQUIRY_STATUS_LABELS[status]}
            </h3>
            {timestamp && (
              <span className="text-sm text-gray-500">{formatTimestamp(timestamp)}</span>
            )}
          </div>
          {description && (
            <p
              className={`text-sm transition-all duration-300 ${
                isActive ? 'text-gray-700' : 'text-gray-500'
              }`}
            >
              {description}
            </p>
          )}
        </div>
      </div>
    )
  }

  // 水平佈局
  return (
    <div className="flex items-center">
      {/* 狀態指示器 */}
      <div className="flex flex-col items-center space-y-2">
        <div
          className={`
            w-12 h-12 rounded-full border-2 flex items-center justify-center
            font-semibold transition-all duration-300
            ${getStatusColors()}
            ${isActive ? 'ring-4 ring-amber-200 scale-105 shadow-lg' : ''}
          `}
        >
          <span className="text-xl">{statusIcons[status]}</span>
        </div>

        {/* 狀態標籤 */}
        <div className="text-center">
          <div
            className={`text-sm font-semibold transition-all duration-300 ${
              isActive ? 'text-amber-900' : isCompleted ? 'text-green-800' : 'text-gray-600'
            }`}
          >
            {INQUIRY_STATUS_LABELS[status]}
          </div>
          {timestamp && (
            <div className="text-xs text-gray-500 mt-1">{formatTimestamp(timestamp)}</div>
          )}
        </div>

        {/* 描述文字 */}
        {description && (
          <div
            className={`text-xs text-center max-w-24 transition-all duration-300 ${
              isActive ? 'text-gray-700' : 'text-gray-500'
            }`}
          >
            {description}
          </div>
        )}
      </div>

      {/* 連接線 */}
      {!isLast && (
        <div className={`flex-1 h-1 mx-4 transition-all duration-500 ${getConnectorColor()}`} />
      )}
    </div>
  )
}
