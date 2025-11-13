'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, AlertTriangle, RotateCw } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface SubmissionStatus {
  isSubmitting: boolean
  isComplete: boolean
  progress: number
  currentStep: string
  message?: string
  warnings?: string[]
  errors?: string[]
}

export interface SubmissionProgressProps {
  status: SubmissionStatus
  onComplete?: () => void
  showDetails?: boolean
  className?: string
}

/**
 * 提交進度指示器元件
 *
 * 功能特色：
 * - 實時進度顯示
 * - 步驟追蹤
 * - 錯誤與警告提示
 * - 動畫效果
 */
export function SubmissionProgress({
  status,
  onComplete,
  showDetails = true,
  className = '',
}: SubmissionProgressProps) {
  const [displayProgress, setDisplayProgress] = useState(0)

  // 平滑進度條動畫
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(status.progress)
    }, 100)

    return () => clearTimeout(timer)
  }, [status.progress])

  // 完成回調
  useEffect(() => {
    if (status.isComplete && onComplete) {
      const timer = setTimeout(onComplete, 1500)
      return () => clearTimeout(timer)
    }
  }, [status.isComplete, onComplete])

  // 決定顯示狀態
  const getStatusDisplay = () => {
    if (status.errors && status.errors.length > 0) {
      return {
        icon: <AlertTriangle className="w-5 h-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        progressColor: 'bg-red-500',
      }
    }

    if (status.isComplete) {
      return {
        icon: <CheckCircle className="w-5 h-5" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        progressColor: 'bg-green-500',
      }
    }

    return {
      icon: <RotateCw className="w-5 h-5 animate-spin" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      progressColor: 'bg-blue-500',
    }
  }

  const statusDisplay = getStatusDisplay()

  if (
    !status.isSubmitting &&
    !status.isComplete &&
    (!status.errors || status.errors.length === 0)
  ) {
    return null
  }

  return (
    <div
      className={cn(
        'border rounded-lg p-4',
        statusDisplay.bgColor,
        statusDisplay.borderColor,
        className
      )}
    >
      {/* 標題區域 */}
      <div className="flex items-center space-x-3 mb-3">
        <div className={statusDisplay.color}>{statusDisplay.icon}</div>
        <div>
          <h3 className={cn('font-medium', statusDisplay.color)}>
            {status.isComplete ? '提交完成' : status.errors?.length ? '提交失敗' : '正在提交'}
          </h3>
          {status.message && <p className="text-sm text-gray-600 mt-1">{status.message}</p>}
        </div>
      </div>

      {/* 進度條 */}
      {status.isSubmitting && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{status.currentStep}</span>
            <span>{Math.round(displayProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500 ease-out',
                statusDisplay.progressColor
              )}
              style={{ width: `${displayProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 詳細資訊 */}
      {showDetails && (
        <div className="space-y-2">
          {/* 錯誤訊息 */}
          {status.errors && status.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">錯誤詳情：</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {status.errors.map((error, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 警告訊息 */}
          {status.warnings && status.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">注意事項：</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {status.warnings.map((warning, index) => (
                  <li key={index} className="flex items-start">
                    <span className="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full mt-1.5 mr-2 flex-shrink-0" />
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 成功詳情 */}
          {status.isComplete && !status.errors?.length && (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <p className="text-sm text-green-700">✓ 產品已成功創建並保存</p>
              {status.warnings && status.warnings.length === 0 && (
                <p className="text-sm text-green-600 mt-1">所有操作均正常完成，沒有警告或錯誤</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 操作按鈕 */}
      {status.isComplete && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            {status.errors && status.errors.length > 0 ? (
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-300 rounded-lg hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                重試
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (window.location.href = '/admin/products')}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                查看產品列表
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * 簡化版本的提交狀態顯示
 */
export function SimpleSubmissionStatus({
  isSubmitting,
  error,
  success,
}: {
  isSubmitting: boolean
  error?: string | null
  success?: string | null
}) {
  if (!isSubmitting && !error && !success) return null

  return (
    <div className="mb-4">
      {isSubmitting && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <RotateCw className="w-5 h-5 text-blue-600 animate-spin mr-3" />
            <span className="text-blue-800">正在提交，請稍候...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}
    </div>
  )
}
