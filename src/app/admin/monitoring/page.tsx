'use client'

import dynamic from 'next/dynamic'
import { AdminProtection } from '@/components/features/admin/AdminProtection'
import { GoogleAnalyticsSection } from '@/components/features/admin/monitoring/GoogleAnalyticsSection'

// 動態導入監控儀表板組件以減少初始 Bundle 大小
const MonitoringDashboard = dynamic(
  () =>
    import('@/components/features/admin/MonitoringDashboard').then(mod => mod.MonitoringDashboard),
  {
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">載入監控儀表板中...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

export default function AdminMonitoringPage() {
  return (
    <AdminProtection>
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                系統監控與分析
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2">
                監控系統運行狀態、效能指標和網站分析
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
          {/* 動態載入的監控儀表板 */}
          <MonitoringDashboard />

          {/* Google Analytics 區塊 */}
          <GoogleAnalyticsSection />
        </div>
      </div>
    </AdminProtection>
  )
}
