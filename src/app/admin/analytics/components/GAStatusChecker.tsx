'use client'

import { useState, useEffect } from 'react'
import { checkGAStatus } from '@/lib/analytics'

interface GAStatus {
  isLoaded: boolean
  hasValidId: boolean
  measurementId: string | null
}

/**
 * GA 狀態檢查器 - Client Component
 *
 * 此元件必須在客戶端執行，因為需要檢查 window.gtag
 */
export function GAStatusChecker() {
  const [gaStatus, setGAStatus] = useState<GAStatus | null>(null)

  useEffect(() => {
    const status = checkGAStatus()
    setGAStatus(status)
  }, [])

  if (!gaStatus) {
    return <p className="text-gray-500">正在檢查 GA4 狀態...</p>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${gaStatus.hasValidId ? 'bg-green-500' : 'bg-yellow-500'}`}
        ></span>
        <span className="text-sm">測量 ID: {gaStatus.measurementId || '未設定'}</span>
      </div>
      <div className="flex items-center space-x-3">
        <span
          className={`inline-block w-3 h-3 rounded-full ${gaStatus.isLoaded ? 'bg-green-500' : 'bg-red-500'}`}
        ></span>
        <span className="text-sm">GA 腳本: {gaStatus.isLoaded ? '已載入' : '未載入'}</span>
      </div>

      {!gaStatus.hasValidId && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ 請在 <code className="bg-yellow-200 px-1 rounded">.env.local</code> 中設定有效的
            <code className="bg-yellow-200 px-1 rounded">NEXT_PUBLIC_GA_MEASUREMENT_ID</code>
          </p>
        </div>
      )}

      {gaStatus.hasValidId && !gaStatus.isLoaded && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">
            ❌ GA4 腳本載入失敗，請檢查網路連線或測量 ID 是否正確
          </p>
        </div>
      )}

      {gaStatus.hasValidId && gaStatus.isLoaded && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            ✅ Google Analytics 4 已成功整合！數據將在 24-48 小時內開始顯示。
          </p>
          <p className="text-green-700 text-xs mt-2">
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
  )
}
