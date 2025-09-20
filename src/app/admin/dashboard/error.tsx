'use client'

import { useEffect } from 'react'
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 記錄錯誤到客戶端日誌
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">載入管理控台時發生錯誤</h1>

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6 max-w-2xl mx-auto">
            <p className="text-red-800 mb-4">抱歉，管理控台暫時無法載入。這可能是由於以下原因：</p>
            <ul className="text-red-700 text-left space-y-2">
              <li>• 網路連線問題</li>
              <li>• 認證狀態異常</li>
              <li>• 伺服器暫時無法回應</li>
              <li>• 瀏覽器快取問題</li>
            </ul>
          </div>

          {error.message && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 mb-6 max-w-2xl mx-auto">
              <p className="text-sm text-gray-600 font-mono">錯誤詳情: {error.message}</p>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">錯誤 ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="space-x-4">
            <button
              onClick={reset}
              className="inline-flex items-center space-x-2 bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span>重新載入</span>
            </button>

            <a
              href="/admin"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回管理主頁
            </a>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>如果問題持續發生，請聯繫系統管理員</p>
            <p className="mt-2">或嘗試清除瀏覽器快取後重新載入頁面</p>
          </div>
        </div>
      </div>
    </div>
  )
}
