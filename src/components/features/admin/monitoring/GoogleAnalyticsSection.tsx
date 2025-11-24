'use client'

import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { GA4TrackingExamples } from '@/components/examples/GA4TrackingExamples'
import { checkGAStatus } from '@/lib/analytics'

interface GAStatus {
  isLoaded: boolean
  hasValidId: boolean
  measurementId: string | null
}

export function GoogleAnalyticsSection() {
  const [gaStatus, setGAStatus] = useState<GAStatus | null>(null)

  useEffect(() => {
    const status = checkGAStatus()
    setGAStatus(status)
  }, [])

  return (
    <div className="space-y-8">
      {/* 區塊標題 */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Google Analytics 4</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">網站分析和用戶行為追蹤</p>
      </div>

      {/* GA4 狀態卡片 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">GA4 狀態</h3>

        {gaStatus ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span
                className={`inline-block w-3 h-3 rounded-full ${gaStatus.hasValidId ? 'bg-green-500' : 'bg-yellow-500'}`}
              ></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                測量 ID: {gaStatus.measurementId || '未設定'}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span
                className={`inline-block w-3 h-3 rounded-full ${gaStatus.isLoaded ? 'bg-green-500' : 'bg-red-500'}`}
              ></span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                GA 腳本: {gaStatus.isLoaded ? '已載入' : '未載入'}
              </span>
            </div>

            {!gaStatus.hasValidId && (
              <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                  請在{' '}
                  <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">.env.local</code>{' '}
                  中設定有效的{' '}
                  <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
                    NEXT_PUBLIC_GA_MEASUREMENT_ID
                  </code>
                </p>
              </div>
            )}

            {gaStatus.hasValidId && !gaStatus.isLoaded && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
                <p className="text-red-800 dark:text-red-300 text-sm">
                  GA4 腳本載入失敗，請檢查網路連線或測量 ID 是否正確
                </p>
              </div>
            )}

            {gaStatus.hasValidId && gaStatus.isLoaded && (
              <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg">
                <p className="text-green-800 dark:text-green-300 text-sm">
                  Google Analytics 4 已成功整合！數據將在 24-48 小時內開始顯示。
                </p>
                <p className="text-green-700 dark:text-green-400 text-xs mt-2">
                  你可以到{' '}
                  <a
                    href="https://analytics.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                  >
                    Google Analytics
                  </a>{' '}
                  查看詳細報表
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">正在檢查 GA4 狀態...</p>
        )}
      </div>

      {/* 快速訪問 */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">快速訪問</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="https://analytics.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-blue-300 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-900 dark:group-hover:text-blue-300">
                  Google Analytics
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">查看詳細報表</p>
              </div>
            </div>
          </a>

          <a
            href="https://analytics.google.com/analytics/web/#/realtime"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-green-300 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-green-900 dark:group-hover:text-green-300">
                  即時報表
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">查看當前訪客</p>
              </div>
            </div>
          </a>

          <a
            href="https://analytics.google.com/analytics/web/#/audience"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-purple-300 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors group"
          >
            <div className="flex items-center space-x-3">
              <svg
                className="w-8 h-8 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-purple-900 dark:group-hover:text-purple-300">
                  用戶分析
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">用戶行為統計</p>
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* 追蹤實作範例 */}
      <GA4TrackingExamples />

      {/* 功能特色 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">追蹤功能</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• 自動頁面瀏覽追蹤</li>
            <li>• 用戶互動事件追蹤</li>
            <li>• 電商轉換追蹤</li>
            <li>• 錯誤和效能監控</li>
            <li>• 自定義事件追蹤</li>
          </ul>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-600 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">分析報表</h3>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <li>• 即時訪客監控</li>
            <li>• 流量來源分析</li>
            <li>• 用戶行為路徑</li>
            <li>• 轉換漏斗分析</li>
            <li>• 自定義儀表板</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
