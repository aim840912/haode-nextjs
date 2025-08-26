'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { checkGAStatus } from '@/lib/analytics'
import GA4TrackingExamples from '@/components/examples/GA4TrackingExamples'

interface GAStatus {
  isLoaded: boolean
  hasValidId: boolean
  measurementId: string | null
}

export default function AnalyticsPage() {
  const { user, isLoading } = useAuth()
  const [gaStatus, setGAStatus] = useState<GAStatus | null>(null)

  useEffect(() => {
    if (!isLoading && user) {
      checkGoogleAnalytics()
    }
  }, [isLoading, user])

  const checkGoogleAnalytics = () => {
    const status = checkGAStatus()
    setGAStatus(status)
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">載入中...</p>
        </div>
      </div>
    )
  }

  // 未登入檢查
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="text-6xl mb-8">🔒</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">需要登入</h1>
          <p className="text-gray-600 mb-8">此頁面需要管理員權限才能存取</p>
          <div className="space-x-4">
            <Link
              href="/login"
              className="inline-block bg-amber-900 text-white px-6 py-3 rounded-lg hover:bg-amber-800 transition-colors"
            >
              立即登入
            </Link>
            <Link
              href="/"
              className="inline-block border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              回到首頁
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* 頁面標題 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">📊 Google Analytics 4</h1>
              <p className="text-gray-600">專業的網站分析和用戶行為追蹤</p>
            </div>
            <Link
              href="/admin/dashboard"
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              返回主控台
            </Link>
          </div>
        </div>

        {/* GA4 狀態卡片 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🔗</span>
              Google Analytics 4 狀態
            </h2>
            
            {gaStatus ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className={`inline-block w-3 h-3 rounded-full ${gaStatus.hasValidId ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                  <span className="text-sm">
                    測量 ID: {gaStatus.measurementId || '未設定'}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-block w-3 h-3 rounded-full ${gaStatus.isLoaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">
                    GA 腳本: {gaStatus.isLoaded ? '已載入' : '未載入'}
                  </span>
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
                      你可以到 <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="underline">Google Analytics</a> 查看詳細報表
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">正在檢查 GA4 狀態...</p>
            )}
          </div>
        </div>

        {/* 快速訪問 */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <span className="mr-2">🚀</span>
              快速訪問
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-blue-900">Google Analytics</h3>
                    <p className="text-sm text-gray-600">查看詳細報表</p>
                  </div>
                </div>
              </a>

              <a
                href="https://analytics.google.com/analytics/web/#/realtime"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-green-900">即時報表</h3>
                    <p className="text-sm text-gray-600">查看當前訪客</p>
                  </div>
                </div>
              </a>

              <a
                href="https://analytics.google.com/analytics/web/#/audience"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="font-medium text-gray-900 group-hover:text-purple-900">用戶分析</h3>
                    <p className="text-sm text-gray-600">用戶行為統計</p>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* 追蹤實作範例 */}
        <div className="mb-8">
          <GA4TrackingExamples />
        </div>

        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">📖 使用說明</h3>
          <div className="text-blue-800 text-sm space-y-2">
            <p>• <strong>Google Analytics 4</strong>：提供詳細的用戶行為分析和轉換追蹤</p>
            <p>• <strong>設定完成</strong>：GA4 已整合到網站，會自動追蹤頁面瀏覽和用戶互動</p>
            <p>• <strong>數據顯示</strong>：GA4 數據通常需要 24-48 小時才會開始顯示</p>
            <p>• <strong>追蹤事件</strong>：參考上方範例將追蹤函數整合到你的組件中</p>
            <p>• <strong>深度分析</strong>：前往 Google Analytics 網站查看完整的分析報表</p>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 追蹤功能</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 自動頁面瀏覽追蹤</li>
              <li>• 用戶互動事件追蹤</li>
              <li>• 電商轉換追蹤</li>
              <li>• 錯誤和效能監控</li>
              <li>• 自定義事件追蹤</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📈 分析報表</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 即時訪客監控</li>
              <li>• 流量來源分析</li>
              <li>• 用戶行為路徑</li>
              <li>• 轉換漏斗分析</li>
              <li>• 自定義儀表板</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}