'use client'

import React, { useState } from 'react'
import {
  ExclamationTriangleIcon,
  ArrowPathIcon,
  XMarkIcon,
  InformationCircleIcon,
  ShieldExclamationIcon,
  WifiIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline'
import { UploadError, UploadErrorHandler } from '@/lib/upload/UploadErrorHandler'

export interface UploadErrorDisplayProps {
  error: UploadError
  fileName?: string
  attemptNumber?: number
  maxRetries?: number
  onRetry?: () => void
  onDismiss?: () => void
  onRemove?: () => void
  showDetails?: boolean
  compact?: boolean
}

/**
 * 上傳錯誤顯示元件
 *
 * 功能特色：
 * - 分類錯誤圖標顯示
 * - 用戶友好的錯誤訊息
 * - 操作建議和重試按鈕
 * - 可展開的詳細資訊
 */
export function UploadErrorDisplay({
  error,
  fileName,
  attemptNumber = 1,
  maxRetries = 3,
  onRetry,
  onDismiss,
  onRemove,
  showDetails = false,
  compact = false,
}: UploadErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(showDetails)

  // 根據錯誤類型選擇圖標
  const getErrorIcon = () => {
    switch (error.type) {
      case 'network':
        return <WifiIcon className="w-5 h-5 text-red-500" />
      case 'permission':
        return <ShieldExclamationIcon className="w-5 h-5 text-red-500" />
      case 'file_type':
      case 'file_size':
        return <DocumentIcon className="w-5 h-5 text-red-500" />
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
    }
  }

  // 根據錯誤類型選擇背景色
  const getBgColor = () => {
    switch (error.type) {
      case 'cancelled':
        return 'bg-gray-50 border-gray-200'
      case 'permission':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-red-50 border-red-200'
    }
  }

  // 建立恢復建議
  const recoveryActions = UploadErrorHandler.getRecoveryActions(error)

  if (compact) {
    return (
      <div className={`flex items-center p-2 rounded border ${getBgColor()}`}>
        {getErrorIcon()}
        <div className="ml-2 flex-1 min-w-0">
          <p className="text-sm text-red-800 truncate">{error.userFriendlyMessage}</p>
        </div>
        <div className="ml-2 flex items-center space-x-1">
          {error.retryable && onRetry && attemptNumber < maxRetries && (
            <button onClick={onRetry} className="text-red-600 hover:text-red-800 p-1" title="重試">
              <ArrowPathIcon className="w-4 h-4" />
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-red-600 hover:text-red-800 p-1"
              title="關閉"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-lg border p-4 ${getBgColor()}`}>
      {/* 錯誤標題 */}
      <div className="flex items-start">
        <div className="flex-shrink-0">{getErrorIcon()}</div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {fileName ? `${fileName} 上傳失敗` : '上傳失敗'}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-red-700">
              {UploadErrorHandler.createRetryMessage(error, attemptNumber, maxRetries)}
            </p>
          </div>

          {/* 操作按鈕 */}
          <div className="mt-4 flex items-center space-x-3">
            {error.retryable && onRetry && attemptNumber < maxRetries && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                重試上傳
              </button>
            )}

            {onRemove && (
              <button
                onClick={onRemove}
                className="text-xs font-medium text-red-700 hover:text-red-600"
              >
                移除檔案
              </button>
            )}

            {!isExpanded && (recoveryActions.length > 1 || error.details) && (
              <button
                onClick={() => setIsExpanded(true)}
                className="text-xs font-medium text-red-700 hover:text-red-600"
              >
                查看詳情
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs font-medium text-gray-600 hover:text-gray-500 ml-auto"
              >
                關閉
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 展開的詳細資訊 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-red-200">
          {/* 錯誤詳情 */}
          {error.details && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-red-800 mb-1">錯誤詳情：</h4>
              <p className="text-xs text-red-700 bg-red-100 p-2 rounded">{error.details}</p>
            </div>
          )}

          {/* 恢復建議 */}
          {recoveryActions.length > 0 && (
            <div className="mb-3">
              <h4 className="text-xs font-medium text-red-800 mb-2 flex items-center">
                <InformationCircleIcon className="w-4 h-4 mr-1" />
                解決建議：
              </h4>
              <ul className="space-y-1">
                {recoveryActions.map((action, index) => (
                  <li key={index} className="text-xs text-red-700 flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 技術資訊 */}
          {(error.errorCode || error.type !== 'unknown') && (
            <div className="text-xs text-gray-600 pt-2 border-t border-red-100">
              <span className="font-medium">技術資訊：</span>
              {error.errorCode && <span> 錯誤代碼: {error.errorCode}</span>}
              <span> | 錯誤類型: {error.type}</span>
              <span>
                {' '}
                | 嘗試次數: {attemptNumber}/{maxRetries}
              </span>
            </div>
          )}

          {/* 收起按鈕 */}
          <div className="mt-3 pt-2 border-t border-red-100">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-xs font-medium text-red-600 hover:text-red-500"
            >
              收起詳情
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 批量錯誤摘要元件
 */
export interface BatchErrorSummaryProps {
  errors: Array<{
    fileName: string
    error: UploadError
    attemptNumber: number
  }>
  onRetryAll?: () => void
  onClearAll?: () => void
}

export function BatchErrorSummary({ errors, onRetryAll, onClearAll }: BatchErrorSummaryProps) {
  const errorTypes = errors.reduce(
    (acc, { error }) => {
      acc[error.type] = (acc[error.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const retryableErrors = errors.filter(({ error }) => error.retryable)

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">{errors.length} 個檔案上傳失敗</h3>

          {/* 錯誤類型統計 */}
          <div className="mt-2 text-xs text-red-700">
            {Object.entries(errorTypes).map(([type, count]) => (
              <span key={type} className="inline-block mr-4">
                {type}: {count}
              </span>
            ))}
          </div>

          {/* 批量操作 */}
          <div className="mt-4 flex items-center space-x-3">
            {retryableErrors.length > 0 && onRetryAll && (
              <button
                onClick={onRetryAll}
                className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <ArrowPathIcon className="w-4 h-4 mr-1" />
                重試全部 ({retryableErrors.length})
              </button>
            )}

            {onClearAll && (
              <button
                onClick={onClearAll}
                className="text-xs font-medium text-red-700 hover:text-red-600"
              >
                清除全部錯誤
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
