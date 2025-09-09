/**
 * 錯誤追蹤儀表板組件
 * 供管理員查看客戶端錯誤和使用統計
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useErrorTracking } from '@/hooks/useErrorTracking'
import { logger } from '@/lib/logger'

interface FormStats {
  formType: string
  total: number
  success: number
  rate: number
}

interface UserAction {
  action: string
  path: string
  timestamp: number
  metadata?: Record<string, unknown>
}

export function ErrorTrackingDashboard() {
  const { getFormSuccessRate } = useErrorTracking()
  const [formStats, setFormStats] = useState<FormStats[]>([])
  const [userActions, setUserActions] = useState<UserAction[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 載入表單統計
    const loadFormStats = () => {
      const formTypes = ['inquiry_form'] // 可以添加更多表單類型
      const stats = formTypes.map(formType => ({
        formType,
        ...getFormSuccessRate(formType),
      }))
      setFormStats(stats)
    }

    // 載入使用者行為
    const loadUserActions = () => {
      try {
        const stored = localStorage.getItem('user_actions') || '[]'
        const actions: UserAction[] = JSON.parse(stored)
        // 只顯示最近 24 小時的行為
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
        const recentActions = actions.filter(action => action.timestamp > oneDayAgo)
        setUserActions(recentActions.slice(-20)) // 最近 20 筆
      } catch (error) {
        logger.warn('載入使用者行為失敗', {
          module: 'ErrorTrackingDashboard',
          metadata: { error: error instanceof Error ? error.message : String(error) },
        })
      }
    }

    if (isVisible) {
      loadFormStats()
      loadUserActions()
    }
  }, [isVisible, getFormSuccessRate])

  // 格式化時間
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 取得成功率顏色
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  // 清除統計資料
  const clearStats = () => {
    if (confirm('確定要清除所有統計資料嗎？')) {
      localStorage.removeItem('user_actions')
      const formTypes = ['inquiry_form']
      formTypes.forEach(formType => {
        localStorage.removeItem(`form_stats_${formType}`)
      })
      setFormStats([])
      setUserActions([])
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 開關按鈕 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        title="錯誤追蹤儀表板"
      >
        📊 監控
      </button>

      {/* 儀表板內容 */}
      {isVisible && (
        <div className="absolute bottom-12 right-0 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-96 max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">監控儀表板</h3>
            <div className="flex space-x-2">
              <button
                onClick={() => window.location.reload()}
                className="text-gray-500 hover:text-gray-700"
                title="重新載入"
              >
                🔄
              </button>
              <button
                onClick={clearStats}
                className="text-red-500 hover:text-red-700"
                title="清除統計"
              >
                🗑️
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
          </div>

          {/* 表單成功率 */}
          <div className="mb-4">
            <h4 className="text-md font-medium text-gray-800 mb-2">表單成功率</h4>
            {formStats.length > 0 ? (
              <div className="space-y-2">
                {formStats.map(stat => (
                  <div key={stat.formType} className="bg-gray-50 p-2 rounded">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        {stat.formType === 'inquiry_form' ? '詢價表單' : stat.formType}
                      </span>
                      <span className={`text-sm font-medium ${getSuccessRateColor(stat.rate)}`}>
                        {stat.rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      成功: {stat.success} / 總計: {stat.total}
                    </div>
                    {stat.total > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div
                          className={`h-1 rounded-full ${
                            stat.rate >= 80
                              ? 'bg-green-500'
                              : stat.rate >= 60
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${stat.rate}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暫無統計資料</p>
            )}
          </div>

          {/* 最近使用者行為 */}
          <div>
            <h4 className="text-md font-medium text-gray-800 mb-2">
              最近行為 ({userActions.length})
            </h4>
            {userActions.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userActions
                  .slice(-10)
                  .reverse()
                  .map((action, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded text-xs">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {action.action === 'inquiry_form_submit'
                              ? '📝 提交詢價表單'
                              : action.action === 'navigation'
                                ? '🔗 頁面導航'
                                : action.action}
                          </div>
                          <div className="text-gray-600 mt-1">{action.path}</div>
                          {action.metadata && Object.keys(action.metadata).length > 0 && (
                            <div className="text-gray-500 mt-1">
                              {Object.entries(action.metadata).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}:{' '}
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs ml-2">
                          {formatTime(action.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">暫無行為記錄</p>
            )}
          </div>

          {/* 說明 */}
          <div className="mt-4 pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              此儀表板僅在開發環境顯示，用於監控客戶端錯誤和使用者行為。
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// 只在開發環境或有管理員權限時顯示
export function ConditionalErrorTrackingDashboard({
  showInDevelopment = true,
}: {
  showInDevelopment?: boolean
}) {
  const [shouldShow, setShouldShow] = useState(false)

  useEffect(() => {
    // 檢查是否應該顯示儀表板
    const isDevelopment = process.env.NODE_ENV === 'development'
    const hasAdminRole =
      typeof window !== 'undefined' && localStorage.getItem('user_role') === 'admin'

    setShouldShow((isDevelopment && showInDevelopment) || hasAdminRole)
  }, [showInDevelopment])

  if (!shouldShow) {
    return null
  }

  return <ErrorTrackingDashboard />
}
